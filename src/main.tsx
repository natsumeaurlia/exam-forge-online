
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './lib/i18n' // i18nの初期化をインポート

createRoot(document.getElementById("root")!).render(<App />);
