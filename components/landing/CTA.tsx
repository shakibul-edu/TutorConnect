'use client';

import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Link } from '../../lib/router';

const CTA: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section className="py-20 px-4 bg-white relative overflow-hidden">
      <div className="max-w-6xl mx-auto relative bg-school-yellow rounded-[3rem] p-12 lg:p-24 overflow-visible text-center shadow-[0_20px_40px_-15px_rgba(255,215,0,0.5)] border-4 border-slate-900">
        
        {/* Abstract shapes */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-20 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white opacity-20 rounded-full blur-2xl transform -translate-x-1/2 translate-y-1/2"></div>
        
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '24px 24px'}}></div>

        {/* Floating Illustration */}
        <div className="absolute -top-12 -right-12 lg:-right-4 w-48 h-48 lg:w-64 lg:h-64 animate-bounce duration-[5000ms] z-20 hidden sm:block">
            <img src="https://illustrations.popsy.co/amber/success.svg" alt="Success" className="w-full h-full object-contain drop-shadow-xl" />
        </div>
        
        <div className="absolute bottom-0 left-0 lg:left-10 w-32 h-32 lg:w-40 lg:h-40 opacity-80 z-20 hidden sm:block transform rotate-12">
            <img src="https://illustrations.popsy.co/amber/man-riding-a-rocket.svg" alt="Rocket" className="w-full h-full object-contain" />
        </div>

        <div className="relative z-10">
          <div className="inline-block bg-white px-4 py-2 rounded-full mb-6 border-2 border-slate-900 transform -rotate-3 shadow-[4px_4px_0_0_#0f172a]">
             <span className="font-bold font-school text-slate-900 flex items-center gap-2">
               <Sparkles size={16} className="text-school-yellow fill-current stroke-slate-900" />
               {t.cta.tag}
             </span>
          </div>
          
          <h2 className="text-4xl lg:text-6xl font-black text-slate-900 mb-6 tracking-tight font-display">
            {t.cta.title}
          </h2>
          <p className="text-slate-800 text-xl max-w-2xl mx-auto mb-10 font-medium">
            {t.cta.desc}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link href="/tutors" className="px-10 py-5 bg-slate-900 text-white text-xl font-bold rounded-2xl shadow-xl hover:scale-105 transition-all duration-300 font-display border-2 border-transparent hover:border-white relative overflow-hidden group flex items-center justify-center">
              <span className="relative z-10">{t.cta.btn1}</span>
              <div className="absolute inset-0 bg-slate-800 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
            </Link>
            <Link href="/register" className="flex items-center text-slate-900 font-bold text-lg hover:underline decoration-2 underline-offset-4 transition-colors px-6 py-4 bg-white/50 rounded-2xl hover:bg-white border-2 border-slate-900/10 hover:border-slate-900">
              <span>{t.cta.btn2}</span>
              <ArrowRight className="ml-2 w-6 h-6" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
