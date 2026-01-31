'use client';

import React from 'react';
import { Star, Quote } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const Testimonials: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section id="reviews" className="py-24 bg-brand-50 relative overflow-hidden">
        {/* Corkboard Texture optional or just pattern */}
        <div className="absolute inset-0 opacity-5"
             style={{backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '30px 30px'}}>
        </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16 relative">
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 font-display">
            {t.reviews.title}
          </h2>
          <p className="mt-4 text-slate-600 max-w-2xl mx-auto text-xl font-medium">
            {t.reviews.subtitle}
          </p>
          
           {/* Decorative Illustration */}
           <div className="hidden md:block absolute right-0 -top-10 w-48 h-48 opacity-80 transform -rotate-6">
              <img src="https://illustrations.popsy.co/amber/shaking-hands.svg" alt="Community" className="w-full h-full object-contain" />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Review 1 - Yellow Sticky Note Style */}
          <div className="bg-[#FFF9C4] p-8 rounded-bl-3xl rounded-tr-3xl rounded-tl-sm rounded-br-sm shadow-[4px_4px_10px_rgba(0,0,0,0.1)] transform rotate-1 hover:rotate-0 transition-all duration-300 relative group">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-32 h-8 bg-yellow-200/50 opacity-50 skew-x-12"></div>
            <Quote className="text-yellow-600/20 absolute top-4 right-4 w-12 h-12" />
            
            <div className="flex items-center space-x-1 text-yellow-500 mb-6">
              {[...Array(5)].map((_, i) => <Star key={i} fill="currentColor" size={20} />)}
            </div>
            <p className="text-slate-800 font-medium font-school text-lg mb-6 leading-relaxed">
              "{t.reviews.r1}"
            </p>
            <div className="flex items-center space-x-4 border-t border-yellow-300/50 pt-4">
              <img src="https://api.dicebear.com/9.x/notionists/svg?seed=Sarah" className="w-12 h-12 rounded-full border-2 border-yellow-200 bg-white" alt="Sarah J" />
              <div>
                <h4 className="font-bold text-slate-900 font-display">Sarah Jenkins</h4>
                <p className="text-sm text-slate-600">{t.reviews.r1Role}</p>
              </div>
            </div>
          </div>

          {/* Review 2 - Blue Sticky Note Style */}
          <div className="bg-[#E1F5FE] p-8 rounded-br-3xl rounded-tl-3xl rounded-tr-sm rounded-bl-sm shadow-[4px_4px_10px_rgba(0,0,0,0.1)] transform -rotate-2 hover:rotate-0 transition-all duration-300 relative mt-8 md:mt-0">
             <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-32 h-8 bg-blue-200/50 opacity-50 -skew-x-12"></div>
            <Quote className="text-blue-600/20 absolute top-4 right-4 w-12 h-12" />
            
            <div className="flex items-center space-x-1 text-yellow-500 mb-6">
              {[...Array(5)].map((_, i) => <Star key={i} fill="currentColor" size={20} />)}
            </div>
            <p className="text-slate-800 font-medium font-school text-lg mb-6 leading-relaxed">
              "{t.reviews.r2}"
            </p>
            <div className="flex items-center space-x-4 border-t border-blue-300/50 pt-4">
              <img src="https://api.dicebear.com/9.x/notionists/svg?seed=Mike" className="w-12 h-12 rounded-full border-2 border-blue-200 bg-white" alt="Mike T" />
              <div>
                <h4 className="font-bold text-slate-900 font-display">Mike Thompson</h4>
                <p className="text-sm text-slate-600">{t.reviews.r2Role}</p>
              </div>
            </div>
          </div>

          {/* Review 3 - Pink Sticky Note Style */}
          <div className="bg-[#F8BBD0] p-8 rounded-bl-3xl rounded-tr-3xl rounded-tl-sm rounded-br-sm shadow-[4px_4px_10px_rgba(0,0,0,0.1)] transform rotate-2 hover:rotate-0 transition-all duration-300 relative">
             <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-32 h-8 bg-pink-200/50 opacity-50 skew-x-12"></div>
            <Quote className="text-pink-600/20 absolute top-4 right-4 w-12 h-12" />
            
            <div className="flex items-center space-x-1 text-yellow-500 mb-6">
              {[...Array(5)].map((_, i) => <Star key={i} fill="currentColor" size={20} />)}
            </div>
            <p className="text-slate-800 font-medium font-school text-lg mb-6 leading-relaxed">
              "{t.reviews.r3}"
            </p>
            <div className="flex items-center space-x-4 border-t border-pink-300/50 pt-4">
              <img src="https://api.dicebear.com/9.x/notionists/svg?seed=Emily" className="w-12 h-12 rounded-full border-2 border-pink-200 bg-white" alt="Emily R" />
              <div>
                <h4 className="font-bold text-slate-900 font-display">Emily Rodriguez</h4>
                <p className="text-sm text-slate-600">{t.reviews.r3Role}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
