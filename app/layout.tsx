
import React from 'react';
import { Inter } from 'next/font/google';
import { AuthProvider } from '../lib/auth';
import { ToastProvider } from '../lib/toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import GoogleOneTap from '../components/GoogleOneTap';
import SessionProviderWrapper from '../lib/SessionProvider';
import { LanguageProvider } from '../contexts/LanguageContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'TutorConnect',
  description: 'A comprehensive platform connecting students with qualified tutors.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Fredoka:wght@300;400;500;600;700&family=Baloo+Da+2:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{__html: `
          tailwind.config = {
            theme: {
              extend: {
                fontFamily: {
                  sans: ['Outfit', 'sans-serif'], // Overriding default sans to Outfit for landing page look, or keep Inter? TutorLink uses Outfit.
                  display: ['Fredoka', 'sans-serif'],
                  bangla: ['"Baloo Da 2"', 'sans-serif'],
                  inter: ['Inter', 'sans-serif']
                },
                colors: {
                  brand: {
                    50: '#eff6ff',
                    100: '#dbeafe',
                    200: '#bfdbfe',
                    300: '#93c5fd',
                    400: '#60a5fa',
                    500: '#3b82f6',
                    600: '#2563eb',
                    700: '#1d4ed8',
                    800: '#1e40af',
                    900: '#1e3a8a',
                  },
                  school: {
                    yellow: '#FFD700',
                    board: '#2F4F4F',
                    chalk: '#F8F8F8',
                    paper: '#FDFBF7',
                    red: '#FF6B6B',
                    green: '#4ECDC4'
                  }
                },
                backgroundImage: {
                  'wood-pattern': "url('https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?q=80&w=2070&auto=format&fit=crop')",
                  'leather': "url('https://www.transparenttextures.com/patterns/black-leather.png')",
                },
                animation: {
                  blob: "blob 7s infinite",
                },
                keyframes: {
                  blob: {
                    "0%": { transform: "translate(0px, 0px) scale(1)" },
                    "33%": { transform: "translate(30px, -50px) scale(1.1)" },
                    "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
                    "100%": { transform: "translate(0px, 0px) scale(1)" },
                  },
                },
              }
            }
          }
        `}} />
        <style dangerouslySetInnerHTML={{__html: `
          body { font-family: 'Outfit', sans-serif; background-color: #f8fafc; }
          .font-school { font-family: 'Fredoka', sans-serif; }
          .text-chalk { color: rgba(255, 255, 255, 0.9); text-shadow: 1px 1px 0 rgba(0,0,0,0.1); }
          .lang-bn, .lang-bn .font-sans, .lang-bn .font-display, .lang-bn .font-school { font-family: 'Baloo Da 2', sans-serif !important; }
        `}} />
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
