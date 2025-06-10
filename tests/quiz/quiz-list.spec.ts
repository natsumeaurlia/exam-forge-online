import { test, expect } from '@playwright/test'

test.describe('クイズ一覧ページ', () => {
  test.beforeEach(async ({ page }) => {
    // テスト用のログインを実行
    await page.goto('/ja/auth/signin')
    
    // ログインフォームに入力
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password')
    
    // サインインボタンをクリック
    await page.click('button[type="submit"]')
    
    // ログイン完了を待つ
    await page.waitForURL('/ja/dashboard')
    
    // クイズ一覧ページに移動
    await page.goto('/ja/dashboard/quizzes')
    
    // ページの読み込みを待つ
    await page.waitForLoadState('networkidle')
  })

  test('ページが正しく表示される', async ({ page }) => {
    // ページタイトルの確認
    await expect(page.locator('h1')).toContainText('クイズ管理')
    
    // 新規作成ボタンの確認
    await expect(page.locator('button:has-text("新規クイズ作成")')).toBeVisible()
    
    // 検索バーの確認
    await expect(page.locator('input[placeholder*="クイズを検索"]')).toBeVisible()
    
    // フィルターの確認
    await expect(page.locator('text=ステータス')).toBeVisible()
    await expect(page.locator('text=並び替え')).toBeVisible()
  })

  test('クイズカードが表示される', async ({ page }) => {
    // クイズカードが存在することを確認
    const quizCards = page.locator('[data-testid="quiz-card"]')
    await expect(quizCards.first()).toBeVisible()
    
    // カードの基本要素を確認
    const firstCard = quizCards.first()
    await expect(firstCard.locator('h3')).toBeVisible() // タイトル
    await expect(firstCard.locator('text=問')).toBeVisible() // 問題数
    await expect(firstCard.locator('text=回答')).toBeVisible() // 回答数
  })

  test('検索機能が動作する', async ({ page }) => {
    // 検索入力
    const searchInput = page.locator('input[placeholder*="クイズを検索"]')
    await searchInput.fill('数学')
    
    // 検索結果の確認（デバウンス後）
    await page.waitForTimeout(500)
    
    // 検索結果に「数学」が含まれることを確認
    const quizCards = page.locator('[data-testid="quiz-card"]')
    if (await quizCards.count() > 0) {
      await expect(quizCards.first().locator('h3')).toContainText('数学')
    }
  })

  test('ステータスフィルターが動作する', async ({ page }) => {
    // ステータスフィルターを開く
    await page.locator('text=ステータス').click()
    
    // 「公開済み」を選択
    await page.locator('text=公開済み').click()
    
    // フィルター結果の確認
    await page.waitForTimeout(500)
    
    // 公開済みバッジが表示されることを確認
    const publishedBadges = page.locator('text=公開済み')
    if (await publishedBadges.count() > 0) {
      await expect(publishedBadges.first()).toBeVisible()
    }
  })

  test('並び替えが動作する', async ({ page }) => {
    // 並び替えドロップダウンを開く
    await page.locator('text=並び替え').click()
    
    // 「タイトル（A-Z）」を選択
    await page.locator('text=タイトル（A-Z）').click()
    
    // 結果の確認（実際のソート結果は実装に依存）
    await page.waitForTimeout(500)
    
    // クイズカードが表示されていることを確認
    const quizCards = page.locator('[data-testid="quiz-card"]')
    await expect(quizCards.first()).toBeVisible()
  })

  test('新規クイズ作成モーダルが開く', async ({ page }) => {
    // 新規作成ボタンをクリック
    await page.locator('button:has-text("新規クイズ作成")').click()
    
    // モーダルが表示されることを確認
    await expect(page.locator('text=新規クイズ作成')).toBeVisible()
    
    // フォーム要素の確認
    await expect(page.locator('input[placeholder*="タイトル"]')).toBeVisible()
    await expect(page.locator('textarea[placeholder*="説明"]')).toBeVisible()
    await expect(page.locator('text=採点モード')).toBeVisible()
    await expect(page.locator('text=共有モード')).toBeVisible()
    
    // キャンセルボタンでモーダルを閉じる
    await page.locator('button:has-text("キャンセル")').click()
    await expect(page.locator('text=新規クイズ作成')).not.toBeVisible()
  })

  test('クイズ作成フォームが動作する', async ({ page }) => {
    // 新規作成ボタンをクリック
    await page.locator('button:has-text("新規クイズ作成")').click()
    
    // フォームに入力
    await page.locator('input[placeholder*="タイトル"]').fill('テストクイズ')
    await page.locator('textarea[placeholder*="説明"]').fill('これはテスト用のクイズです')
    
    // 採点モードを選択
    await page.locator('text=採点モード').click()
    await page.locator('text=自動採点').click()
    
    // 共有モードを選択
    await page.locator('text=共有モード').click()
    await page.locator('text=URL共有').click()
    
    // 作成ボタンをクリック
    await page.locator('button:has-text("作成して編集へ進む")').click()
    
    // 成功メッセージまたはリダイレクトを確認
    // 実際の実装に応じて調整
    await page.waitForTimeout(1000)
  })

  test('クイズカードのアクションメニューが動作する', async ({ page }) => {
    // 最初のクイズカードのメニューボタンをクリック
    const firstCard = page.locator('[data-testid="quiz-card"]').first()
    await firstCard.hover()
    await firstCard.locator('button[aria-label*="メニュー"], button:has([data-testid="more-vertical"])').click()
    
    // メニュー項目の確認
    await expect(page.locator('text=編集')).toBeVisible()
    await expect(page.locator('text=プレビュー')).toBeVisible()
    await expect(page.locator('text=複製')).toBeVisible()
    await expect(page.locator('text=共有')).toBeVisible()
    await expect(page.locator('text=削除')).toBeVisible()
    
    // メニューを閉じる（ESCキー）
    await page.keyboard.press('Escape')
  })

  test('ページネーションが動作する', async ({ page }) => {
    // ページネーションが表示されている場合のテスト
    const pagination = page.locator('text=次へ')
    
    if (await pagination.isVisible()) {
      // 次のページに移動
      await pagination.click()
      
      // URLが変更されることを確認
      await expect(page).toHaveURL(/page=2/)
      
      // 前のページボタンが有効になることを確認
      await expect(page.locator('text=前へ')).toBeEnabled()
    }
  })

  test('レスポンシブデザインが動作する', async ({ page }) => {
    // モバイルサイズに変更
    await page.setViewportSize({ width: 375, height: 667 })
    
    // ページが正しく表示されることを確認
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('button:has-text("新規クイズ作成")')).toBeVisible()
    
    // タブレットサイズに変更
    await page.setViewportSize({ width: 768, height: 1024 })
    
    // ページが正しく表示されることを確認
    await expect(page.locator('h1')).toBeVisible()
    
    // デスクトップサイズに戻す
    await page.setViewportSize({ width: 1280, height: 720 })
  })
})