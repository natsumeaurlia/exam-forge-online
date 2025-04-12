
import { Navbar } from "@/components/layout/Navbar";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "react-i18next";

function PrivacyView({
  title,
  updated,
  sections
}: {
  title: string;
  updated: string;
  sections: {
    title: string;
    content: string;
  }[];
}) {
  return (
    <div className="bg-white py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">{title}</h1>
          <p className="text-gray-500 mb-8">{updated}</p>
          
          <div className="space-y-8">
            {sections.map((section, index) => (
              <div key={index}>
                <h2 className="text-xl font-semibold mb-3">{section.title}</h2>
                <p className="text-gray-700">{section.content}</p>
                {index < sections.length - 1 && (
                  <Separator className="mt-8" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Privacy() {
  const { t } = useTranslation();
  
  // Add proper type checking and default empty array
  const privacyData = {
    title: t('pages.privacy.title'),
    updated: t('pages.privacy.updated'),
    sections: (t('pages.privacy.sections', { returnObjects: true }) || []) as Array<{
      title: string;
      content: string;
    }>
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <PrivacyView 
          title={privacyData.title}
          updated={privacyData.updated}
          sections={privacyData.sections}
        />
      </main>
    </div>
  );
}
