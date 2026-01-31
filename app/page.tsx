'use client';

import React from 'react';
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import HowItWorks from '../components/landing/HowItWorks';
import Testimonials from '../components/landing/Testimonials';
import CTA from '../components/landing/CTA';
import LandingFooter from '../components/landing/LandingFooter';
import { useLanguage } from '../contexts/LanguageContext';

const HomePage: React.FC = () => {
  const { language } = useLanguage();

  return (
    <div className={`min-h-screen bg-white ${language === 'bn' ? 'lang-bn' : ''}`}>
      <Hero />
      <Features />
      <HowItWorks />
      <Testimonials />
      <CTA />
      <LandingFooter />
    </div>
  );
};

export default HomePage;
