'use client';

import React from 'react';
import { Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Link } from '../../lib/router';
import Logo from '../Logo';

const LandingFooter: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-slate-900 text-white pt-20 pb-10 relative overflow-hidden">
      {/* Decorative illustration */}
      <div className="absolute top-10 right-10 w-32 h-32 opacity-10 rotate-12 pointer-events-none">
         <img src="https://illustrations.popsy.co/amber/letter.svg" alt="Mail" className="w-full h-full object-contain grayscale invert" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Logo className="w-10 h-10" />
              <span className="text-xl font-bold">E-Tuition</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              {t.footer.desc}
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-bold text-lg mb-6">{t.footer.col1}</h4>
            <ul className="space-y-3 text-slate-400">
               {/* Fixed links manually since mapping strings might need URL logic */}
               <li><Link href="/tutors" className="hover:text-white transition-colors">Browse Tutors</Link></li>
               <li><a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a></li>
               <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
               <li><Link href="/profile-edit" className="hover:text-white transition-colors">For Tutors</Link></li>
            </ul>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-bold text-lg mb-6">{t.footer.col2}</h4>
            <ul className="space-y-3 text-slate-400">
               <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
               <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
               <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
               <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
             <h4 className="font-bold text-lg mb-6">{t.footer.col3}</h4>
             <div className="flex relative z-10">
               <input type="email" placeholder={t.footer.placeholder} className="bg-slate-800 text-white px-4 py-3 rounded-l-xl focus:outline-none focus:ring-2 focus:ring-brand-500 w-full border border-slate-700" />
               <Link href="/login" className="bg-brand-600 px-4 py-3 rounded-r-xl hover:bg-brand-700 transition-colors font-medium flex items-center justify-center">
                 {t.footer.btn}
               </Link>
             </div>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-slate-500 text-sm mb-4 md:mb-0">
            {t.footer.copy}
          </p>
          <div className="flex space-x-6 text-slate-400">
            <a href="#" className="hover:text-white transition-colors"><Facebook size={20} /></a>
            <a href="#" className="hover:text-white transition-colors"><Twitter size={20} /></a>
            <a href="#" className="hover:text-white transition-colors"><Instagram size={20} /></a>
            <a href="#" className="hover:text-white transition-colors"><Linkedin size={20} /></a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
