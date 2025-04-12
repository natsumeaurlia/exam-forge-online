
'use client';

import { useEffect } from 'react';
import '../../../src/lib/i18n';

export function I18nProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Handle client-side i18n initialization
  useEffect(() => {
    // Any client-side i18n initialization if needed
  }, []);

  return <>{children}</>;
}
