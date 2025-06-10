'use client';

import React from 'react';

interface ContactFormProps {
  translations: {
    form: {
      name: string;
      email: string;
      message: string;
      submit: string;
    };
  };
}

export const ContactForm = ({ translations }: ContactFormProps) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement form submission
  };

  return (
    <form
      className="max-w-md"
      data-testid="contact-form"
      onSubmit={handleSubmit}
    >
      <div className="mb-4" data-testid="name-field">
        <label
          htmlFor="name"
          className="mb-2 block text-sm font-medium"
          data-testid="name-label"
        >
          {translations.form.name}
        </label>
        <input
          type="text"
          id="name"
          className="w-full rounded border border-gray-300 p-2"
          placeholder={translations.form.name}
          data-testid="name-input"
        />
      </div>

      <div className="mb-4" data-testid="email-field">
        <label
          htmlFor="email"
          className="mb-2 block text-sm font-medium"
          data-testid="email-label"
        >
          {translations.form.email}
        </label>
        <input
          type="email"
          id="email"
          className="w-full rounded border border-gray-300 p-2"
          placeholder={translations.form.email}
          data-testid="email-input"
        />
      </div>

      <div className="mb-4" data-testid="message-field">
        <label
          htmlFor="message"
          className="mb-2 block text-sm font-medium"
          data-testid="message-label"
        >
          {translations.form.message}
        </label>
        <textarea
          id="message"
          rows={4}
          className="w-full rounded border border-gray-300 p-2"
          placeholder={translations.form.message}
          data-testid="message-input"
        />
      </div>

      <button
        type="submit"
        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        data-testid="submit-button"
      >
        {translations.form.submit}
      </button>
    </form>
  );
};
