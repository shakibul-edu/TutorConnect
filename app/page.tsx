
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import HowItWorks from '../components/landing/HowItWorks';
import Testimonials from '../components/landing/Testimonials';
import CTA from '../components/landing/CTA';
import LanguageWrapper from '../contexts/LanguageWrapper';

export default function HomePage() {
  return (
    <LanguageWrapper>
      <Hero />
      <Features />
      <HowItWorks />
      <Testimonials />
      <CTA />
    </LanguageWrapper>
  );
}
