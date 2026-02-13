'use client';

import { SessionProvider } from 'next-auth/react';
import React from 'react';

interface SessionProviderWrapperProps {
  children: React.ReactNode;
}

const SessionProviderWrapper: React.FC<SessionProviderWrapperProps> = ({ children }) => {
  return (
    <SessionProvider 
      refetchInterval={60} // Refetch session every 60 seconds to prevent expiry
      refetchOnWindowFocus={true} // Refetch on window focus to catch any changes
    >
      {children}
    </SessionProvider>
  );
};

export default SessionProviderWrapper;
