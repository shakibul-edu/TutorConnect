
import React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '../lib/auth';
import { ToastProvider } from '../lib/toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import GoogleOneTap from '../components/GoogleOneTap';
import SessionProviderWrapper from '../lib/SessionProvider';
import { LanguageProvider } from '../contexts/LanguageContext';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'E-Tuition | Best Platform to Find local Tutors & Tuition Jobs by GPS location',
    template: '%s | E-Tuition',
  },
  description: 'Join E-Tuition to find qualified tutors or tuition jobs in your area. We connect students with verified teachers for better education in Bangladesh.',
  applicationName: 'E-Tuition',
  authors: [{ name: 'E-Tuition Team' }],
  keywords: ['tuition', 'tutor', 'bangladesh', 'education', 'teacher', 'student', 'home tutor', 'online tutor', 'coaching', 'learning'],
  creator: 'E-Tuition',
  publisher: 'E-Tuition',
  metadataBase: new URL('https://etuition.app'), // Update with actual domain when deployed
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
    url: 'https://etuition.app',
    siteName: 'E-Tuition',
    title: 'E-Tuition - Connect with Local Expert Tutors',
    description: 'The most trusted platform for finding tutors and tuition jobs by GPS location.',
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
    title: 'E-Tuition - Find Local Tutors & Tuition Jobs',
    description: 'Connect with expert tutors or find tuition jobs easily on E-Tuition.',
    images: ['/android-chrome-512x512.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Fredoka:wght@300;400;500;600;700&family=Baloo+Da+2:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className={inter.className}>
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
              </div>
            </ToastProvider>
            </AuthProvider>
          </LanguageProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
