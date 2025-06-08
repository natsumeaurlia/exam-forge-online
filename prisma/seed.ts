import { PrismaClient } from '@prisma/client';
import { seedMasterData } from './seed-master';
import { seedTestData } from './seed-test';

// キャッシュをクリアして新しいPrismaクライアントを作成
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function main() {
  console.log('🌱 データベースシード開始...\n');

  // Prismaクライアントの状態を確認
  console.log('Prismaクライアントのプロパティ:');
  const props = Object.getOwnPropertyNames(prisma);
  const models = props.filter(
    prop =>
      !prop.startsWith('$') &&
      !prop.startsWith('_') &&
      typeof (prisma as any)[prop] === 'object'
  );
  console.log('利用可能なモデル:', models);
  console.log('featureモデルの存在:', models.includes('feature'));

  // Featureモデルを直接確認
  console.log('\nFeatureモデルの直接確認:');
  console.log('prisma.feature:', prisma.feature);
  console.log('typeof prisma.feature:', typeof prisma.feature);
  console.log('');

  // マスターデータを投入
  await seedMasterData(prisma);

  console.log(''); // 空行

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
