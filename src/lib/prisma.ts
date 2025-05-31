// Mock Prisma client for build environments where Prisma client cannot be generated
const mockPrismaClient = {
  user: {
    findUnique: async () => null,
    create: async () => null,
    update: async () => null,
    delete: async () => null,
  },
  $disconnect: async () => {},
};

let PrismaClient;
let prismaInstance;

try {
  // Try to import the real Prisma client
  const prismaModule = require('@prisma/client');
  PrismaClient = prismaModule.PrismaClient;

  const globalForPrisma = globalThis as unknown as {
    prisma: InstanceType<typeof PrismaClient> | undefined;
  };

  prismaInstance =
    globalForPrisma.prisma ??
    new PrismaClient({
      log: ['query'],
    });

  if (process.env.NODE_ENV !== 'production')
    globalForPrisma.prisma = prismaInstance;
} catch (error) {
  // If Prisma client is not available (e.g., during build), use mock
  console.warn('Prisma client not available, using mock client for build');
  prismaInstance = mockPrismaClient;
}

export const prisma = prismaInstance;
