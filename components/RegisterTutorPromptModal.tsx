'use client';

import React from 'react';
import { useRouter } from '../lib/router';
import { toast } from '@/lib/toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const RegisterTutorPromptModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { push } = useRouter();

  if (!isOpen) return null;

  const handleYes = () => {
    onClose();
    localStorage.setItem('hasDeclinedTutor', 'false');
    toast.success("Please complete the profile to register as a tutor");
    push('profile-edit?register=true');
  };

  const handleNo = () => {
    onClose();
    localStorage.setItem('hasDeclinedTutor', 'true');
    push('tutors');
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleNo} />
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 text-center animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 bg-amber-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-32 h-32 bg-brand-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
        
        <div className="relative z-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome! 🎉</h2>
            <p className="text-gray-600 mb-8 font-medium">Do you want to register as a tutor and find tuitions nearby?</p>
            <div className="flex flex-col gap-3">
            <button 
                onClick={handleYes}
                className="w-full bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95"
            >
                Yes, register as a tutor
            </button>
            <button 
                onClick={handleNo}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3.5 rounded-xl transition-all active:scale-95"
            >
                No, just looking for tutors
            </button>
            </div>
        </div>
      </div>
    </div>
  );
};
