'use server';

import { revalidatePath } from 'next/cache';
import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

const action = createSafeActionClient();

const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  parentId: z.string().optional(),
  order: z.number().default(0),
});

const updateCategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  parentId: z.string().optional(),
  order: z.number().optional(),
});

const deleteCategorySchema = z.object({
  id: z.string(),
});

const getCategoriesSchema = z.object({
  includeChildren: z.boolean().default(true),
});

export const createCategory = action(
  createCategorySchema,
  async ({ name, description, parentId, order }) => {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const teamMember = await prisma.teamMember.findFirst({
      where: {
        userId: session.user.id,
        status: 'ACTIVE',
      },
      include: {
        team: true,
      },
    });

    if (!teamMember) {
      throw new Error('No active team found');
    }

    // Check if parent exists and belongs to the same team
    if (parentId) {
      const parent = await prisma.category.findFirst({
        where: {
          id: parentId,
          teamId: teamMember.teamId,
        },
      });

      if (!parent) {
        throw new Error('Parent category not found');
      }
    }

    // Check for duplicate names within the same team and parent
    const existingCategory = await prisma.category.findFirst({
      where: {
        name,
        teamId: teamMember.teamId,
        parentId: parentId || null,
      },
    });

    if (existingCategory) {
      throw new Error('Category with this name already exists');
    }

    const category = await prisma.category.create({
      data: {
        name,
        description,
        teamId: teamMember.teamId,
        parentId,
        order,
      },
      include: {
        children: true,
        parent: true,
        _count: {
          select: {
            bankQuestionCategories: true,
          },
        },
      },
    });

    revalidatePath('/dashboard/question-bank');
    return { category };
  }
);

export const updateCategory = action(
  updateCategorySchema,
  async ({ id, name, description, parentId, order }) => {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const teamMember = await prisma.teamMember.findFirst({
      where: {
        userId: session.user.id,
        status: 'ACTIVE',
      },
    });

    if (!teamMember) {
      throw new Error('No active team found');
    }

    // Verify category belongs to user's team
    const existingCategory = await prisma.category.findFirst({
      where: {
        id,
        teamId: teamMember.teamId,
      },
    });

    if (!existingCategory) {
      throw new Error('Category not found');
    }

    // Check if parent exists and belongs to the same team (if changing parent)
    if (parentId && parentId !== existingCategory.parentId) {
      // Prevent circular references
      if (parentId === id) {
        throw new Error('Category cannot be its own parent');
      }

      const parent = await prisma.category.findFirst({
        where: {
          id: parentId,
          teamId: teamMember.teamId,
        },
      });

      if (!parent) {
        throw new Error('Parent category not found');
      }

      // Check if the new parent is not a descendant of this category
      const checkCircularReference = async (
        categoryId: string,
        targetParentId: string
      ): Promise<boolean> => {
        const descendants = await prisma.category.findMany({
          where: {
            parentId: categoryId,
          },
          select: {
            id: true,
          },
        });

        for (const descendant of descendants) {
          if (descendant.id === targetParentId) {
            return true;
          }
          if (await checkCircularReference(descendant.id, targetParentId)) {
            return true;
          }
        }
        return false;
      };

      if (await checkCircularReference(id, parentId)) {
        throw new Error('Cannot create circular reference');
      }
    }

    // Check for duplicate names if name is being changed
    if (name && name !== existingCategory.name) {
      const duplicateCategory = await prisma.category.findFirst({
        where: {
          name,
          teamId: teamMember.teamId,
          parentId:
            parentId !== undefined ? parentId : existingCategory.parentId,
          id: { not: id },
        },
      });

      if (duplicateCategory) {
        throw new Error('Category with this name already exists');
      }
    }

    const category = await prisma.category.update({
      where: {
        id,
      },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(parentId !== undefined && { parentId }),
        ...(order !== undefined && { order }),
      },
      include: {
        children: true,
        parent: true,
        _count: {
          select: {
            bankQuestionCategories: true,
          },
        },
      },
    });

    revalidatePath('/dashboard/question-bank');
    return { category };
  }
);

export const deleteCategory = action(deleteCategorySchema, async ({ id }) => {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const teamMember = await prisma.teamMember.findFirst({
    where: {
      userId: session.user.id,
      status: 'ACTIVE',
    },
  });

  if (!teamMember) {
    throw new Error('No active team found');
  }

  // Verify category belongs to user's team
  const category = await prisma.category.findFirst({
    where: {
      id,
      teamId: teamMember.teamId,
    },
    include: {
      children: true,
      _count: {
        select: {
          bankQuestionCategories: true,
        },
      },
    },
  });

  if (!category) {
    throw new Error('Category not found');
  }

  // Check if category has children
  if (category.children.length > 0) {
    throw new Error(
      'Cannot delete category with subcategories. Delete subcategories first.'
    );
  }

  // Check if category is used by questions
  if (category._count.bankQuestionCategories > 0) {
    throw new Error(
      'Cannot delete category that is used by questions. Remove questions from this category first.'
    );
  }

  await prisma.category.delete({
    where: {
      id,
    },
  });

  revalidatePath('/dashboard/question-bank');
  return { success: true };
});

export const getCategories = action(
  getCategoriesSchema,
  async ({ includeChildren }) => {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const teamMember = await prisma.teamMember.findFirst({
      where: {
        userId: session.user.id,
        status: 'ACTIVE',
      },
    });

    if (!teamMember) {
      throw new Error('No active team found');
    }

    const categories = await prisma.category.findMany({
      where: {
        teamId: teamMember.teamId,
      },
      include: {
        ...(includeChildren && {
          children: {
            orderBy: {
              order: 'asc',
            },
            include: {
              _count: {
                select: {
                  bankQuestionCategories: true,
                },
              },
            },
          },
        }),
        parent: true,
        _count: {
          select: {
            bankQuestionCategories: true,
          },
        },
      },
      orderBy: [
        {
          order: 'asc',
        },
        {
          name: 'asc',
        },
      ],
    });

    return { categories };
  }
);

export const getCategoriesForTeam = async (teamId: string) => {
  const categories = await prisma.category.findMany({
    where: {
      teamId,
    },
    include: {
      children: {
        orderBy: {
          order: 'asc',
        },
        include: {
          _count: {
            select: {
              bankQuestionCategories: true,
            },
          },
        },
      },
      parent: true,
      _count: {
        select: {
          bankQuestionCategories: true,
        },
      },
    },
    orderBy: [
      {
        order: 'asc',
      },
      {
        name: 'asc',
      },
    ],
  });

  return categories;
};
