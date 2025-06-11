import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { AnimatedSection } from '@/components/common/AnimatedSection';
import Link from 'next/link';

export function HeroView({
  tagline,
  title,
  description,
  ctaStart,
  ctaDemo,
  benefits,
  quizExample,
  lng,
}: {
  tagline: string;
  title: string;
  description: string;
  ctaStart: string;
  ctaDemo: string;
  benefits: string[];
  quizExample: {
    title: string;
    question: string;
    options: { text: string; selected: boolean }[];
    progress: string;
    nextButton: string;
  };
  lng: string;
}) {
  return (
    <div
      className="relative overflow-hidden bg-white pt-16 pb-24"
      data-testid="hero-section"
    >
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          {/* Left column */}
          <AnimatedSection
            animation="fadeInUp"
            delay={100}
            className="flex flex-col justify-center"
            data-testid="hero-content"
          >
            <div className="mb-8">
              <div
                className="bg-examforge-blue/10 text-examforge-blue-dark mb-6 inline-flex items-center rounded-full px-3 py-1 text-sm font-medium"
                data-testid="hero-tagline"
              >
                <span className="mr-1">✨</span> {tagline}
              </div>
              <h1
                className="mb-6 text-4xl leading-tight font-bold md:text-5xl"
                data-testid="hero-title"
              >
                <span className="heading-gradient">{title}</span>
              </h1>
              <p
                className="mb-8 max-w-md text-lg text-gray-600"
                data-testid="hero-description"
              >
                {description}
              </p>

              <div
                className="mb-8 flex flex-col gap-4 sm:flex-row"
                data-testid="hero-cta-buttons"
              >
                <Button
                  asChild
                  size="lg"
                  className="gap-2 transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95"
                  data-testid="hero-start-button"
                >
                  <Link
                    href={`/${lng}/auth/signup`}
                    className="flex items-center"
                  >
                    {ctaStart}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95"
                  data-testid="hero-demo-button"
                >
                  <Link href={`/${lng}/dashboard/quizzes`}>{ctaDemo}</Link>
                </Button>
              </div>

              <div className="space-y-3" data-testid="hero-benefits">
                {benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2"
                    data-testid={`hero-benefit-${index}`}
                  >
                    <CheckCircle className="text-examforge-blue h-5 w-5" />
                    <span className="text-sm">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>

          {/* Right column - Illustration */}
          <AnimatedSection
            animation="fadeInUp"
            delay={300}
            className="relative flex items-center justify-center"
            data-testid="hero-illustration"
          >
            <div className="from-examforge-blue/20 to-examforge-orange/20 absolute top-1/2 left-1/2 h-3/4 w-3/4 -translate-x-1/2 -translate-y-1/2 transform rounded-full bg-gradient-to-br blur-3xl"></div>

            <div className="animate-float relative">
              <div
                className="max-w-sm rounded-xl bg-white p-6 shadow-2xl"
                data-testid="hero-quiz-example"
              >
                <div
                  className="mb-4 flex items-center gap-4"
                  data-testid="quiz-header"
                >
                  <div className="bg-examforge-blue flex h-10 w-10 items-center justify-center rounded-lg text-white">
                    {quizExample.title.charAt(0)}
                  </div>
                  <h3 className="font-bold">{quizExample.title}</h3>
                </div>

                <div className="space-y-4">
                  <div
                    className="rounded-lg border p-3"
                    data-testid="quiz-question-container"
                  >
                    <p
                      className="mb-2 text-sm font-medium"
                      data-testid="quiz-question"
                    >
                      {quizExample.question}
                    </p>
                    <div className="space-y-2" data-testid="quiz-options">
                      {quizExample.options.map((option, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2"
                          data-testid={`quiz-option-${index}`}
                        >
                          <div className="flex h-5 w-5 items-center justify-center rounded-full border">
                            <div
                              className={`h-2.5 w-2.5 rounded-full ${option.selected ? 'bg-examforge-blue' : 'bg-white'}`}
                            ></div>
                          </div>
                          <span className="text-sm">{option.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div
                    className="flex justify-between"
                    data-testid="quiz-controls"
                  >
                    <span
                      className="text-xs text-gray-500"
                      data-testid="quiz-progress"
                    >
                      {quizExample.progress}
                    </span>
                    <Button
                      size="sm"
                      variant="default"
                      data-testid="quiz-next-button"
                    >
                      {quizExample.nextButton}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </div>
  );
}

// Container component
export interface HeroProps {
  lng: string;
}

export async function Hero({ lng }: HeroProps) {
  const t = await getTranslations();

  const benefits = [
    t('hero.benefits.noCard'),
    t('hero.benefits.freeQuizzes'),
    t('hero.benefits.scoring'),
  ];

  const quizExample = {
    title: t('hero.quiz.title'),
    question: t('hero.quiz.question'),
    options: [
      { text: t('hero.quiz.options.0'), selected: false },
      { text: t('hero.quiz.options.1'), selected: true },
      { text: t('hero.quiz.options.2'), selected: false },
      { text: t('hero.quiz.options.3'), selected: false },
    ],
    progress: t('hero.quiz.progress'),
    nextButton: t('hero.quiz.nextButton'),
  };

  return (
    <HeroView
      tagline={t('hero.tagline')}
      title={t('hero.title')}
      description={t('hero.description')}
      ctaStart={t('hero.cta.start')}
      ctaDemo={t('hero.cta.demo')}
      benefits={benefits}
      quizExample={quizExample}
      lng={lng}
    />
  );
}
