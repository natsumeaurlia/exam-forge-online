import React from 'react';
import { getTranslations } from 'next-intl/server';
import { DefaultLayout } from '@/components/layout/DefaultLayout';
import { ContactForm } from '@/components/contact/ContactForm';

interface ContactPageProps {
  params: { lng: string };
}

interface FAQItem {
  question: string;
  answer: string;
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { lng } = params;
  const t = await getTranslations('pages.contact');

  // Get all translations as static data
  const translations = {
    title: t('title'),
    description: t('description'),
    form: {
      name: t('form.name'),
      email: t('form.email'),
      message: t('form.message'),
      submit: t('form.submit'),
    },
    contact: {
      title: t('contact.title'),
      email: t('contact.email'),
      phone: t('contact.phone'),
      address: t('contact.address'),
    },
    faq: {
      title: t('faq.title'),
      questions: t.raw('faq.questions') as FAQItem[],
    },
  };

  return (
    <DefaultLayout lng={lng}>
      <div className="container mx-auto px-4 py-12" data-testid="contact-page">
        <h1 className="mb-6 text-3xl font-bold" data-testid="contact-title">
          {translations.title}
        </h1>
        <p className="mb-8" data-testid="contact-description">
          {translations.description}
        </p>

        <ContactForm translations={translations} />

        <div className="mt-12" data-testid="contact-info">
          <h2
            className="mb-4 text-xl font-semibold"
            data-testid="contact-info-title"
          >
            {translations.contact.title}
          </h2>
          <div className="space-y-2" data-testid="contact-details">
            <p data-testid="contact-email">{translations.contact.email}</p>
            <p data-testid="contact-phone">{translations.contact.phone}</p>
            <p data-testid="contact-address">{translations.contact.address}</p>
          </div>
        </div>

        <div className="mt-12" data-testid="faq-section">
          <h2 className="mb-4 text-xl font-semibold" data-testid="faq-title">
            {translations.faq.title}
          </h2>
          <div className="space-y-4" data-testid="faq-list">
            {translations.faq.questions.map((faq, index) => (
              <div
                key={index}
                className="border-b pb-4"
                data-testid={`faq-item-${index}`}
              >
                <h3
                  className="font-medium"
                  data-testid={`faq-question-${index}`}
                >
                  {faq.question}
                </h3>
                <p
                  className="mt-2 text-gray-600"
                  data-testid={`faq-answer-${index}`}
                >
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
