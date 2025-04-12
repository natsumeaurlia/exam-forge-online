
import { useTranslation } from "react-i18next";
import { 
  Award,
  BarChartBig,
  FileStack,
  LayoutDashboard, 
  LockKeyhole, 
  MessageSquare,
  Timer,
  Upload
} from "lucide-react";

export function Features() {
  const { t } = useTranslation();
  
  const features = [
    {
      icon: <LayoutDashboard className="h-6 w-6" />,
      title: t('features.list.builder.title'),
      description: t('features.list.builder.description')
    },
    {
      icon: <FileStack className="h-6 w-6" />,
      title: t('features.list.questionTypes.title'),
      description: t('features.list.questionTypes.description')
    },
    {
      icon: <BarChartBig className="h-6 w-6" />,
      title: t('features.list.analytics.title'),
      description: t('features.list.analytics.description')
    },
    {
      icon: <Timer className="h-6 w-6" />,
      title: t('features.list.scoring.title'),
      description: t('features.list.scoring.description')
    },
    {
      icon: <Upload className="h-6 w-6" />,
      title: t('features.list.import.title'),
      description: t('features.list.import.description')
    },
    {
      icon: <Award className="h-6 w-6" />,
      title: t('features.list.certificates.title'),
      description: t('features.list.certificates.description')
    },
    {
      icon: <LockKeyhole className="h-6 w-6" />,
      title: t('features.list.security.title'),
      description: t('features.list.security.description')
    },
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: t('features.list.feedback.title'),
      description: t('features.list.feedback.description')
    }
  ];

  return (
    <div id="features" className="py-24 bg-examforge-gray-light">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-4">
            <span className="heading-gradient">{t('features.title')}</span>
          </h2>
          <p className="text-lg text-gray-600">
            {t('features.description')}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="feature-icon-container">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
