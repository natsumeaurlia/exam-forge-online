
/// <reference types="vite/client" />

// Add Next.js type support
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    NEXT_PUBLIC_BASE_PATH?: string;
  }
}
