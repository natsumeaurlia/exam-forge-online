
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import './lib/i18n' // i18nの初期化をインポート

// i18nの初期化が完了した後にアプリをレンダリングする
// Reactのレンダリングを遅延させ、i18nが確実に初期化されるようにする
document.addEventListener('DOMContentLoaded', () => {
  createRoot(document.getElementById("root")!).render(<App />);
});
