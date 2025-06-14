/**
 * Email rendering utility compatible with Next.js 15 App Router
 * Dynamically imports react-dom/server to avoid SSR issues
 */

import type { ReactElement } from 'react';

export async function renderToStaticMarkup(
  element: ReactElement
): Promise<string> {
  // Dynamic import to avoid Next.js 15 App Router restrictions
  const { renderToStaticMarkup: renderImpl } = await import('react-dom/server');
  return renderImpl(element);
}
