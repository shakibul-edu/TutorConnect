'use client';

import React from 'react';
import { usePathname } from '../lib/router';

const Footer: React.FC = () => {
  const pathname = usePathname();

  if (pathname === 'home') return null;

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <p className="text-center text-base text-gray-400">
          &copy; 2024 TutorConnect. All rights reserved. Built with React & Tailwind.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
