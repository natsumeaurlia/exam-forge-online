'use client';

import { useTranslations } from 'next-intl';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export function PlanFaq() {
  const t = useTranslations();

  const faqs = [
    {
      question: t('plans.faq.billing.question'),
      answer: t('plans.faq.billing.answer'),
    },
    {
      question: t('plans.faq.upgrade.question'),
      answer: t('plans.faq.upgrade.answer'),
    },
    {
      question: t('plans.faq.downgrade.question'),
      answer: t('plans.faq.downgrade.answer'),
    },
    {
      question: t('plans.faq.trial.question'),
      answer: t('plans.faq.trial.answer'),
    },
    {
      question: t('plans.faq.payment.question'),
      answer: t('plans.faq.payment.answer'),
    },
    {
      question: t('plans.faq.cancel.question'),
      answer: t('plans.faq.cancel.answer'),
    },
    {
      question: t('plans.faq.premium.question'),
      answer: t('plans.faq.premium.answer'),
    },
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger className="text-left">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-gray-600">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
