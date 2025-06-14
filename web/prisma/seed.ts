import { PrismaClient } from '@prisma/client';
import { seedMasterData } from './seed-master';
import { seedTestData } from './seed-test';

// キャッシュをクリアして新しいPrismaクライアントを作成
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function main() {
  console.log('🌱 データベースシード開始...\n');

  // マスターデータを投入
  await seedMasterData(prisma);

  // 開発環境の場合のみテストデータを投入
  if (process.env.NODE_ENV !== 'production') {
    await seedTestData(prisma);
  }

  console.log('\n🎉 すべてのシードが完了しました！');
}

main()
  .catch(async e => {
    console.error('❌ シードエラー:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
