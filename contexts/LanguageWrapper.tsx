// components/LanguageWrapper.tsx
'use client';

import { useLanguage } from '../contexts/LanguageContext';

export default function LanguageWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { language } = useLanguage();

  return (
    <div className={`min-h-screen bg-white ${language === 'bn' ? 'lang-bn' : ''}`}>
      {children}
    </div>
  );
}
