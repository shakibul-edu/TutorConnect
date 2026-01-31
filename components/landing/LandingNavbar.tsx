'use client';

import React, { useState, useEffect } from 'react';
import { Menu, X, MapPin, User as UserIcon, LayoutDashboard, RefreshCw, LogOut, Bell, Search } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Link, useRouter } from '../../lib/router';
import { useAuth } from '../../lib/auth';
import { useSession, signOut } from 'next-auth/react';

const LandingNavbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  
  const { user, logout, openAuthModal, toggleUserMode } = useAuth();
  const { data: session } = useSession();
  const { push } = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'bn' : 'en');
  };

  const handleLogout = async () => {
    // Sign out from NextAuth
    await signOut({ redirect: false });
    // Also call app's logout
    logout();
    setIsMobileMenuOpen(false);
  };

    // Display session user if available, otherwise fall back to app user
  const displayUser = session?.user || user;
  const displayName = displayUser?.name || (user ? `${user.first_name} ${user.last_name}` : '');
  const displayEmail = displayUser?.email || user?.email || '';
  const displayImage = displayUser?.image || '';

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-4' : 'bg-transparent py-6'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-400/50 transform -rotate-3">
              <MapPin className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900 font-display">
              Tutor<span className="text-brand-600">Link</span>
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="jobs" className="text-slate-600 hover:text-brand-600 font-medium transition-colors cursor-pointer">Tuition Jobs</Link>
            <Link href="tutors" className="text-slate-600 hover:text-brand-600 font-medium transition-colors cursor-pointer">Find Tutors</Link>
            <a href="#features" className="text-slate-600 hover:text-brand-600 font-medium transition-colors cursor-pointer">{t.nav.features}</a>
            <a href="#how-it-works" className="text-slate-600 hover:text-brand-600 font-medium transition-colors cursor-pointer">{t.nav.howItWorks}</a>
            <a href="#reviews" className="text-slate-600 hover:text-brand-600 font-medium transition-colors cursor-pointer">{t.nav.reviews}</a>
            
            {/* Language Toggle */}
            <button 
              onClick={toggleLanguage}
              className="flex items-center space-x-2 px-4 py-2 rounded-full border border-slate-200 hover:bg-slate-50 transition-all shadow-sm hover:shadow-md group bg-white"
            >
              <img 
                src={language === 'en' ? "https://flagcdn.com/w40/us.png" : "https://flagcdn.com/w40/bd.png"} 
                alt={language === 'en' ? "USA Flag" : "Bangladesh Flag"} 
                className="w-6 h-4 object-cover rounded shadow-sm group-hover:scale-110 transition-transform"
              />
              <span className="text-sm font-bold text-slate-700 uppercase tracking-wide">{language}</span>
            </button>

            {displayUser ? (
                <>
                 {/* User is Logged In */}
                 <div className="relative group">
                    <button className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none bg-white/50 p-1 rounded-full border-2 border-transparent hover:border-brand-200 transition-all">
                      {displayImage ? (
                        <img 
                          src={displayImage} 
                          alt="User" 
                          className="w-8 h-8 rounded-full border border-gray-200" 
                        />
                      ) : (
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border bg-indigo-100 text-indigo-700 border-indigo-200`}>
                          {displayName[0] || 'U'}
                        </span>
                      )}
                    </button>
                    {/* Dropdown */}
                    <div className="absolute right-0 top-full pt-2 w-56 hidden group-hover:block">
                      <div className="bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 border border-gray-100">
                      <div className="px-4 py-2 border-b border-gray-50">
                          <p className="text-xs font-semibold text-gray-400 uppercase">Manage Account</p>
                          <p className="text-sm font-bold text-gray-900 truncate">{displayName}</p>
                      </div>
                      <button onClick={() => push('dashboard')} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left font-medium">
                          <LayoutDashboard className="w-4 h-4 text-gray-400" />
                          Dashboard
                      </button>
                      <button onClick={() => push('profile-edit')} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left font-medium">
                          <UserIcon className="w-4 h-4 text-gray-400" />
                          Edit Profile
                      </button>
                      <div className="border-t border-gray-100 my-1"></div>
                      {user && (
                        <button 
                            onClick={toggleUserMode} 
                            className={`flex items-center gap-2 px-4 py-2 text-sm w-full text-left font-bold ${user.is_teacher ? 'text-blue-600 hover:bg-blue-50' : 'text-indigo-600 hover:bg-indigo-50'}`}
                        >
                            <RefreshCw className="w-4 h-4" />
                            Switch to {user.is_teacher ? 'Finder' : 'Tutor'} Mode
                        </button>
                      )}
                      <div className="border-t border-gray-100 my-1"></div>
                      <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left font-medium">
                          <LogOut className="w-4 h-4 text-red-400" />
                          Sign out
                      </button>
                      </div>
                    </div>
                 </div>
                </>
            ) : (
                <button onClick={openAuthModal} className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-full hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-display flex items-center justify-center">
                    {t.nav.getStarted}
                </button>
            )}

            
          </div>

          {/* Mobile Toggle */}
          <div className="md:hidden flex items-center space-x-4">
             {/* Show Avatar on Mobile too if needed, or keeping simplified */}
             {displayUser && (
                <button onClick={() => push('dashboard')} className="flex items-center">
                    {displayImage ? (
                        <img 
                          src={displayImage} 
                          alt="User" 
                          className="w-8 h-8 rounded-full border border-gray-200" 
                        />
                      ) : (
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border bg-indigo-100 text-indigo-700 border-indigo-200`}>
                          {displayName[0] || 'U'}
                        </span>
                      )}
                </button>
             )}


            <button 
                onClick={toggleLanguage}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white shadow-sm"
              >
              <img 
                src={language === 'en' ? "https://flagcdn.com/w40/us.png" : "https://flagcdn.com/w40/bd.png"} 
                alt={language === 'en' ? "USA Flag" : "Bangladesh Flag"} 
                className="w-5 h-3.5 object-cover rounded"
              />
              <span className="text-xs font-bold text-slate-700 uppercase">{language}</span>
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-slate-600 hover:text-slate-900 p-2"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-slate-100 shadow-xl p-4 flex flex-col space-y-4 max-h-[80vh] overflow-y-auto">
          <Link href="jobs" className="text-slate-600 hover:text-brand-600 font-medium p-2" onClick={() => setIsMobileMenuOpen(false)}>Tuition Jobs</Link>
          <Link href="tutors" className="text-slate-600 hover:text-brand-600 font-medium p-2" onClick={() => setIsMobileMenuOpen(false)}>Find Tutors</Link>
          <a href="#features" className="text-slate-600 hover:text-brand-600 font-medium p-2" onClick={() => setIsMobileMenuOpen(false)}>{t.nav.features}</a>
          <a href="#how-it-works" className="text-slate-600 hover:text-brand-600 font-medium p-2" onClick={() => setIsMobileMenuOpen(false)}>{t.nav.howItWorks}</a>
          <a href="#reviews" className="text-slate-600 hover:text-brand-600 font-medium p-2" onClick={() => setIsMobileMenuOpen(false)}>{t.nav.reviews}</a>
          
          {displayUser ? (
             <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center px-2 mb-4">
                    <div className="flex-shrink-0">
                    {displayImage ? (
                        <img 
                        src={displayImage} 
                        alt="User" 
                        className="h-10 w-10 rounded-full border border-gray-200" 
                        />
                    ) : (
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold border bg-indigo-100 text-indigo-700 border-indigo-200`}>
                        {displayName[0] || 'U'}
                        </div>
                    )}
                    </div>
                    <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">{displayName}</div>
                    <div className="text-sm font-medium text-gray-500">{displayEmail}</div>
                    </div>
                </div>

                <button onClick={() => { push('dashboard'); setIsMobileMenuOpen(false); }} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left font-medium">
                    <LayoutDashboard className="w-4 h-4 text-gray-400" />
                    Dashboard
                </button>
                <button onClick={() => { push('profile-edit'); setIsMobileMenuOpen(false); }} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left font-medium">
                    <UserIcon className="w-4 h-4 text-gray-400" />
                    Edit Profile
                </button>
                {user && (
                    <button 
                        onClick={() => { toggleUserMode(); setIsMobileMenuOpen(false); }} 
                        className={`flex items-center gap-2 px-4 py-2 text-sm w-full text-left font-bold ${user.is_teacher ? 'text-blue-600 hover:bg-blue-50' : 'text-indigo-600 hover:bg-indigo-50'}`}
                    >
                        <RefreshCw className="w-4 h-4" />
                        Switch to {user.is_teacher ? 'Finder' : 'Tutor'} Mode
                    </button>
                )}
                <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left font-medium">
                    <LogOut className="w-4 h-4 text-red-400" />
                    Sign out
                </button>
             </div>
          ) : (
            <button onClick={() => { openAuthModal(); setIsMobileMenuOpen(false); }} className="w-full py-3 bg-brand-600 text-white font-bold rounded-xl shadow-lg shadow-brand-300/50 flex items-center justify-center">
                {t.nav.getStarted}
            </button>
          )}

        </div>
      )}
    </nav>
  );
};

export default LandingNavbar;
