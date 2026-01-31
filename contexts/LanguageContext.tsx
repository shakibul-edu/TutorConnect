'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'bn';

const translations = {
  en: {
    nav: {
      features: "Features",
      howItWorks: "How it Works",
      reviews: "Reviews",
      getStarted: "Get Started"
    },
    hero: {
      tag: "Classes starting nearby!",
      title1: "Find Your",
      title2: "Perfect Tutor",
      subtitle: "Connect with qualified local teachers instantly.",
      subjects: ["Math", "Science", "Arts"],
      btnFind: "Find a Tutor",
      btnTeach: "I'm a Teacher",
      social: "Join 5,000+ happy students"
    },
    features: {
      tag: "Why Choose TutorLink",
      title: "Smart Tools for",
      titleHighlight: "Smarter Learning",
      desc: "We've done the homework so you don't have to. Focus on learning, we'll handle the logistics.",
      items: [
         { title: "Nearby Teacher", desc: "GPS-based matching connects you with the best tutors right in your neighborhood." },
         { title: "Auto Location", desc: "No need to search manually. Our smart system detects your zone automatically." },
         { title: "Free of Cost", desc: "100% free platform for students. Connect without paying any hidden commissions." },
         { title: "Smart Scheduling", desc: "Advanced algorithms find tutors who match your specific time availability." },
         { title: "Qualified Teachers", desc: "Every tutor is verified and rated to ensure high-quality education standards." },
         { title: "One Tap Solution", desc: "Instant booking and connection. Education is just a single tap away." }
      ]
    },
    how: {
      title: "How It Works",
      subtitle: "Simple as 1-2-3",
      step1Title: "Enable Location",
      step1Desc: "Just open the app and allow location access. We automatically scan your area.",
      step1Highlight: "automatically scan",
      step2Title: "Filter & Match",
      step2Desc: "See profiles of qualified teachers nearby. Filter by",
      step2Highlight1: "Subject",
      step2Highlight2: "Time",
      step2Highlight3: "Rating",
      step3Title: "One Tap Connect",
      step3Desc: "Found the perfect match? Tap to connect instantly and schedule your first session."
    },
    reviews: {
      title: "Loved by Students & Tutors",
      subtitle: "See what our community wrote on the class board.",
      r1: "I found a math tutor just 2 streets away! The auto-location is a lifesaver. Best app for students!",
      r1Role: "Student",
      r2: "As a tutor, getting students was hard. With TutorLink, I get inquiries from my neighborhood without ads.",
      r2Role: "Physics Tutor",
      r3: "The scheduled search is genius. I only see tutors who are free when I am. It saves so much time.",
      r3Role: "University Student"
    },
    cta: {
      tag: "Start Learning Today",
      title: "Ready for your first class?",
      desc: "Join thousands of students and tutors connecting daily. Completely free, location-based, and hassle-free.",
      btn1: "Find a Tutor Now",
      btn2: "Become a Tutor"
    },
    footer: {
      desc: "The smartest way to find local tutors. Location-based matching for effective learning experiences.",
      col1: "Platform",
      col2: "Company",
      col3: "Stay Updated",
      c1: ["Browse Tutors", "How it Works", "Pricing", "For Tutors"],
      c2: ["About Us", "Careers", "Blog", "Contact"],
      placeholder: "Enter your email",
      btn: "Join",
      copy: "© 2024 TutorLink Inc. All rights reserved."
    }
  },
  bn: {
    nav: {
      features: "বৈশিষ্ট্য",
      howItWorks: "কিভাবে কাজ করে",
      reviews: "মতামত",
      getStarted: "শুরু করুন"
    },
    hero: {
      tag: "কাছাকাছি ক্লাস শুরু হচ্ছে!",
      title1: "খুঁজে নিন আপনার",
      title2: "উপযুক্ত টিউটর",
      subtitle: "তৎক্ষণাৎ এবং বিনামূল্যে স্থানীয় দক্ষ শিক্ষকদের সাথে যোগাযোগ করুন।",
      subjects: ["গণিত", "বিজ্ঞান", "শিল্পকলা"],
      btnFind: "শিক্ষক খুঁজুন",
      btnTeach: "আমি একজন শিক্ষক",
      social: "৫,০০০+ সুখী শিক্ষার্থীদের সাথে যোগ দিন"
    },
    features: {
      tag: "কেন টিউটরলিঙ্ক বেছে নেবেন",
      title: "স্মার্ট শিক্ষার জন্য",
      titleHighlight: "স্মার্ট টুলস",
      desc: "আমরা আপনার কাজ সহজ করে দিয়েছি। আপনি পড়াশোনায় মনোযোগ দিন, বাকিটা আমরা দেখব।",
      items: [
         { title: "নিকটবর্তী শিক্ষক", desc: "জিপিএস-ভিত্তিক প্রযুক্তি আপনাকে আপনার এলাকার সেরা শিক্ষকদের সাথে সংযুক্ত করে।" },
         { title: "অটো লোকেশন", desc: "ম্যানুয়ালি খোঁজার প্রয়োজন নেই। আমাদের স্মার্ট সিস্টেম স্বয়ংক্রিয়ভাবে আপনার অবস্থান শনাক্ত করে।" },
         { title: "সম্পূর্ণ বিনামূল্যে", desc: "শিক্ষার্থীদের জন্য ১০০% বিনামূল্যে। কোনো গোপন কমিশন ছাড়াই সংযুক্ত হন।" },
         { title: "স্মার্ট শিডিউলিং", desc: "উন্নত অ্যালগরিদম এমন টিউটর খুঁজে দেয় যারা আপনার সময়ের সাথে মিলে যায়।" },
         { title: "যাচাইকৃত শিক্ষক", desc: "উচ্চমানের শিক্ষা নিশ্চিত করতে প্রতিটি টিউটর যাচাইকৃত এবং রেট করা হয়।" },
         { title: "এক ট্যাপ সমাধান", desc: "তৎক্ষণাৎ বুকিং এবং সংযোগ। শিক্ষা এখন মাত্র একটি ট্যাপ দূরে।" }
      ]
    },
    how: {
      title: "কিভাবে কাজ করে",
      subtitle: "খুবই সহজ ৩টি ধাপ",
      step1Title: "লোকেশন চালু করুন",
      step1Desc: "অ্যাপটি খুলুন এবং লোকেশন অ্যাক্সেস দিন। আমরা স্বয়ংক্রিয়ভাবে আপনার এলাকা স্ক্যান করব।",
      step1Highlight: "স্বয়ংক্রিয়ভাবে স্ক্যান",
      step2Title: "ফিল্টার এবং ম্যাচ",
      step2Desc: "কাছাকাছি যোগ্য শিক্ষকদের প্রোফাইল দেখুন। বাছাই করুন -",
      step2Highlight1: "বিষয়",
      step2Highlight2: "সময়",
      step2Highlight3: "রেটিং",
      step3Title: "এক ট্যাপে সংযোগ",
      step3Desc: "উপযুক্ত শিক্ষক পেয়েছেন? তৎক্ষণাৎ যোগাযোগ করতে ট্যাপ করুন এবং আপনার প্রথম সেশন ঠিক করুন।"
    },
    reviews: {
      title: "শিক্ষার্থী এবং টিউটরদের পছন্দ",
      subtitle: "দেখুন আমাদের কমিউনিটি কি বলছে।",
      r1: "আমি মাত্র ২ রাস্তা পরেই একজন গণিত শিক্ষক পেয়েছি! অটো-লোকেশন ফিচারটি দুর্দান্ত। শিক্ষার্থীদের জন্য সেরা অ্যাপ!",
      r1Role: "শিক্ষার্থী",
      r2: "একজন শিক্ষক হিসেবে ছাত্র পাওয়া কঠিন ছিল। টিউটরলিঙ্কের মাধ্যমে, আমি কোনো বিজ্ঞাপন ছাড়াই আমার এলাকা থেকে ইনকুয়ারি পাচ্ছি।",
      r2Role: "পদার্থবিজ্ঞান শিক্ষক",
      r3: "শিডিউল সার্চ ফিচারটি অসাধারণ। আমি কেবল তাদেরই দেখি যারা আমার ফ্রি সময়ে ফ্রি আছেন। এটি অনেক সময় বাঁচায়।",
      r3Role: "বিশ্ববিদ্যালয় শিক্ষার্থী"
    },
    cta: {
      tag: "আজই শেখা শুরু করুন",
      title: "প্রথম ক্লাসের জন্য প্রস্তুত?",
      desc: "প্রতিদিন হাজার হাজার শিক্ষার্থী এবং শিক্ষক সংযুক্ত হচ্ছেন। সম্পূর্ণ বিনামূল্যে, লোকেশন-ভিত্তিক এবং ঝামেলামুক্ত।",
      btn1: "এখনই শিক্ষক খুঁজুন",
      btn2: "শিক্ষক হতে চাই"
    },
    footer: {
      desc: "স্থানীয় শিক্ষক খোঁজার সবচেয়ে স্মার্ট উপায়। কার্যকরী শিক্ষার অভিজ্ঞতার জন্য লোকেশন-ভিত্তিক ম্যাচিং।",
      col1: "প্ল্যাটফর্ম",
      col2: "কোম্পানি",
      col3: "যুক্ত থাকুন",
      c1: ["শিক্ষক খুঁজুন", "কিভাবে কাজ করে", "মূল্য নির্ধারণ", "শিক্ষকদের জন্য"],
      c2: ["আমাদের সম্পর্কে", "ক্যারিয়ার", "ব্লগ", "যোগাযোগ"],
      placeholder: "আপনার ইমেইল দিন",
      btn: "যোগ দিন",
      copy: "© ২০২৪ টিউটরলিঙ্ক ইংক। সর্বস্বত্ব সংরক্ষিত।"
    }
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.en;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const value = {
    language,
    setLanguage,
    t: translations[language]
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
