'use client';

import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

const HowItWorks: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden bg-school-board text-white">
      {/* Blackboard Texture Effect */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
            backgroundImage: `url('https://www.transparenttextures.com/patterns/black-scales.png')`, // Fallback texture pattern
            backgroundSize: 'auto'
        }}
      ></div>
      
      {/* Chalk Dust Effect */}
      <div className="absolute inset-0 bg-white/5 pointer-events-none backdrop-blur-[1px]"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Image Side */}
          <div className="order-2 lg:order-1 relative">
            <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border-4 border-dashed border-white/30 bg-white p-4 rotate-2 hover:rotate-0 transition-all duration-500">
                <div className="bg-school-paper rounded-xl overflow-hidden border border-slate-200">
                    <img 
                        src="https://illustrations.popsy.co/amber/presentation.svg" 
                        alt="Tutor Teaching Illustration" 
                        className="w-full h-full object-cover p-6 bg-white"
                    />
                </div>
                 {/* Floating Sticky Note */}
                <div className="absolute top-8 left-8 bg-school-yellow text-slate-900 p-4 rounded-lg shadow-lg transform -rotate-6">
                    <p className="font-school font-bold text-lg">100% Free!</p>
                </div>
            </div>
            {/* Decor Chalk Drawings */}
            <div className="absolute -bottom-10 -right-10 text-white/10 transform rotate-12">
                <svg width="200" height="200" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="5,5" />
                    <path d="M50 10 L50 90 M10 50 L90 50" stroke="currentColor" strokeWidth="2" />
                </svg>
            </div>
          </div>

          {/* Content Side */}
          <div className="order-1 lg:order-2 text-chalk">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-8 font-display">
              {t.how.title} <br />
              <span className="text-school-yellow text-3xl font-school">{t.how.subtitle}</span>
            </h2>

            <div className="space-y-12">
              {/* Step 1 */}
              <div className="flex space-x-6 group">
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 rounded-full bg-transparent border-4 border-white/30 flex items-center justify-center text-white font-display text-2xl group-hover:bg-white group-hover:text-school-board transition-all">
                    1
                  </div>
                  <div className="h-full w-1 bg-white/20 mx-auto mt-4 rounded-full border-l border-r border-dashed border-white/30"></div>
                </div>
                <div className="pb-8">
                  <h3 className="text-2xl font-bold text-white mb-2 font-display">{t.how.step1Title}</h3>
                  <p className="text-slate-300 text-lg leading-relaxed font-medium">
                    {t.how.step1Desc}
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex space-x-6 group">
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 rounded-full bg-transparent border-4 border-white/30 flex items-center justify-center text-white font-display text-2xl group-hover:bg-white group-hover:text-school-board transition-all">
                    2
                  </div>
                  <div className="h-full w-1 bg-white/20 mx-auto mt-4 rounded-full border-l border-r border-dashed border-white/30"></div>
                </div>
                <div className="pb-8">
                  <h3 className="text-2xl font-bold text-white mb-2 font-display">{t.how.step2Title}</h3>
                  <p className="text-slate-300 text-lg leading-relaxed font-medium">
                     {t.how.step2Desc} <span className="text-school-green font-bold">{t.how.step2Highlight1}</span>, <span className="text-school-red font-bold">{t.how.step2Highlight2}</span>, {t.how.step2Desc.includes('বাছাই') ? '' : 'and'} <span className="text-school-yellow font-bold">{t.how.step2Highlight3}</span>.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex space-x-6 group">
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 rounded-full bg-school-green text-school-board flex items-center justify-center font-display text-2xl shadow-[0_0_20px_rgba(78,205,196,0.5)] transform group-hover:scale-110 transition-transform">
                    3
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2 font-display">{t.how.step3Title}</h3>
                  <p className="text-slate-300 text-lg leading-relaxed font-medium">
                    {t.how.step3Desc}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
