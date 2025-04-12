
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

// Presentational component
export function HeroView({ 
  tagline, 
  title, 
  description, 
  ctaStart, 
  ctaDemo, 
  benefits 
}: {
  tagline: string;
  title: string;
  description: string;
  ctaStart: string;
  ctaDemo: string;
  benefits: string[];
}) {
  return (
    <div className="relative overflow-hidden bg-white pt-16 pb-24">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          {/* Left column */}
          <div className="flex flex-col justify-center">
            <div className="mb-8">
              <div className="inline-flex items-center rounded-full bg-examforge-blue/10 px-3 py-1 text-sm font-medium text-examforge-blue-dark mb-6">
                <span className="mr-1">✨</span> {tagline}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
                <span className="heading-gradient">{title}</span>
              </h1>
              <p className="text-lg text-gray-600 mb-8 max-w-md">
                {description}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button size="lg" className="gap-2">
                  {ctaStart}
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline">
                  {ctaDemo}
                </Button>
              </div>
              
              <div className="space-y-3">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-examforge-blue" />
                    <span className="text-sm">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Right column - Illustration */}
          <div className="flex items-center justify-center relative">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-gradient-to-br from-examforge-blue/20 to-examforge-orange/20 rounded-full blur-3xl"></div>
            
            <div className="relative animate-float">
              <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-examforge-blue flex items-center justify-center text-white">
                    Q
                  </div>
                  <h3 className="font-bold">マーケティングの基礎</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="border rounded-lg p-3">
                    <p className="text-sm font-medium mb-2">マーケティングミックスの4Pに含まれないものはどれ？</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full border flex items-center justify-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                        </div>
                        <span className="text-sm">Product（製品）</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full border flex items-center justify-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-examforge-blue"></div>
                        </div>
                        <span className="text-sm">Performance（業績）</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full border flex items-center justify-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                        </div>
                        <span className="text-sm">Price（価格）</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full border flex items-center justify-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                        </div>
                        <span className="text-sm">Promotion（プロモーション）</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">問題 2/10</span>
                    <Button size="sm" variant="default">次へ</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Container component
export function Hero() {
  const { t } = useTranslation();
  
  const benefits = [
    t('hero.benefits.noCard'),
    t('hero.benefits.freeQuizzes'),
    t('hero.benefits.scoring')
  ];
  
  return (
    <HeroView
      tagline={t('hero.tagline')}
      title={t('hero.title')}
      description={t('hero.description')}
      ctaStart={t('hero.cta.start')}
      ctaDemo={t('hero.cta.demo')}
      benefits={benefits}
    />
  );
}
