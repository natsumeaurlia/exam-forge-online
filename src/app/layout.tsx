
import type { Metadata } from 'next';
import '../index.css';
import AppWrapper from '../app-wrapper';

export const metadata: Metadata = {
  title: 'exam-forge-online',
  description: 'Lovable Generated Project',
  openGraph: {
    title: 'exam-forge-online',
    description: 'Lovable Generated Project',
    type: 'website',
    images: ['https://lovable.dev/opengraph-image-p98pqg.png'],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@lovable_dev',
    images: ['https://lovable.dev/opengraph-image-p98pqg.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppWrapper>
          {children}
        </AppWrapper>
      </body>
    </html>
  );
}
