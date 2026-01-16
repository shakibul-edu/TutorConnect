
import React from 'react';
import { Inter } from 'next/font/google';
import { AuthProvider } from '../lib/auth';
import { ToastProvider } from '../lib/toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import GoogleOneTap from '../components/GoogleOneTap';
import SessionProviderWrapper from '../lib/SessionProvider';

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
        <style dangerouslySetInnerHTML={{__html: `
          body { font-family: 'Inter', sans-serif; background-color: #f8fafc; }
        `}} />
      </head>
      <body className={inter.className}>
        <SessionProviderWrapper>
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
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
