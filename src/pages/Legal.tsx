
import { Navbar } from "@/components/layout/Navbar";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "react-i18next";

function LegalView({
  title,
  sections
}: {
  title: string;
  sections: {
    title: string;
    content: string;
  }[];
}) {
  return (
    <div className="bg-white py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">{title}</h1>
          
          <div className="space-y-6">
            {sections.map((section, index) => (
              <div key={index} className="border-b pb-4 mb-4 last:border-0">
                <h2 className="text-lg font-semibold mb-1">{section.title}</h2>
                <p className="text-gray-700 whitespace-pre-line">{section.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Legal() {
  const { t } = useTranslation();
  
  const legalData = {
    title: t('pages.legal.title'),
    sections: t('pages.legal.sections', { returnObjects: true })
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <LegalView 
          title={legalData.title}
          sections={legalData.sections}
        />
      </main>
    </div>
  );
}
