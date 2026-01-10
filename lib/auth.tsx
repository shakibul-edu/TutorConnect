import React, { createContext, useContext, useState } from 'react';
import { User } from '../types';
import AuthModal from '../components/AuthModal';
import { useRouter } from './router';

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
  const [user, setUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { push } = useRouter();

  const login = (userData: User) => {
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
      const updatedUser = { ...prev, is_teacher: !prev.is_teacher };
      // Redirect to dashboard to show the new view
      push('dashboard');
      return updatedUser;
    });
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
