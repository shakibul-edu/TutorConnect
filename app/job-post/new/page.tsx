'use client';

import React from 'react';
import JobPostForm from '../../../components/JobPostForm';
import { useLanguage } from '../../../contexts/LanguageContext';

export default function NewJobPostPage() {
    // Assuming context provides translations, but creating English wrapper for now or using minimal context usage
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      
      <main className="flex-grow container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
             <JobPostForm />
        </div>
      </main>
      
      {/* Footer could go here if global layout handles it, omitting for specific page wrapper */}
    </div>
  );
}
