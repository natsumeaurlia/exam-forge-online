'use server';

import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

const action = createSafeActionClient();

// Validation schemas
const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100),
  description: z.string().optional(),
  parentId: z.string().optional(),
  teamId: z.string(),
});

const updateCategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Category name is required').max(100),
  description: z.string().optional(),
  parentId: z.string().optional(),
});

const deleteCategorySchema = z.object({
  id: z.string(),
});

const reorderCategoriesSchema = z.object({
  categories: z.array(
    z.object({
      id: z.string(),
      order: z.number(),
    })
  ),
});

// Helper function to verify team access
async function verifyTeamAccess(teamId: string, userId: string) {
  const teamMember = await prisma.teamMember.findFirst({
    where: {
      userId,
      teamId,
      role: {
        in: ['OWNER', 'ADMIN'],
      },
    },
  });

  if (!teamMember) {
    throw new Error('Insufficient permissions to manage categories');
  }

  return teamMember;
}

// Get categories for a team with hierarchical structure
export const getCategories = action
  .schema(z.object({ teamId: z.string() }))
  .action(async ({ parsedInput }) => {
    const session = await auth();
    if (!session?.user?.id) {
      redirect('/auth/signin');
    }

    const { teamId } = parsedInput;

    // Verify user has access to the team
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        userId: session.user.id,
        teamId,
      },
    });

    if (!teamMember) {
      throw new Error('Access denied to team categories');
    }

    const categories = await prisma.category.findMany({
      where: { teamId },
      include: {
        children: {
          include: {
            _count: {
              select: {
                bankQuestionCategories: true,
              },
            },
          },
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            bankQuestionCategories: true,
          },
        },
      },
      orderBy: { order: 'asc' },
    });

    // Transform to include question counts
    const categoriesWithCounts = categories.map(category => ({
      ...category,
      questionCount: category._count.bankQuestionCategories,
      children: category.children.map(child => ({
        ...child,
        questionCount: child._count.bankQuestionCategories,
      })),
    }));

    return { success: true, categories: categoriesWithCounts };
  });

// Get a single category by ID
export const getCategory = action
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    const session = await auth();
    if (!session?.user?.id) {
      redirect('/auth/signin');
    }

    const { id } = parsedInput;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        children: {
          orderBy: { order: 'asc' },
        },
        parent: true,
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

    // Verify user has access to the team
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        userId: session.user.id,
        teamId: category.teamId,
      },
    });

    if (!teamMember) {
      throw new Error('Access denied to category');
    }

    return {
      success: true,
      category: {
        ...category,
        questionCount: category._count.bankQuestionCategories,
      },
    };
  });

// Create a new category
export const createCategory = action
  .schema(createCategorySchema)
  .action(async ({ parsedInput }) => {
    const session = await auth();
    if (!session?.user?.id) {
      redirect('/auth/signin');
    }

    const { name, description, parentId, teamId } = parsedInput;

    // Verify user has admin access to the team
    await verifyTeamAccess(teamId, session.user.id);

    // If parentId is provided, verify it exists and belongs to the same team
    if (parentId) {
      const parentCategory = await prisma.category.findUnique({
        where: { id: parentId },
      });

      if (!parentCategory || parentCategory.teamId !== teamId) {
        throw new Error('Invalid parent category');
      }
    }

    // Get the next order value for categories at this level
    const maxOrder = await prisma.category.aggregate({
      where: {
        teamId,
        parentId: parentId || null,
      },
      _max: {
        order: true,
      },
    });

    const nextOrder = (maxOrder._max.order || 0) + 1;

    const category = await prisma.category.create({
      data: {
        name,
        description,
        teamId,
        parentId,
        order: nextOrder,
      },
      include: {
        _count: {
          select: {
            bankQuestionCategories: true,
          },
        },
      },
    });

    revalidatePath('/dashboard/categories');
    revalidatePath('/dashboard/question-bank');

    return {
      success: true,
      category: {
        ...category,
        questionCount: category._count.bankQuestionCategories,
      },
    };
  });

// Update an existing category
export const updateCategory = action
  .schema(updateCategorySchema)
  .action(async ({ parsedInput }) => {
    const session = await auth();
    if (!session?.user?.id) {
      redirect('/auth/signin');
    }

    const { id, name, description, parentId } = parsedInput;

    // Get the existing category to verify team access
    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      throw new Error('Category not found');
    }

    // Verify user has admin access to the team
    await verifyTeamAccess(existingCategory.teamId, session.user.id);

    // If parentId is provided, verify it exists and belongs to the same team
    if (parentId) {
      const parentCategory = await prisma.category.findUnique({
        where: { id: parentId },
      });

      if (
        !parentCategory ||
        parentCategory.teamId !== existingCategory.teamId
      ) {
        throw new Error('Invalid parent category');
      }

      // Prevent creating circular references
      if (parentId === id) {
        throw new Error('A category cannot be its own parent');
      }

      // Check if the parentId would create a circular reference
      const isCircular = await checkCircularReference(id, parentId);
      if (isCircular) {
        throw new Error('This parent would create a circular reference');
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name,
        description,
        parentId,
      },
      include: {
        _count: {
          select: {
            bankQuestionCategories: true,
          },
        },
      },
    });

    revalidatePath('/dashboard/categories');
    revalidatePath('/dashboard/question-bank');

    return {
      success: true,
      category: {
        ...category,
        questionCount: category._count.bankQuestionCategories,
      },
    };
  });

// Delete a category
export const deleteCategory = action
  .schema(deleteCategorySchema)
  .action(async ({ parsedInput }) => {
    const session = await auth();
    if (!session?.user?.id) {
      redirect('/auth/signin');
    }

    const { id } = parsedInput;

    // Get the category to verify team access and check for children
    const category = await prisma.category.findUnique({
      where: { id },
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

    // Verify user has admin access to the team
    await verifyTeamAccess(category.teamId, session.user.id);

    // Check if category has children
    if (category.children.length > 0) {
      throw new Error(
        'Cannot delete category with subcategories. Delete subcategories first.'
      );
    }

    // Check if category has associated questions
    if (category._count.bankQuestionCategories > 0) {
      throw new Error(
        'Cannot delete category with associated questions. Remove questions from category first.'
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    revalidatePath('/dashboard/categories');
    revalidatePath('/dashboard/question-bank');

    return { success: true };
  });

// Reorder categories
export const reorderCategories = action
  .schema(reorderCategoriesSchema)
  .action(async ({ parsedInput }) => {
    const session = await auth();
    if (!session?.user?.id) {
      redirect('/auth/signin');
    }

    const { categories } = parsedInput;

    if (categories.length === 0) {
      return { success: true };
    }

    // Get the first category to verify team access
    const firstCategory = await prisma.category.findUnique({
      where: { id: categories[0].id },
    });

    if (!firstCategory) {
      throw new Error('Category not found');
    }

    // Verify user has admin access to the team
    await verifyTeamAccess(firstCategory.teamId, session.user.id);

    // Update all categories in a transaction
    await prisma.$transaction(
      categories.map(({ id, order }) =>
        prisma.category.update({
          where: { id },
          data: { order },
        })
      )
    );

    revalidatePath('/dashboard/categories');
    revalidatePath('/dashboard/question-bank');

    return { success: true };
  });

// Helper function to check for circular references
async function checkCircularReference(
  categoryId: string,
  parentId: string
): Promise<boolean> {
  let currentParentId = parentId;

  while (currentParentId) {
    if (currentParentId === categoryId) {
      return true; // Circular reference found
    }

    const parent = await prisma.category.findUnique({
      where: { id: currentParentId },
      select: { parentId: true },
    });

    if (!parent) {
      break;
    }

    currentParentId = parent.parentId;
  }

  return false;
}

// Get category tree (hierarchical structure)
export const getCategoryTree = action
  .schema(z.object({ teamId: z.string() }))
  .action(async ({ parsedInput }) => {
    const session = await auth();
    if (!session?.user?.id) {
      redirect('/auth/signin');
    }

    const { teamId } = parsedInput;

    // Verify user has access to the team
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        userId: session.user.id,
        teamId,
      },
    });

    if (!teamMember) {
      throw new Error('Access denied to team categories');
    }

    // Get all categories for the team
    const allCategories = await prisma.category.findMany({
      where: { teamId },
      include: {
        _count: {
          select: {
            bankQuestionCategories: true,
          },
        },
      },
      orderBy: { order: 'asc' },
    });

    // Build hierarchical tree structure
    const categoryMap = new Map();
    const rootCategories: any[] = [];

    // First pass: create map and add question counts
    allCategories.forEach(category => {
      categoryMap.set(category.id, {
        ...category,
        questionCount: category._count.bankQuestionCategories,
        children: [],
      });
    });

    // Second pass: build hierarchy
    allCategories.forEach(category => {
      const categoryWithChildren = categoryMap.get(category.id);

      if (category.parentId) {
        const parent = categoryMap.get(category.parentId);
        if (parent) {
          parent.children.push(categoryWithChildren);
        }
      } else {
        rootCategories.push(categoryWithChildren);
      }
    });

    return { success: true, tree: rootCategories };
  });
