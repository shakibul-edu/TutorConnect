
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { User } from '../types';
import AuthModal from '../components/AuthModal';
import { useRouter } from './router';
import { setUnauthorizedCallback } from '../FetchApi';

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  toggleUserMode: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { push } = useRouter();

  // Set up 401 handler to trigger re-authentication
  useEffect(() => {
    setUnauthorizedCallback(() => {

      signIn('google');
    });
  }, []);

  // Sync session with local user state
  React.useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // Map NextAuth session to app User type
      // Note: In a real app, you might fetch additional user details from your API here
      setUser(prev => {
        // If we already have a user and emails match, preserve local state (like is_teacher toggle)
        if (prev && prev.email === session.user?.email) {
          return prev;
        }
        
        return {
          id: parseInt((session.user as any)?.id || '1'), // Fallback ID
          username: session.user?.name || 'User',
          email: session.user?.email || '',
          first_name: session.user?.name?.split(' ')[0] || '',
          last_name: session.user?.name?.split(' ').slice(1).join(' ') || '',
          is_teacher: false, // Default to finder mode
          banned: false,
          image: session.user?.image || undefined
        } as User;
      });
    } else if (status === 'unauthenticated') {
      setUser(null);
    }
    
    // Check for session errors (expired token)
    if ((session as any)?.error === 'AccessTokenExpired' || (session as any)?.error === 'RefreshAccessTokenError') {
      console.log('Session expired or refresh failed, triggering re-authentication...');
      signIn('google');
    }
  }, [session, status]);

  const login = (userData: User) => {
    // Legacy support: manual login is now handled via NextAuth signIn
    // This might still be used for testing or specific non-NextAuth flows
    setUser(userData);
    setIsModalOpen(false);
    if (userData.is_teacher) {
        push('dashboard');
    } else {
        push('jobs');
    }
  };

  const logout = () => {
    setUser(null);
    push('home');
  };

  const toggleUserMode = () => {
    setUser(prev => {
      if (!prev) return null;
      return { ...prev, is_teacher: !prev.is_teacher };
    });
    push('dashboard');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      openAuthModal: () => setIsModalOpen(true),
      closeAuthModal: () => setIsModalOpen(false),
      toggleUserMode
    }}>
      {children}
      <AuthModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onLogin={login} 
      />
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
