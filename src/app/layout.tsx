import '../index.css';
import { fallbackLng } from '../i18n/settings';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang={fallbackLng} dir="ltr">
      <body className="font-sans">{children}</body>
    </html>
  );
}
