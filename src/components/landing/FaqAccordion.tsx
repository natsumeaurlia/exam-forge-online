'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useTranslations } from 'next-intl';
import { faqData } from '@/data/faqs';

export interface FaqAccordionProps {
  lng: string;
}

export const FaqAccordion = ({ lng }: FaqAccordionProps) => {
  const t = useTranslations();

  return (
    <section
      id="faq"
      className="bg-gray-50 py-16 lg:py-24"
      data-testid="faq-section"
    >
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h2
            className="mb-4 text-3xl font-bold lg:text-4xl"
            data-testid="faq-title"
          >
            {t('faq.title')}
          </h2>
          <p
            className="mb-12 text-gray-600 lg:text-lg"
            data-testid="faq-description"
          >
            {t('faq.description')}
          </p>
        </div>

        <div className="mx-auto max-w-4xl">
          <Accordion
            type="multiple"
            className="space-y-4"
            data-testid="faq-accordion"
          >
            {faqData.items.map((item, index) => (
              <AccordionItem
                key={item.id}
                value={item.id}
                className="rounded-lg border border-gray-200 bg-white px-6 py-2 shadow-sm"
                data-testid={`faq-item-${index}`}
              >
                <AccordionTrigger
                  className="text-left text-lg font-semibold hover:no-underline"
                  data-testid={`faq-trigger-${index}`}
                >
                  {t(item.questionKey)}
                </AccordionTrigger>
                <AccordionContent
                  className="text-gray-600"
                  data-testid={`faq-content-${index}`}
                >
                  {t(item.answerKey)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};
