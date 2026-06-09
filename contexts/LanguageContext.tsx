'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'bn';

const translations = {
  en: {
    nav: {
      features: "Features",
      howItWorks: "How it Works",
      reviews: "Reviews",
      getStarted: "Get Started",
      findTutors: "Find Tutors",
      tuitionJobs: "Tuition Jobs",
    },
    hero: {
      tag: "Skilled Tutors Just Around the Corner!",
      heroTutorBadge: "No Media Fee for Tutors",
      title1: "Find Your",
      title2: "Perfect Tutor",
      subtitle: "Connect with qualified local teachers instantly.",
      subjects: ["Math", "Science", "Arts"],
      btnFind: "Find a Tutor",
      btnTeach: "Register as a Tutor",
      social: "Join 5,000+ happy students"
    },
    features: {
      tag: "Why Choose E-Tuition",
      title: "Smart Tools for",
      titleHighlight: "Smarter Learning",
      desc: "We've done the homework so you don't have to. Focus on learning, we'll handle the logistics.",
      items: [
         { title: "Nearby Teacher", desc: "GPS-based matching connects you with the best tutors right in your neighborhood." },
         { title: "Auto Location", desc: "No need to search manually. Our smart system detects your zone automatically." },
         { title: "Zero Media Fee", desc: "No commission, no middleman. Tutors connect directly with students — 100% free for everyone." },
         { title: "Smart Scheduling", desc: "Advanced algorithms find tutors who match your specific time availability." },
         { title: "Verified Teachers", desc: "Every tutor is verified and rated to ensure high-quality education standards." },
         { title: "One Tap Connect", desc: "Instant booking and connection. Education is just a single tap away." }
      ],
      noMediaFeeTitle: "Zero Media Fee for Tutors",
      noMediaFeeDesc: "Unlike traditional tuition media, we never charge tutors a single taka. No commission. No middleman. Just direct connections.",
      noMediaFeeBadge: "টিউটরদের জন্য কোনো মিডিয়া ফি নেই · No Media Fee for Tutors"
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
      r2: "As a tutor, getting students was hard. With E-Tuition, I get inquiries from my neighborhood without ads.",
      r2Role: "Physics Tutor",
      r3: "The scheduled search is genius. I only see tutors who are free when I am. It saves so much time.",
      r3Role: "University Student"
    },
    cta: {
      tag: "Start Learning Today",
      title: "Ready for your first class?",
      desc: "Join thousands of students and tutors connecting daily. Completely free, no media fee, location-based, and hassle-free.",
      btn1: "Find a Tutor Now",
      btn2: "Become a Tutor — Free"
    },
    footer: {
      desc: "The smartest way to find local tutors. Location-based matching for effective learning experiences.",
      col1: "Platform",
      col2: "Company",
      col3: "Stay Updated",
      c1: ["Browse Tutors", "How it Works", "Pricing", "For Tutors"],
      c2: ["About Us", "Careers", "Blog", "Contact"],
      placeholder: "Enter your email",
      btn: "Provide Feedback",
      copy: "© 2026 E-Tuition. All rights reserved."
    },
    profile: {
      personalInfo: "Personal Information",
      bio: "Bio",
      bioPlaceholder: "Tell students about your teaching style and experience...",
      phone: "Phone Number",
      phonePlaceholder: "Enter your phone number",
      minSalary: "Minimum Salary",
      experience: "Total Experience",
      years: "Years",
      gender: "Gender",
      teachingMode: "Teaching Mode",
      distance: "Preferred Distance (Km)",
      medium: "Medium",
      class: "Class/Grade",
      subject: "Subject",
      availability: "Availability",
      uploadPhoto: "Click on the image to upload a profile picture (JPG, PNG)",
    },
    education: {
      title: "Add New Academic Profile",
      degree: "Degree",
      institution: "Institution",
      passingYear: "Passing Year",
      result: "Result",
      certificate: "Certificate",
      uploadDoc: "Upload Document",
      saveUnlock: "Save profile to unlock"
    },
    qualification: {
      title: "Add New Qualification",
      skill: "Skill / Certification Name",
      organization: "Organization",
    },
    actions: {
      save: "Save",
      cancel: "Cancel",
      updateProfile: "Update Profile",
      createProfile: "Create Profile",
      saveAdd: "Save & Add Another",
      selectYear: "Select Year"
    }
  },
bn: {
  nav: {
    features: "ফিচার",
    howItWorks: "কীভাবে কাজ করে",
    reviews: "রিভিউ",
    getStarted: "শুরু করুন",
    findTutors: "টিউটর খুঁজুন",
    tuitionJobs: "টিউশন জব",
  },

  hero: {
    tag: "আপনার আশেপাশেই দক্ষ টিউটর রয়েছে!",
    heroTutorBadge: "টিউটরদের জন্য কোনো মিডিয়া ফি নেই",
    title1: "খুঁজে নিন আপনার",
    title2: "পারফেক্ট টিউটর",
    subtitle: "দ্রুত খুঁজে নিন আপনার এলাকার অভিজ্ঞ শিক্ষক।",
    subjects: ["গণিত", "বিজ্ঞান", "ইংরেজি"],
    btnFind: "টিউটর খুঁজুন",
    btnTeach: "Register as a Tutor",
    social: "৫,০০০+ শিক্ষার্থী ইতোমধ্যে যুক্ত হয়েছে"
  },

  features: {
    tag: "কেন E-Tuition ব্যবহার করবেন",
    title: "স্মার্ট পড়াশোনার জন্য",
    titleHighlight: "স্মার্ট সল্যুশন",
    desc: "টিউটর খোঁজা এখন আরও সহজ। বাকি কাজ আমরা করে দিচ্ছি।",

    items: [
      {
        title: "কাছের টিউটর",
        desc: "আপনার আশেপাশের সেরা টিউটরদের সাথে সহজেই কানেক্ট করুন।"
      },
      {
        title: "অটো লোকেশন",
        desc: "ম্যানুয়ালি লোকেশন দিতে হবে না। অ্যাপ নিজেই আপনার এলাকা শনাক্ত করবে।"
      },
      {
        title: "মিডিয়া ফি নেই",
        desc: "কোনো কমিশন নেই, কোনো মিডিয়া ফি নেই। টিউটর সরাসরি স্টুডেন্টের সাথে কানেক্ট করুন — সম্পূর্ণ বিনামূল্যে।"
      },
      {
        title: "স্মার্ট শিডিউল",
        desc: "আপনার সুবিধামতো সময় অনুযায়ী টিউটর খুঁজে নিন।"
      },
      {
        title: "ভেরিফাইড টিউটর",
        desc: "সব টিউটর যাচাইকৃত এবং রেটিংসহ প্রোফাইল দেওয়া আছে।"
      },
      {
        title: "ওয়ান ট্যাপ কানেকশন",
        desc: "এক ক্লিকেই টিউটরের সাথে যোগাযোগ করুন।"
      }
    ],
    noMediaFeeTitle: "টিউটরদের জন্য কোনো মিডিয়া ফি নেই",
    noMediaFeeDesc: "প্রচলিত টিউশন মিডিয়ার মতো কোনো কমিশন নেই। টিউটর সরাসরি স্টুডেন্টের সাথে যোগাযোগ করুন — কোনো মধ্যস্থতাকারী ছাড়াই।",
    noMediaFeeBadge: "টিউটরদের জন্য কোনো মিডিয়া ফি নেই · No Media Fee for Tutors"
  },

  how: {
    title: "কীভাবে কাজ করে",
    subtitle: "মাত্র ৩টি সহজ ধাপ",

    step1Title: "লোকেশন অন করুন",
    step1Desc: "অ্যাপ ওপেন করে লোকেশন পারমিশন দিন। আমরা আপনার এলাকা স্ক্যান করবো।",
    step1Highlight: "এলাকা স্ক্যান",

    step2Title: "ফিল্টার করুন",
    step2Desc: "কাছাকাছি টিউটরদের প্রোফাইল দেখুন এবং পছন্দমতো বাছাই করুন।",

    step2Highlight1: "বিষয়",
    step2Highlight2: "সময়",
    step2Highlight3: "রেটিং",

    step3Title: "সরাসরি যোগাযোগ",
    step3Desc: "পছন্দের টিউটর পেয়ে গেলে এক ট্যাপেই যোগাযোগ করুন।"
  },

  reviews: {
    title: "শিক্ষার্থী ও টিউটরদের পছন্দ",
    subtitle: "আমাদের ইউজাররা যা বলছেন",

    r1: "আমি বাসার কাছেই ম্যাথ টিউটর পেয়ে গেছি। লোকেশন ফিচারটা দারুণ কাজ করে!",
    r1Role: "স্টুডেন্ট",

    r2: "আগে স্টুডেন্ট খুঁজে পাওয়া কঠিন ছিল। এখন আশেপাশের স্টুডেন্টরাই যোগাযোগ করে।",
    r2Role: "ফিজিক্স টিউটর",

    r3: "সময় অনুযায়ী টিউটর খুঁজে পাওয়াটা অনেক হেল্পফুল। অনেক সময় বাঁচে।",
    r3Role: "বিশ্ববিদ্যালয় শিক্ষার্থী"
  },

  cta: {
    tag: "আজই শুরু করুন",
    title: "প্রথম ক্লাসের জন্য প্রস্তুত?",
    desc: "হাজারো শিক্ষার্থী ও টিউটর প্রতিদিন যুক্ত হচ্ছে। কোনো মিডিয়া ফি নেই, সম্পূর্ণ ফ্রি এবং ঝামেলাহীন।",

    btn1: "এখনই টিউটর খুঁজুন",
    btn2: "টিউটর হন — বিনামূল্যে"
  },

  footer: {
    desc: "লোকাল টিউটর খোঁজার সবচেয়ে সহজ প্ল্যাটফর্ম।",

    col1: "প্ল্যাটফর্ম",
    col2: "কোম্পানি",
    col3: "আপডেট পান",

    c1: [
      "টিউটর খুঁজুন",
      "কীভাবে কাজ করে",
      "প্রাইসিং",
      "টিউটরদের জন্য"
    ],

    c2: [
      "আমাদের সম্পর্কে",
      "ক্যারিয়ার",
      "ব্লগ",
      "যোগাযোগ"
    ],

    placeholder: "আপনার ইমেইল লিখুন",
    btn: "ফিডব্যাক দিন",

    copy: "© ২০২৬ E-Tuition • সর্বস্বত্ব সংরক্ষিত"
  },

  profile: {
    personalInfo: "ব্যক্তিগত তথ্য",

    bio: "নিজের সম্পর্কে",
    bioPlaceholder: "আপনার অভিজ্ঞতা ও পড়ানোর স্টাইল সম্পর্কে লিখুন...",

    phone: "মোবাইল নম্বর",
    phonePlaceholder: "মোবাইল নম্বর লিখুন",

    minSalary: "সর্বনিম্ন বেতন",
    experience: "অভিজ্ঞতা",
    years: "বছর",

    gender: "লিঙ্গ",

    teachingMode: "পড়ানোর ধরন",

    distance: "পছন্দের দূরত্ব (কিমি)",

    medium: "মাধ্যম",
    class: "শ্রেণি",
    subject: "বিষয়",

    availability: "সময়সূচি",

    uploadPhoto: "প্রোফাইল ছবি আপলোড করতে ছবিতে ক্লিক করুন"
  },

  education: {
    title: "শিক্ষাগত তথ্য যোগ করুন",

    degree: "ডিগ্রি",
    institution: "প্রতিষ্ঠান",
    passingYear: "পাসের বছর",
    result: "রেজাল্ট",

    certificate: "সার্টিফিকেট",

    uploadDoc: "ডকুমেন্ট আপলোড করুন",

    saveUnlock: "আনলক করতে প্রোফাইল সেভ করুন"
  },

  qualification: {
    title: "যোগ্যতা যোগ করুন",

    skill: "দক্ষতা / সার্টিফিকেট",
    organization: "প্রতিষ্ঠান"
  },

  actions: {
    save: "সেভ করুন",
    cancel: "বাতিল",

    updateProfile: "প্রোফাইল আপডেট করুন",
    createProfile: "প্রোফাইল তৈরি করুন",

    saveAdd: "সেভ করে আরেকটি যোগ করুন",

    selectYear: "বছর নির্বাচন করুন"
  }
}
};

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.bn;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'etuition_lang';
const SUPPORTED: Language[] = ['en', 'bn'];

function isValidLang(v: string | null): v is Language {
  return SUPPORTED.includes(v as Language);
}

/** Read preferred language: URL ?lang= → localStorage → 'bn' */
function readInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'bn';
  const urlLang = new URLSearchParams(window.location.search).get('lang');
  if (isValidLang(urlLang)) return urlLang;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (isValidLang(stored)) return stored;
  return 'bn';
}

/** Reflect language in URL without triggering a navigation */
function syncLangToUrl(lang: Language) {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  // 'bn' is the default — keep URLs clean by omitting the param
  if (lang === 'bn') {
    url.searchParams.delete('lang');
  } else {
    url.searchParams.set('lang', lang);
  }
  window.history.replaceState(null, '', url.toString());
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('bn');

  // Hydrate from URL / localStorage after SSR
  useEffect(() => {
    const initial = readInitialLanguage();
    setLanguageState(initial);
    document.documentElement.lang = initial;
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    syncLangToUrl(lang);
    // Keep <html lang="…"> in sync — crawlers and screen readers read this
    document.documentElement.lang = lang;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translations[language] }}>
      {children}
    </LanguageContext.Provider>
  );
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
