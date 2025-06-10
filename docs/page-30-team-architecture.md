# チームベースアーキテクチャ設計書

## 概要

ExamForgeは、チームベースの料金体系を採用しています。各チームは独立した組織として機能し、メンバー数に基づいて課金されます。

## データベース設計

### 1. Team（チーム）
チームは組織の基本単位です。
```prisma
model Team {
  id           String           @id @default(cuid())
  name         String           // チーム名
  slug         String           @unique @db.VarChar(50) // URL用の一意識別子
  description  String?          // チーム説明（任意）
  logo         String?          // ロゴURL（任意）
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt
  creatorId    String          // チーム作成者
  
  // リレーション
  creator      User             @relation("TeamCreator")
  members      TeamMember[]
  invitations  TeamInvitation[]
  quizzes      Quiz[]
  subscription Subscription?
  teamSettings TeamSettings?
  invoices     Invoice[]
  usageRecords UsageRecord[]
}
```

### 2. TeamMember（チームメンバー）
ユーザーとチームの関係を管理します。
```prisma
model TeamMember {
  id        String   @id @default(cuid())
  role      TeamRole @default(MEMBER)
  joinedAt  DateTime @default(now())
  teamId    String
  userId    String
  
  // リレーション
  team      Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([teamId, userId]) // 同じユーザーが同じチームに複数回参加できない
}
```

### 3. TeamRole（チーム内の役割）
```prisma
enum TeamRole {
  OWNER    // オーナー: 全権限、チーム削除、オーナー変更
  ADMIN    // 管理者: メンバー管理、設定変更、請求管理
  MEMBER   // メンバー: クイズ作成・編集・削除
  VIEWER   // 閲覧者: クイズとレポートの閲覧のみ
}
```

### 4. TeamInvitation（チーム招待）
保留中の招待を管理します。
```prisma
model TeamInvitation {
  id          String               @id @default(cuid())
  email       String               // 招待先メールアドレス
  token       String               @unique @default(cuid()) // 招待トークン
  status      TeamInvitationStatus @default(PENDING)
  role        TeamRole             @default(MEMBER)
  expiresAt   DateTime             // 有効期限
  teamId      String
  invitedById String
  
  // リレーション
  team        Team                 @relation(fields: [teamId], references: [id], onDelete: Cascade)
  invitedBy   User                 @relation(fields: [invitedById], references: [id])
}
```

### 5. TeamSettings（チーム設定）
```prisma
model TeamSettings {
  id                    String      @id @default(cuid())
  maxMembers            Int         @default(5) // 最大メンバー数
  allowMemberInvite     Boolean     @default(false) // メンバーが他者を招待可能か
  requireApproval       Boolean     @default(true) // 参加に承認が必要か
  defaultQuizVisibility SharingMode @default(URL)
  teamId                String      @unique
  
  // リレーション
  team                  Team        @relation(fields: [teamId], references: [id], onDelete: Cascade)
}
```

## 課金システム

### 1. Subscription（サブスクリプション）の変更
```prisma
model Subscription {
  id                   String             @id @default(cuid())
  // Stripe関連フィールド
  stripeSubscriptionId String             @unique
  stripeCustomerId     String
  // ... その他のStripeフィールド
  
  // チーム関連
  teamId               String             @unique
  planId               String
  memberCount          Int                @default(1) // 現在のメンバー数
  pricePerMember       Int                @default(0) // メンバー単価（セント）
  
  // リレーション
  team                 Team               @relation(fields: [teamId], references: [id], onDelete: Cascade)
  plan                 Plan               @relation(fields: [planId], references: [id])
}
```

### 2. Plan（プラン）の拡張
```prisma
model Plan {
  id                     String         @id @default(cuid())
  type                   PlanType       @unique
  name                   String
  description            String?
  
  // 基本料金
  monthlyPrice           Int            // 月額基本料金（セント）
  yearlyPrice            Int            // 年額基本料金（セント）
  
  // メンバーベース料金
  includedMembers        Int            @default(1) // プランに含まれるメンバー数
  monthlyPricePerMember  Int            @default(0) // 追加メンバー月額（セント）
  yearlyPricePerMember   Int            @default(0) // 追加メンバー年額（セント）
  
  // 制限
  maxQuizzes             Int?
  maxMembers             Int?           // 最大メンバー数
  maxQuestionsPerQuiz    Int?
  maxResponsesPerMonth   Int?
  maxStorageMB           Int?
}
```

## 料金計算ロジック

### 月額料金計算
```typescript
export function calculateMonthlyPrice(
  plan: Plan,
  memberCount: number,
  billingCycle: 'MONTHLY' | 'YEARLY'
): number {
  // Proプランの場合（ユーザー単価制）
  if (plan.type === 'PRO') {
    const pricePerMember = billingCycle === 'MONTHLY' 
      ? plan.monthlyPricePerMember  // 2,980円/user
      : Math.floor(plan.yearlyPricePerMember / 12); // 2,480円/user
    
    return memberCount * pricePerMember;
  }
  
  // その他のプラン（基本料金 + 追加メンバー制）
  let totalPrice = billingCycle === 'MONTHLY' 
    ? plan.monthlyPrice 
    : Math.floor(plan.yearlyPrice / 12);
  
  if (memberCount > plan.includedMembers) {
    const additionalMembers = memberCount - plan.includedMembers;
    const pricePerMember = billingCycle === 'MONTHLY'
      ? plan.monthlyPricePerMember
      : Math.floor(plan.yearlyPricePerMember / 12);
    const additionalCost = additionalMembers * pricePerMember;
    totalPrice += additionalCost;
  }
  
  return totalPrice;
}
```

### 料金例（Proプラン）
- 月額: 1ユーザーあたり2,980円
- 年額: 1ユーザーあたり29,760円（月額換算2,480円）

| チーム人数 | 月額契約 | 年額契約（月換算） | 年額契約（年間） |
|-----------|---------|------------------|----------------|
| 1名       | 2,980円 | 2,480円          | 29,760円       |
| 3名       | 8,940円 | 7,440円          | 89,280円       |
| 5名       | 14,900円| 12,400円         | 148,800円      |
| 10名      | 29,800円| 24,800円         | 297,600円      |

## 権限管理

### 役割別の権限

| 機能 | OWNER | ADMIN | MEMBER | VIEWER |
|------|-------|-------|--------|--------|
| クイズ閲覧 | ✓ | ✓ | ✓ | ✓ |
| クイズ作成・編集 | ✓ | ✓ | ✓ | × |
| クイズ削除 | ✓ | ✓ | ✓（自分のみ） | × |
| レポート閲覧 | ✓ | ✓ | ✓ | ✓ |
| メンバー招待 | ✓ | ✓ | △（設定による） | × |
| メンバー削除 | ✓ | ✓ | × | × |
| チーム設定変更 | ✓ | ✓ | × | × |
| 請求管理 | ✓ | ✓ | × | × |
| チーム削除 | ✓ | × | × | × |
| オーナー変更 | ✓ | × | × | × |

### 権限チェックの実装例
```typescript
// Server Action での権限チェック
export async function updateTeamSettings(
  teamId: string,
  settings: TeamSettingsInput
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error('認証が必要です');
  }
  
  // メンバーの役割を確認
  const member = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId,
        userId: session.user.id,
      },
    },
  });
  
  // ADMIN以上の権限が必要
  if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
    throw new Error('権限がありません');
  }
  
  // 設定を更新
  return await prisma.teamSettings.update({
    where: { teamId },
    data: settings,
  });
}
```

## 実装上の注意点

### 1. チーム作成フロー
1. ユーザー登録時に個人チームを自動作成
2. ユーザーはチームオーナーとして登録
3. Freeプランのサブスクリプションを自動作成

### 2. メンバー追加時の処理
1. 招待メールの送信
2. 招待の受諾時にTeamMemberレコードを作成
3. サブスクリプションのmemberCountを更新
4. Stripeのサブスクリプションアイテムを更新

### 3. メンバー削除時の処理
1. TeamMemberレコードを削除
2. 関連するデータの処理（クイズの再割り当てなど）
3. サブスクリプションのmemberCountを更新
4. 次回請求時に料金を調整

### 4. マルチチーム対応
- ユーザーは複数のチームに所属可能
- チーム切り替えUIの実装
- 現在のチームコンテキストの管理

## セキュリティ考慮事項

1. **チーム間のデータ分離**
   - すべてのクエリでteamIdフィルターを適用
   - Row Level Security (RLS) の検討

2. **招待トークンの管理**
   - 一意性と推測困難性の確保
   - 有効期限の設定（デフォルト7日）
   - 使用済みトークンの無効化

3. **権限の昇格防止**
   - オーナーは1人のみ
   - オーナー変更は現オーナーのみ可能
   - 自分より高い権限への変更は不可

## 今後の拡張予定

1. **チーム間コラボレーション**
   - クイズの共有
   - ゲストアクセス

2. **高度な権限管理**
   - カスタムロールの作成
   - 細かい権限設定

3. **監査ログ**
   - すべての操作の記録
   - コンプライアンス対応