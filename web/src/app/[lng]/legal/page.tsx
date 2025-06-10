import React from 'react';
import { DefaultLayout } from '@/components/layout/DefaultLayout';

interface LegalPageProps {
  params: { lng: string };
}

export default async function LegalPage({ params }: LegalPageProps) {
  const { lng } = params;

  return (
    <DefaultLayout lng={lng}>
      <div className="container mx-auto px-4 py-12">
        <h1 className="mb-6 text-3xl font-bold">Legal Information</h1>
        <div className="prose max-w-none">
          <h2>Company Information</h2>
          <p>
            ExamForge, Inc.
            <br />
            123 Education Street
            <br />
            Tokyo, Japan 100-0001
            <br />
            Registration Number: 1234567890
            <br />
            VAT ID: JP1234567890
          </p>

          <h2>Commercial Transaction Act Compliance</h2>
          <p>
            In compliance with the Commercial Transaction Act of Japan, we
            provide the following information:
          </p>

          <h3>Cancellation Policy</h3>
          <p>
            Subscriptions may be canceled at any time before the next billing
            cycle. No refunds are provided for the current billing period.
          </p>

          <h3>Delivery of Services</h3>
          <p>
            Our services are provided digitally and are available immediately
            upon successful payment processing.
          </p>

          <h3>Payment Methods</h3>
          <p>
            We accept credit cards, debit cards, and bank transfers. All
            transactions are processed securely through our payment processors.
          </p>

          <h3>Customer Support</h3>
          <p>
            For any questions or concerns regarding our services, please contact
            our customer support team at support@examforge.example.com.
          </p>
        </div>
      </div>
    </DefaultLayout>
  );
}
