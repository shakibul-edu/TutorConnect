'use client';

import Script from 'next/script';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

const GoogleOneTap = () => {
  const { status } = useSession();
  const router = useRouter();
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const initRef = useRef(false);

  useEffect(() => {
    if (status === 'unauthenticated' && scriptLoaded) {
      const clientId = '974128074220-a024bn1um7ieopfn95p63p8h1ph40tpf.apps.googleusercontent.com';
      const { google } = window as any;

      if (!google?.accounts?.id) return;

      // Single invocation guard: prevents duplicate initialize/prompt under StrictMode
      if (initRef.current) return;
      initRef.current = true;

      try {
        google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: any) => {
            try {

              const result = await signIn('google-onetap', {
                credential: response.credential,
                redirect: false,
              });
              console.log('📨 SignIn result:', result);
              if (result?.ok) {
                console.log('✅ Sign-in successful, redirecting to dashboard');
                router.push('/dashboard');
              } else {
                console.error('❌ Google One Tap: Sign in failed', result?.error);
              }
            } catch (err) {
              console.error('❌ Google One Tap: Error during sign in', err);
            }
          },
          use_fedcm_for_prompt: false,
          cancel_on_tap_outside: false,
        });

        // Prompt once; do not re-prompt to avoid concurrent credentials.get
        google.accounts.id.prompt((notification: any) => {
          if (notification.isDismissedMoment?.()) {
            console.log('🚫 Google One Tap dismissed by user');
          }
        });
      } catch (err) {
        console.error('❌ Google One Tap init/prompt error:', err);
      }

      return () => {
        initRef.current = false;
      };
    }
  }, [status, scriptLoaded, router]);

  if (status !== 'unauthenticated') {
    return null;
  }

  return (
    <Script
      src="https://accounts.google.com/gsi/client"
      strategy="afterInteractive"
      onLoad={() => setScriptLoaded(true)}
      onError={(e) => console.error('Failed to load Google GSI script:', e)}
    />
  );
};

export default GoogleOneTap;
