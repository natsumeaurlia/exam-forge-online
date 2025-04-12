
import '../index.css';
import AppWrapper from '../app-wrapper';

export interface LayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({
  children,
}: LayoutProps) {
  return (
    <html lang="en">
      <head>
        <title>exam-forge-online</title>
        <meta name="description" content="Lovable Generated Project" />
        <meta property="og:title" content="exam-forge-online" />
        <meta property="og:description" content="Lovable Generated Project" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://lovable.dev/opengraph-image-p98pqg.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@lovable_dev" />
        <meta name="twitter:image" content="https://lovable.dev/opengraph-image-p98pqg.png" />
      </head>
      <body>
        <AppWrapper>
          {children}
        </AppWrapper>
      </body>
    </html>
  );
}
