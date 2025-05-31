import React from 'react';

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="mb-6 text-3xl font-bold">Contact Us</h1>
      <p className="mb-8">
        Please fill out the form below to get in touch with us.
      </p>

      <form className="max-w-md">
        <div className="mb-4">
          <label htmlFor="name" className="mb-2 block text-sm font-medium">
            Name
          </label>
          <input
            type="text"
            id="name"
            className="w-full rounded border border-gray-300 p-2"
            placeholder="Your name"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="email" className="mb-2 block text-sm font-medium">
            Email
          </label>
          <input
            type="email"
            id="email"
            className="w-full rounded border border-gray-300 p-2"
            placeholder="your.email@example.com"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="message" className="mb-2 block text-sm font-medium">
            Message
          </label>
          <textarea
            id="message"
            rows={5}
            className="w-full rounded border border-gray-300 p-2"
            placeholder="How can we help you?"
          ></textarea>
        </div>

        <button
          type="submit"
          className="bg-examforge-blue hover:bg-examforge-blue-dark rounded px-4 py-2 font-medium text-white"
        >
          Send Message
        </button>
      </form>
    </div>
  );
}
