
import React from 'react';
import { Hero } from '@/components/landing/Hero';
import { Features } from '@/components/landing/Features';
import { PricingPlans } from '@/components/landing/PricingPlans';
import { CallToAction } from '@/components/landing/CallToAction';

export default function HomePage() {
  return (
    <>
      <Hero />
      <Features />
      <PricingPlans />
      <CallToAction />
    </>
  );
}
