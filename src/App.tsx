
import React from 'react';
import { Hero } from '@/components/landing/Hero';
import { Features } from '@/components/landing/Features';
import { PricingPlans } from '@/components/landing/PricingPlans';
import { CallToAction } from '@/components/landing/CallToAction';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { I18nProvider } from '@/components/providers/I18nProvider';

export default function App() {
  return (
    <I18nProvider>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <PricingPlans />
        <CallToAction />
      </main>
      <Footer />
    </I18nProvider>
  );
}
