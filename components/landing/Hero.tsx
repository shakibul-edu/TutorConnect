'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Link } from '../../lib/router';
import Logo from '../Logo';
import Image from 'next/image';

const Hero: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-brand-50">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-brand-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-0 left-0 -ml-20 -mt-20 w-96 h-96 bg-school-yellow rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Text Content */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-8">
            <div className="inline-flex items-center space-x-2 bg-white border border-brand-100 rounded-full px-4 py-1.5 mb-2 shadow-sm transform -rotate-2 hover:rotate-0 transition-transform">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-500"></span>
              </span>
              <span className="text-sm font-bold text-brand-700 font-school tracking-wide">{t.hero.tag}</span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1] font-display">
              {t.hero.title1} <br />
              <span className="relative inline-block text-brand-600">
                {t.hero.title2}
                <svg className="absolute w-full h-4 -bottom-2 left-0 text-school-yellow opacity-80" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
                </svg>
              </span>
            </h1>

            <p className="text-xl text-slate-600 max-w-2xl leading-relaxed font-medium">
              {t.hero.subtitle} <br className="hidden lg:block"/>
              <span className="bg-school-yellow/30 px-2 rounded transform -rotate-1 inline-block">{t.hero.subjects[0]}</span>, 
              <span className="bg-brand-200 px-2 rounded transform rotate-2 inline-block mx-1">{t.hero.subjects[1]}</span>, 
              <span className="bg-school-red/20 px-2 rounded transform -rotate-2 inline-block">{t.hero.subjects[2]}</span> & more!
            </p>

            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 w-full lg:w-auto pt-4">
              <Link href="/tutors" className="w-full sm:w-auto px-8 py-4 bg-brand-600 text-white text-xl font-bold rounded-2xl shadow-[0_6px_0_0_rgba(29,78,216,1)] active:shadow-none active:translate-y-[6px] transition-all duration-150 flex items-center justify-center space-x-2 border-2 border-brand-700 group">
                <Search className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <span className="font-school">{t.hero.btnFind}</span>
              </Link>
              
              <Link href="/profile-edit" className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 text-xl font-bold rounded-2xl border-2 border-slate-200 shadow-[0_6px_0_0_rgba(226,232,240,1)] active:shadow-none active:translate-y-[6px] hover:bg-slate-50 transition-all duration-150 flex items-center justify-center font-school">
                {t.hero.btnTeach}
              </Link>
            </div>
            
            <div className="pt-8 flex items-center space-x-4 text-sm text-slate-500 font-bold">
              <div className="flex -space-x-4">
                 {[10, 11, 12, 13].map(i => (
                   <Image key={i} className="rounded-full border-4 border-white shadow-md bg-white object-cover" src={`https://api.dicebear.com/9.x/notionists/svg?seed=${i}`} alt="User" width={40} height={40} unoptimized />
                 ))}
              </div>
              <p className="font-school text-lg text-brand-600">{t.hero.social}</p>
            </div>
          </div>

          {/* Hero Image Area */}
          <div className="relative lg:h-full flex items-center justify-center">
            {/* Main Image Container */}
            <div className="relative w-full max-w-lg aspect-square group perspective-1000">
              <div className="absolute inset-0 bg-white rounded-[3rem] shadow-2xl rotate-6 transform transition-transform group-hover:rotate-3 border-4 border-slate-200 z-0"
                   style={{backgroundImage: 'radial-gradient(#e5e7eb 2px, transparent 2px)', backgroundSize: '30px 30px'}}></div>
              
              <div className="absolute inset-0 bg-brand-100 rounded-[3rem] -rotate-3 transform transition-transform group-hover:-rotate-1 border-4 border-white opacity-50 z-0"></div>
              
              <Image 
                src="https://illustrations.popsy.co/amber/studying.svg" 
                alt="Student Studying with Books" 
                className="relative z-10 w-full h-full object-contain drop-shadow-2xl transform transition-transform hover:-translate-y-4 duration-500"
                width={500}
                height={500}
                priority
                unoptimized
              />


              
              
               {/* Floating Element 2 */}
               <div className="absolute bottom-10 -left-10 bg-white p-4 rounded-2xl shadow-xl border-2 border-slate-100 z-20 flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-bold font-school text-slate-700">Tutor Found!</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
