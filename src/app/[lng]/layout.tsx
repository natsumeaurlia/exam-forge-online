import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { languages } from '../../i18n/settings';
import { dir } from 'i18next';
import { Metadata } from 'next';

export async function generateStaticParams() {
  return languages.map((lng) => ({ lng }));
}

export interface LayoutProps {
  children: React.ReactNode;
  params: {
    lng: string;
  };
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  // In Next.js 15, params is a promise that needs to be awaited
  const resolvedParams = await Promise.resolve(params);
  const lng = resolvedParams.lng;

  return {
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
}

export default async function LngLayout({
  children,
  params
}: LayoutProps) {
  // In Next.js 15, params is a promise that needs to be awaited
  const resolvedParams = await Promise.resolve(params);
  const lng = resolvedParams.lng;
  
  return (
    <html lang={lng} dir={dir(lng)}>
      <body suppressHydrationWarning={true}>
        <Navbar lng={lng} />
        <main>
          {children}
        </main>
        <Footer lng={lng} />
      </body>
    </html>
  );
}