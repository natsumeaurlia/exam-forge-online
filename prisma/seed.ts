import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // テスト用ユーザーを作成
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'テストユーザー',
      image: null,
    },
  });

  console.log({ testUser });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async e => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
