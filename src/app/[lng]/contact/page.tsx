'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

export default function ContactPage() {
  const t = useTranslations('pages.contact');

  return (
    <div className="container mx-auto px-4 py-12" data-testid="contact-page">
      <h1 className="mb-6 text-3xl font-bold" data-testid="contact-title">
        {t('title')}
      </h1>
      <p className="mb-8" data-testid="contact-description">
        {t('description')}
      </p>

      <form className="max-w-md" data-testid="contact-form">
        <div className="mb-4" data-testid="name-field">
          <label
            htmlFor="name"
            className="mb-2 block text-sm font-medium"
            data-testid="name-label"
          >
            {t('form.name')}
          </label>
          <input
            type="text"
            id="name"
            className="w-full rounded border border-gray-300 p-2"
            placeholder={t('form.name')}
            data-testid="name-input"
          />
        </div>

        <div className="mb-4" data-testid="email-field">
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium"
            data-testid="email-label"
          >
            {t('form.email')}
          </label>
          <input
            type="email"
            id="email"
            className="w-full rounded border border-gray-300 p-2"
            placeholder={t('form.email')}
            data-testid="email-input"
          />
        </div>

        <div className="mb-4" data-testid="message-field">
          <label
            htmlFor="message"
            className="mb-2 block text-sm font-medium"
            data-testid="message-label"
          >
            {t('form.message')}
          </label>
          <textarea
            id="message"
            rows={4}
            className="w-full rounded border border-gray-300 p-2"
            placeholder={t('form.message')}
            data-testid="message-input"
          />
        </div>

        <button
          type="submit"
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          data-testid="submit-button"
        >
          {t('form.submit')}
        </button>
      </form>

      <div className="mt-12" data-testid="contact-info">
        <h2
          className="mb-4 text-xl font-semibold"
          data-testid="contact-info-title"
        >
          {t('contact.title')}
        </h2>
        <div className="space-y-2" data-testid="contact-details">
          <p data-testid="contact-email">{t('contact.email')}</p>
          <p data-testid="contact-phone">{t('contact.phone')}</p>
          <p data-testid="contact-address">{t('contact.address')}</p>
        </div>
      </div>

      <div className="mt-12" data-testid="faq-section">
        <h2 className="mb-4 text-xl font-semibold" data-testid="faq-title">
          {t('faq.title')}
        </h2>
        <div className="space-y-4" data-testid="faq-list">
          {t.raw('faq.questions').map((faq: any, index: number) => (
            <div
              key={index}
              className="border-b pb-4"
              data-testid={`faq-item-${index}`}
            >
              <h3 className="font-medium" data-testid={`faq-question-${index}`}>
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
  );
}
