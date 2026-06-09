'use client';

import React from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { User } from '../types';
import { toast } from '@/lib/toast';


interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin?: (user: User) => void;
  callbackUrl?: string;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin, callbackUrl }) => {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Check for error in URL on component mount
  React.useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      let errorMessage = 'Authentication failed. Please try again.';
      
      if (errorParam.includes('banned') || errorParam.includes('Banned')) {
        errorMessage = 'This account is banned. Please contact support for assistance.';
      }
      
      console.log('🔍 Error from URL:', errorParam);
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }, [searchParams]);

  if (!isOpen) return null;

  const showError = (message: string, errorCode?: string) => {
    console.error(`❌ ${errorCode ? `[${errorCode}] ` : ''}${message}`);
    setError(message);
    // Show toast as backup notification
    try {
      toast.error(message);
    } catch (e) {
      console.warn('⚠️ Toast failed, but error is displayed in modal');
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      sessionStorage.setItem('just_logged_in', 'true');
      const redirectUrl = callbackUrl || '/dashboard';
      const result = await signIn('google', { redirect: false, callbackUrl: redirectUrl });

      if (result?.ok) {
        onClose?.();
      } else if (result?.error === 'Callback') {
        showError('Authentication failed. Please try again.', 'Callback');
      } else if (result?.error === 'OAuthSignin' || result?.error === 'OAuthCallback') {
        showError('Failed to connect with Google. Please try again.', result?.error);
      } else if (result?.error === 'AccessDenied') {
        showError('Access was denied. Please check your account status.', 'AccessDenied');
      } else if (result?.error) {
        // Generic error with provided error code
        showError(`Authentication failed: ${result.error}`, result.error);
      } else if (result?.ok === false) {
        // This happens when signIn callback returns false (likely banned user)
        showError('This account is banned. Please contact support for assistance.', 'SignInRejected');
      } else {
        // Unknown failure
        showError('Failed to sign in. Please try again.', 'UnknownError');
      }
    } catch (error) {
      console.error('💥 Google login exception:', error);
      showError('An unexpected error occurred. Please try again.', 'Exception');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Welcome to TutorConnect</h2>
            <p className="text-gray-500 mt-2">Sign in to find jobs or hire tutors</p>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.1"/>
                <path d="M12 8v4m0 4v.01M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <div className="flex-1">
                <p className="text-sm text-red-800 font-medium">{error}</p>
              </div>
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-lg px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {!isLoading && (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            {isLoading ? 'Signing in...' : 'Continue with Google'}
          </button>

        </div>
      </div>
    </div>
  );
};

export default AuthModal;
