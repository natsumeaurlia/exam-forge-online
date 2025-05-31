import { getTranslations } from 'next-intl/server';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { FaqItem, FaqAccordionProps } from '@/types/faq';

export async function FaqAccordion({ lng }: FaqAccordionProps) {
  const t = await getTranslations('pages.contact');

  const faqData = t.raw('faq.questions') as FaqItem[];

  return (
    <div
      id="faq"
      className="bg-white py-24"
      data-testid="faq-section"
    >
      <div className="container mx-auto px-4">
        <div
          className="mx-auto mb-16 max-w-3xl text-center"
          data-testid="faq-header"
        >
          <h2 
            className="mb-4 text-3xl font-bold" 
            data-testid="faq-title"
          >
            <span className="heading-gradient">{t('faq.title')}</span>
          </h2>
        </div>

        <div 
          className="mx-auto max-w-4xl"
          data-testid="faq-content"
        >
          <Accordion 
            type="multiple" 
            className="w-full"
            data-testid="faq-accordion"
          >
            {faqData.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                data-testid={`faq-item-${index}`}
              >
                <AccordionTrigger 
                  className="text-left font-semibold hover:text-examforge-blue"
                  data-testid={`faq-question-${index}`}
                >
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent 
                  className="text-gray-600"
                  data-testid={`faq-answer-${index}`}
                >
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
}