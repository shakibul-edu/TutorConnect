import React from 'react';
import type { Metadata } from 'next';
import { SITE_URL } from '../lib/seo/config';
import { Inter, Outfit, Baloo_Da_2, Fredoka } from 'next/font/google';
import { AuthProvider } from '../lib/auth';
import { ToastProvider } from '../lib/toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import GoogleOneTap from '../components/GoogleOneTap';
import SessionProviderWrapper from '../lib/SessionProvider';
import { LanguageProvider } from '../contexts/LanguageContext';
import { Analytics } from "@vercel/analytics/next";
import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], display: 'swap', variable: '--font-outfit' });
const balooDa2 = Baloo_Da_2({ subsets: ['bengali', 'latin'], display: 'swap', weight: ['400','500','600','700','800'], variable: '--font-baloo' });
const fredoka = Fredoka({ subsets: ['latin'], display: 'swap', weight: ['300','400','500','600','700'], variable: '--font-fredoka' });

export const metadata: Metadata = {
  title: {
    default: 'E-Tuition | Best Platform to Find local Tutors & Tuition Jobs by GPS location',
    template: '%s | E-Tuition',
  },
  description: "E-Tuition \u2014 find qualified home tutors or tuition jobs near you via GPS. Zero media fee for tutors. Free for students. Bangladesh's smartest location-based tuition platform.",
  applicationName: 'E-Tuition',
  authors: [{ name: 'E-Tuition Team' }],
  keywords: [
    // English
    'tuition', 'tutor', 'bangladesh', 'education', 'teacher', 'student',
    'home tutor', 'online tutor', 'coaching', 'learning', 'no media fee tutor',
    'free tutor platform', 'gps tutor', 'local tutor',
    // Bengali
    'টিউশন', 'টিউটর', 'শিক্ষা', 'বাংলাদেশ', 'শিক্ষক', 'হোম টিউটর',
    'মিডিয়া ফি ছাড়া টিউটর', 'বিনামূল্যে টিউশন', 'লোকাল টিউটর', 'জিপিএস টিউশন'
  ],
  creator: 'E-Tuition',
  publisher: 'E-Tuition',
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: SITE_URL,
    languages: {
      'en': `${SITE_URL}/?lang=en`,
      'bn': `${SITE_URL}/?lang=bn`,
      'x-default': SITE_URL,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: 'bn_BD',
    url: 'https://etuition.app',
    siteName: 'E-Tuition',
    title: 'E-Tuition - Connect with Local Expert Tutors | No Media Fee',
    description: 'The most trusted platform for finding tutors and tuition jobs by GPS location. Zero media fee for tutors.',
    images: [
      {
        url: '/android-chrome-512x512.png',
        width: 512,
        height: 512,
        alt: 'E-Tuition Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'E-Tuition - Find Local Tutors & Tuition Jobs | Zero Media Fee',
    description: 'Connect with expert tutors or find tuition jobs easily on E-Tuition. No commission, no media fee.',
    images: ['/android-chrome-512x512.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // JSON-LD Schema for Organization
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'E-Tuition',
    description: 'Online platform connecting students with local tutors in Bangladesh',
    url: 'https://etuition.app',
    logo: 'https://etuition.app/logo.png',
    sameAs: [
      'https://www.facebook.com/etuition',
      'https://www.linkedin.com/company/etuition',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      email: 'support@etuition.app',
    },
    areaServed: 'BD',
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        {/* Preconnect to image CDNs used below-fold — speeds up lazy-loaded assets */}
        <link rel="preconnect" href="https://api.dicebear.com" />
        <link rel="preconnect" href="https://illustrations.popsy.co" />
        <link rel="preconnect" href="https://flagcdn.com" />
        {/* dns-prefetch fallback for older mobile browsers */}
        <link rel="dns-prefetch" href="https://api.dicebear.com" />
        <link rel="dns-prefetch" href="https://illustrations.popsy.co" />
        <link rel="dns-prefetch" href="https://flagcdn.com" />
        {/* Preload hero illustration — it is the LCP element on mobile */}
        <link
          rel="preload"
          href="https://illustrations.popsy.co/amber/studying.svg"
          as="image"
          type="image/svg+xml"
        />
        {/* Mobile browser chrome color */}
        <meta name="theme-color" content="#3b82f6" />
        {/* Prevent iOS from auto-linking phone numbers (causes layout jank) */}
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className={`${inter.variable} ${outfit.variable} ${balooDa2.variable} ${fredoka.variable} ${inter.className}`}>
        <SessionProviderWrapper>
          <LanguageProvider>
            <AuthProvider>
            <ToastProvider>
              <GoogleOneTap />
              <div className="min-h-screen bg-gray-50 flex flex-col">
                <Navbar />
                <main className="flex-grow">
                  {children}
                </main>
                <Footer />
                <Analytics />
              </div>
            </ToastProvider>
            </AuthProvider>
          </LanguageProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
