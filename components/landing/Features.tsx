'use client';

import React, { forwardRef } from 'react';
import { MapPin, Navigation, Ban, Calendar, ShieldCheck, Zap, LucideProps } from 'lucide-react';
import { Feature } from './types';
import { useLanguage } from '../../contexts/LanguageContext';

// Custom Taka Icon Component using the Taka symbol
const TakaIcon = forwardRef<SVGSVGElement, LucideProps>(({ size, ...props }, ref) => (
  <svg 
    ref={ref}
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <text 
      x="50%" 
      y="75%" 
      textAnchor="middle" 
      fontSize="24" 
      fill="currentColor" 
      stroke="none" 
      style={{ fontFamily: '"Baloo Da 2", sans-serif', fontWeight: 700 }}
    >
      ৳
    </text>
  </svg>
));

TakaIcon.displayName = 'TakaIcon';

const Features: React.FC = () => {
  const { t, language } = useLanguage();

  const features: Feature[] = [
    {
      id: 1,
      title: t.features.items[0].title,
      description: t.features.items[0].desc,
      icon: MapPin,
      color: "bg-blue-100 text-blue-600 border-blue-200",
    },
    {
      id: 2,
      title: t.features.items[1].title,
      description: t.features.items[1].desc,
      icon: Navigation,
      color: "bg-indigo-100 text-indigo-600 border-indigo-200",
    },
    {
      id: 3,
      title: t.features.items[2].title,
      description: t.features.items[2].desc,
      icon: Ban,
      color: "bg-amber-100 text-amber-600 border-amber-300",
    },
    {
      id: 4,
      title: t.features.items[3].title,
      description: t.features.items[3].desc,
      icon: Calendar,
      color: "bg-orange-100 text-orange-600 border-orange-200",
    },
    {
      id: 5,
      title: t.features.items[4].title,
      description: t.features.items[4].desc,
      icon: ShieldCheck,
      color: "bg-purple-100 text-purple-600 border-purple-200",
    },
    {
      id: 6,
      title: t.features.items[5].title,
      description: t.features.items[5].desc,
      icon: Zap,
      color: "bg-pink-100 text-pink-600 border-pink-200",
    },
  ];

  return (
    <section id="features" className="py-24 relative overflow-hidden bg-white">
      {/* Graph Paper CSS Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ 
             backgroundImage: 'linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)', 
             backgroundSize: '20px 20px' 
           }}>
      </div>
      
      {/* Tape decorations */}
      <div className="absolute top-0 left-0 w-32 h-8 bg-school-yellow/30 rotate-45 transform -translate-x-10 translate-y-10"></div>
      <div className="absolute top-0 right-0 w-32 h-8 bg-school-red/30 -rotate-45 transform translate-x-10 translate-y-10"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Floating Illustrations - Repositioned to stay within view */}
        <div className="hidden lg:block absolute left-4 top-10 w-40 h-40 animate-bounce duration-[4000ms] z-0">
           <img src="https://illustrations.popsy.co/amber/graphic-design.svg" alt="Smart Tools" className="w-full h-full object-contain opacity-90" loading="lazy" />
        </div>
         <div className="hidden lg:block absolute right-4 top-10 w-40 h-40 animate-pulse duration-[3000ms] z-0">
           <img src="https://illustrations.popsy.co/amber/remote-work.svg" alt="Creative Learning" className="w-full h-full object-contain opacity-90 transform rotate-12" loading="lazy" />
        </div>

        <div className="text-center max-w-3xl mx-auto mb-16 relative z-10">
          <h2 className="text-brand-600 font-bold tracking-wide uppercase text-sm mb-3 font-school">{t.features.tag}</h2>
          <h3 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 font-display">
            {t.features.title} <br />
            <span className="text-brand-600 relative inline-block">
              {t.features.titleHighlight}
              <svg className="absolute w-full h-3 -bottom-2 left-0 text-school-yellow" viewBox="0 0 100 10" preserveAspectRatio="none">
                 <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="6" fill="none" />
              </svg>
            </span>
          </h3>
          <p className="text-slate-600 text-lg font-medium">
            {t.features.desc}
          </p>
        </div>

        {/* ── No Media Fee spotlight banner ── */}
        <div className="relative z-10 mb-10 rounded-2xl overflow-hidden border-2 border-amber-300 shadow-lg">
          <div className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 px-6 py-5 flex flex-col sm:flex-row items-center gap-4">
            {/* Icon cluster */}
            <div className="flex-shrink-0 w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-md border-2 border-amber-300">
              <Ban className="w-7 h-7 text-amber-700" strokeWidth={2.5} />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <p className="text-amber-950 font-extrabold text-lg leading-tight">
                {t.features.noMediaFeeTitle}
              </p>
              <p className="text-amber-900 text-sm mt-1 leading-relaxed">
                {t.features.noMediaFeeDesc}
              </p>
            </div>
            <div className="flex-shrink-0">
              <span className="inline-block bg-amber-950 text-amber-300 text-xs font-extrabold uppercase tracking-widest px-4 py-2 rounded-full">
                {language === 'bn' ? '১০০% বিনামূল্যে' : '100% Free'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
          {features.map((feature) => (
            <div 
              key={feature.id} 
              className="bg-white rounded-2xl p-8 border-2 border-slate-100 hover:border-brand-200 shadow-[0_4px_0_0_rgba(0,0,0,0.05)] hover:shadow-[0_8px_0_0_rgba(59,130,246,0.2)] hover:-translate-y-1 transition-all duration-300 group"
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border-b-4 ${feature.color} group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon size={32} strokeWidth={2.5} />
              </div>
              <h4 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-brand-600 transition-colors font-display">
                {feature.title}
              </h4>
              <p className="text-slate-600 leading-relaxed font-medium">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
