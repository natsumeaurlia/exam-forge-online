export const SERVER_ERROR_MESSAGES = {
  ja: {
    auth: {
      required: '認証が必要です',
    },
    quiz: {
      createFailed: 'クイズの作成に失敗しました',
      subdomainInUse: 'このサブドメインは既に使用されています',
      fetchFailed: 'クイズ一覧の取得に失敗しました',
      checkSubdomainFailed: 'サブドメインの確認に失敗しました',
    },
    tag: {
      createFailed: 'タグの作成に失敗しました',
      updateFailed: 'タグの更新に失敗しました',
      deleteFailed: 'タグの削除に失敗しました',
      addFailed: 'タグの追加に失敗しました',
      removeFailed: 'タグの削除に失敗しました',
      fetchFailed: 'タグ一覧の取得に失敗しました',
    },
    validation: {
      titleRequired: 'タイトルは必須です',
      optionRequired: '選択肢は必須です',
      questionRequired: '問題文は必須です',
      tagNameRequired: 'タグ名は必須です',
    },
  },
  en: {
    auth: {
      required: 'Authentication required',
    },
    quiz: {
      createFailed: 'Failed to create quiz',
      subdomainInUse: 'This subdomain is already in use',
      fetchFailed: 'Failed to fetch quiz list',
      checkSubdomainFailed: 'Failed to check subdomain availability',
    },
    tag: {
      createFailed: 'Failed to create tag',
      updateFailed: 'Failed to update tag',
      deleteFailed: 'Failed to delete tag',
      addFailed: 'Failed to add tag',
      removeFailed: 'Failed to remove tag',
      fetchFailed: 'Failed to fetch tag list',
    },
    validation: {
      titleRequired: 'Title is required',
      optionRequired: 'Option text is required',
      questionRequired: 'Question text is required',
      tagNameRequired: 'Tag name is required',
    },
  },
} as const;

// Helper function to get error message based on locale
export function getErrorMessage(locale: 'ja' | 'en', path: string): string {
  const keys = path.split('.');
  let message: any = SERVER_ERROR_MESSAGES[locale];

  for (const key of keys) {
    message = message?.[key];
  }

  return message || path;
}
