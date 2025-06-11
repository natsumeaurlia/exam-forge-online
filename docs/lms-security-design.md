# LMS Multi-Tenancy Security Design Document

## 概要

LMSマルチテナンシー機能のセキュリティ設計について、データアクセス制御を中心に厳密な設計を行います。

## 1. セキュリティ原則

### 1.1 Zero Trust Architecture
- すべてのアクセスを検証
- 最小権限の原則（Principle of Least Privilege）
- 明示的な許可のみ（Deny by Default）

### 1.2 Defense in Depth
- 複数層でのセキュリティ実装
- アプリケーション層、データベース層、インフラ層での防御

## 2. データアクセス制御設計

### 2.1 テナント分離の原則

```sql
-- すべてのLMS関連テーブルにはtenantIdが必須
-- テナント間のデータ漏洩を完全に防止
```

### 2.2 Row Level Security (RLS) ポリシー

#### LmsTenant テーブル
```sql
-- 読み取り：自分が所属するチームのテナントのみ
CREATE POLICY "tenant_read_policy" ON "LmsTenant"
FOR SELECT
USING (
  teamId IN (
    SELECT teamId FROM "TeamMember"
    WHERE userId = auth.uid()
    AND role IN ('OWNER', 'ADMIN', 'MEMBER')
  )
);

-- 作成：チームオーナーのみ
CREATE POLICY "tenant_create_policy" ON "LmsTenant"
FOR INSERT
WITH CHECK (
  teamId IN (
    SELECT teamId FROM "TeamMember"
    WHERE userId = auth.uid()
    AND role = 'OWNER'
  )
);

-- 更新：チームオーナーまたは管理者のみ
CREATE POLICY "tenant_update_policy" ON "LmsTenant"
FOR UPDATE
USING (
  teamId IN (
    SELECT teamId FROM "TeamMember"
    WHERE userId = auth.uid()
    AND role IN ('OWNER', 'ADMIN')
  )
);

-- 削除：チームオーナーのみ
CREATE POLICY "tenant_delete_policy" ON "LmsTenant"
FOR DELETE
USING (
  teamId IN (
    SELECT teamId FROM "TeamMember"
    WHERE userId = auth.uid()
    AND role = 'OWNER'
  )
);
```

#### LmsCourse テーブル
```sql
-- 読み取り：公開コースまたは登録済みコース
CREATE POLICY "course_read_policy" ON "LmsCourse"
FOR SELECT
USING (
  -- 公開コース
  (isPublic = true AND status = 'PUBLISHED')
  OR
  -- 管理者
  tenantId IN (
    SELECT id FROM "LmsTenant"
    WHERE teamId IN (
      SELECT teamId FROM "TeamMember"
      WHERE userId = auth.uid()
      AND role IN ('OWNER', 'ADMIN', 'MEMBER')
    )
  )
  OR
  -- 登録済み学習者
  id IN (
    SELECT courseId FROM "LmsEnrollment"
    WHERE userId = auth.uid()
    AND status = 'ACTIVE'
  )
);

-- 作成・更新・削除：テナント管理者のみ
CREATE POLICY "course_write_policy" ON "LmsCourse"
FOR ALL
USING (
  tenantId IN (
    SELECT id FROM "LmsTenant"
    WHERE teamId IN (
      SELECT teamId FROM "TeamMember"
      WHERE userId = auth.uid()
      AND role IN ('OWNER', 'ADMIN')
    )
  )
);
```

#### LmsEnrollment テーブル
```sql
-- 読み取り：本人または管理者
CREATE POLICY "enrollment_read_policy" ON "LmsEnrollment"
FOR SELECT
USING (
  userId = auth.uid()
  OR
  tenantId IN (
    SELECT id FROM "LmsTenant"
    WHERE teamId IN (
      SELECT teamId FROM "TeamMember"
      WHERE userId = auth.uid()
      AND role IN ('OWNER', 'ADMIN')
    )
  )
);

-- 作成：自己登録許可時または管理者
CREATE POLICY "enrollment_create_policy" ON "LmsEnrollment"
FOR INSERT
WITH CHECK (
  -- 自己登録
  (
    userId = auth.uid()
    AND courseId IN (
      SELECT c.id FROM "LmsCourse" c
      JOIN "LmsTenant" t ON c.tenantId = t.id
      WHERE t.enableSelfSignup = true
      AND c.isPublic = true
      AND c.status = 'PUBLISHED'
    )
  )
  OR
  -- 管理者による登録
  tenantId IN (
    SELECT id FROM "LmsTenant"
    WHERE teamId IN (
      SELECT teamId FROM "TeamMember"
      WHERE userId = auth.uid()
      AND role IN ('OWNER', 'ADMIN')
    )
  )
);
```

#### LmsLessonProgress テーブル
```sql
-- 読み取り・更新：本人のみ
CREATE POLICY "progress_policy" ON "LmsLessonProgress"
FOR ALL
USING (
  enrollmentId IN (
    SELECT id FROM "LmsEnrollment"
    WHERE userId = auth.uid()
  )
);
```

## 3. アプリケーション層のセキュリティ

### 3.1 Server Actions のセキュリティチェック

```typescript
// すべてのServer Actionで必須のチェック
async function validateLmsAccess(
  tenantId: string,
  requiredRole: TeamRole[] = ['OWNER', 'ADMIN', 'MEMBER']
): Promise<{ valid: boolean; teamId?: string; userId?: string }> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return { valid: false };
  }

  // テナントの所有チームを確認
  const tenant = await prisma.lmsTenant.findUnique({
    where: { id: tenantId },
    include: {
      team: {
        include: {
          members: {
            where: {
              userId: session.user.id,
              role: { in: requiredRole }
            }
          }
        }
      }
    }
  });

  if (!tenant || tenant.team.members.length === 0) {
    return { valid: false };
  }

  return {
    valid: true,
    teamId: tenant.teamId,
    userId: session.user.id
  };
}
```

### 3.2 データ検証

```typescript
// 入力データの厳密な検証
const createCourseSchema = z.object({
  tenantId: z.string().cuid(),
  title: z.string().min(1).max(200),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  description: z.string().max(5000).optional(),
  isPublic: z.boolean().default(true),
  price: z.number().int().min(0).max(1000000),
  enrollmentLimit: z.number().int().min(1).max(10000).optional(),
});
```

## 4. 潜在的な脆弱性と対策

### 4.1 テナント間データ漏洩
**リスク**: 異なるテナント間でデータが漏洩する可能性
**対策**:
- すべてのクエリでtenantIdフィルタを必須化
- RLSポリシーによる強制的なアクセス制御
- 定期的なペネトレーションテスト

### 4.2 権限昇格攻撃
**リスク**: 通常ユーザーが管理者権限を取得
**対策**:
- 役割ベースのアクセス制御（RBAC）の厳密な実装
- 権限チェックの多層防御
- 監査ログの実装

### 4.3 SQLインジェクション
**リスク**: 動的SQLによる攻撃
**対策**:
- Prismaの使用（パラメータ化クエリ）
- 入力値の厳密な検証
- エスケープ処理の徹底

### 4.4 セッションハイジャック
**リスク**: セッションの不正利用
**対策**:
- HTTPSの強制
- Secure/HttpOnly/SameSiteクッキー
- セッションタイムアウトの実装

## 5. 監査とモニタリング

### 5.1 アクセスログ
```typescript
// すべての重要な操作をログに記録
interface AuditLog {
  userId: string;
  tenantId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata: Json;
  timestamp: Date;
  ipAddress: string;
}
```

### 5.2 異常検知
- 短時間での大量アクセス検知
- 異なるテナントへの連続アクセス試行
- 権限外リソースへのアクセス試行

## 6. コンプライアンス

### 6.1 個人情報保護
- GDPR/個人情報保護法準拠
- データの最小限収集
- 明示的な同意取得
- データ削除権の保証

### 6.2 データ保管
- 暗号化（保存時・転送時）
- 地理的なデータ保管要件の遵守
- 定期的なバックアップとリカバリテスト

## 7. セキュリティテストチェックリスト

- [ ] テナント間アクセステスト
- [ ] 権限昇格テスト
- [ ] SQLインジェクションテスト
- [ ] XSS/CSRFテスト
- [ ] 認証バイパステスト
- [ ] Rate Limitingテスト
- [ ] データ暗号化確認
- [ ] ログ記録確認

## 8. インシデント対応計画

1. **検知**: 異常の早期発見
2. **封じ込め**: 被害の最小化
3. **根絶**: 脆弱性の修正
4. **回復**: サービスの復旧
5. **教訓**: 再発防止策の実装

## 9. 実装優先順位

1. **Phase 1**: RLSポリシーの実装とテスト
2. **Phase 2**: アプリケーション層のアクセス制御
3. **Phase 3**: 監査ログとモニタリング
4. **Phase 4**: 高度なセキュリティ機能（2FA、IP制限等）

## 10. レビューポイント

### コードレビュー時の確認事項
- [ ] すべてのクエリでtenantIdフィルタが適用されているか
- [ ] 権限チェックが実装されているか
- [ ] 入力検証が適切か
- [ ] エラーメッセージが情報漏洩していないか
- [ ] ログが適切に記録されているか

### セキュリティレビュー時の確認事項
- [ ] RLSポリシーが正しく動作するか
- [ ] クロステナントアクセスが防止されているか
- [ ] 権限昇格が不可能か
- [ ] セッション管理が適切か
- [ ] 暗号化が実装されているか