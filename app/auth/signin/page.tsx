'use client';

import React, { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { LogIn } from 'lucide-react';
import AuthModal from '@/components/AuthModal';

export default function SignInPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(true);

  // If user is already authenticated, redirect to callback URL
  useEffect(() => {
    // The AuthModal component will handle the authentication
    // and redirect using the callbackUrl
  }, []);

  const handleAuthClose = () => {
    setIsAuthModalOpen(false);
    // Redirect to home if user closes auth modal
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <LogIn className="w-12 h-12 text-indigo-600" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome Back</h1>
        <p className="text-gray-600">Sign in to access your personalized dashboard and manage your tutoring connections</p>
      </div>

      {isAuthModalOpen && (
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={handleAuthClose}
          callbackUrl={callbackUrl}
        />
      )}

      {!isAuthModalOpen && (
        <div className="text-center">
          <p className="text-gray-600 mb-4">Authentication cancelled</p>
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
