'use client';

import React, { useState, useEffect } from 'react';
import { Link, usePathname, useRouter } from '../lib/router';
import { useAuth } from '../lib/auth';
import { useSession, signOut } from 'next-auth/react';
import { 
  User as UserIcon, 
  LayoutDashboard, 
  RefreshCw, 
  LogOut, 
  Bell, 
  Menu, 
  X,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import useLocation from '../LocationHook';
import Logo from './Logo';
import Image from 'next/image';
import LocationBanner from './LocationBanner';

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  
  const { user, logout, openAuthModal, toggleUserMode } = useAuth();
  const { data: session } = useSession();
  const { pendingUpdate, permissionDenied, confirmUpdate, cancelUpdate } = useLocation(session);
  const { push } = useRouter();
  const pathname = usePathname();

  const isHomePage = pathname === 'home';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    // Only add scroll listener on home page
    if (isHomePage) {
      window.addEventListener('scroll', handleScroll);
      // Initial check
      setIsScrolled(window.scrollY > 20);
    } else {
      // Always "scrolled" (solid background) on other pages
      setIsScrolled(true);
    }
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHomePage]);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'bn' : 'en');
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    logout();
    setIsMobileMenuOpen(false);
  };

  // Display session user if available, otherwise fall back to app user
  const displayUser = session?.user || user;
  const displayName = session?.user?.name || (user ? `${user.first_name} ${user.last_name}` : '');
  const displayEmail = session?.user?.email || user?.email || '';
  const displayImage = session?.user?.image || user?.image || '';

  // Determine navbar classes based on route and scroll state
  // Removed padding from here, moving it to inner container
  const navbarClasses = isHomePage
    ? `fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm' : 'bg-transparent'}`
    : 'sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm'; 

  // Dynamic padding for the inner container
  const paddingClass = isHomePage
    ? (isScrolled ? 'py-4' : 'py-6')
    : 'py-4';

  // Adjust text colors based on background
  const textColorClass = (isHomePage && !isScrolled) ? 'text-slate-600 hover:text-brand-600' : 'text-slate-600 hover:text-brand-600';
  const logoTextClass = (isHomePage && !isScrolled) ? 'text-slate-900' : 'text-slate-900';

  return (
    <nav className={`${navbarClasses} flex flex-col`}>
      {(pendingUpdate || permissionDenied) && (
        <div className="w-full z-[60]">
             {pendingUpdate && (
                <LocationBanner 
                    type="update"
                    message={`New location detected (${pendingUpdate.distance.toFixed(2)} km away). Update your location?`}
                    onConfirm={confirmUpdate}
                    onDismiss={cancelUpdate}
                />
             )}
             {permissionDenied && (
                <LocationBanner 
                    type="permission"
                    message="Location access is denied. Please enable location services for better experience."
                    onConfirm={() => {
                        // Attempt to request permission again by reloading or guiding user
                        // Navigator.permissions API is read-only mostly, so we can just alert or guide
                        alert("Please enable location access in your browser settings.");
                    }}
                    onDismiss={() => {
                         // Optional: Allow dismissing permission warning for this session
                    }}
                />
             )}
        </div>
      )}
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full transition-all duration-300 ${paddingClass}`}>
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="home" className="flex items-center space-x-2 cursor-pointer no-underline">
            <Logo className="w-12 h-12" />
            <span className={`text-2xl font-bold tracking-tight font-display ${logoTextClass}`}>
              E-<span className={user?.is_teacher ? 'text-indigo-600' : 'text-brand-600'}>Tuition</span>
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/jobs" className={`${textColorClass} font-medium transition-colors cursor-pointer`}>{t.nav.tuitionJobs}</Link>
            <Link href="/tutors" className={`${textColorClass} font-medium transition-colors cursor-pointer`}>{t.nav.findTutors}</Link>
            
            <a href="/#features" className={`${textColorClass} font-medium transition-colors cursor-pointer`}>{t.nav.features}</a>
            <a href="/#how-it-works" className={`${textColorClass} font-medium transition-colors cursor-pointer`}>{t.nav.howItWorks}</a>
            
            
            {/* Language Toggle */}
            <button 
              onClick={toggleLanguage}
              className="flex items-center space-x-2 px-4 py-2 rounded-full border border-slate-200 hover:bg-slate-50 transition-all shadow-sm hover:shadow-md group bg-white"
            >
              <Image 
                src={language === 'en' ? "https://flagcdn.com/w40/us.png" : "https://flagcdn.com/w40/bd.png"} 
                alt={language === 'en' ? "USA Flag" : "Bangladesh Flag"} 
                className="w-6 h-4 object-cover rounded shadow-sm group-hover:scale-110 transition-transform"
                width={24}
                height={16}
              />
              <span className="text-sm font-bold text-slate-700 uppercase tracking-wide">{language}</span>
            </button>

            {displayUser ? (
                <>
                 {/* Mode Indicator */}
                 <div className="flex items-center bg-gray-50 rounded-full px-3 py-1 border border-gray-200">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${user?.is_teacher ? 'text-indigo-600' : 'text-blue-600'}`}>
                      {user?.is_teacher ? 'Tutor Mode' : 'Finder Mode'}
                    </span>
                  </div>

                  {/* Notifications */}
                  <button className="text-gray-500 hover:text-gray-700 p-2 relative">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                  </button>

                 {/* User Profile */}
                 <div className="relative group">
                    <button className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none bg-white/50 p-1 rounded-full border-2 border-transparent hover:border-brand-200 transition-all">
                      {displayImage ? (
                        <Image 
                          src={displayImage} 
                          alt="User" 
                          className="w-8 h-8 rounded-full border border-gray-200"
                          width={32}
                          height={32}
                        />
                      ) : (
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border ${user?.is_teacher ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                          {displayName[0] || 'U'}
                        </span>
                      )}
                    </button>
                    {/* Dropdown */}
                    <div className="absolute right-0 top-full pt-2 w-64 hidden group-hover:block">
                      <div className="bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 border border-gray-100">
                      <div className="px-4 py-3 border-b border-gray-50">
                          <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Signed in as</p>
                          <p className="text-sm font-bold text-gray-900 truncate">{displayName}</p>
                          <p className="text-xs text-gray-500 truncate">{displayEmail}</p>
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
                <div className="flex items-center gap-3">
                    <button onClick={openAuthModal} className="text-slate-600 hover:text-slate-900 font-medium px-4 py-2 transition-colors">
                        Log in
                    </button>
                    <button onClick={openAuthModal} className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-full hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-display flex items-center justify-center">
                        {t.nav.getStarted}
                    </button>
                </div>
            )}
          </div>

          {/* Mobile Toggle */}
          <div className="md:hidden flex items-center space-x-4">
             {displayUser && (
                <button onClick={() => push('dashboard')} className="flex items-center bg-gray-50 p-1 rounded-full">
                    {displayImage ? (
                        <img 
                          src={displayImage} 
                          alt="User" 
                          className="w-8 h-8 rounded-full border border-gray-200" 
                        />
                      ) : (
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border ${user?.is_teacher ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                          {displayName[0] || 'U'}
                        </span>
                      )}
                </button>
             )}


            <button 
                onClick={toggleLanguage}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white shadow-sm"
              >
              <Image 
                src={language === 'en' ? "https://flagcdn.com/w40/us.png" : "https://flagcdn.com/w40/bd.png"} 
                alt={language === 'en' ? "USA Flag" : "Bangladesh Flag"} 
                className="w-5 h-3.5 object-cover rounded"
                width={20}
                height={14}
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
          <Link href="home" className="text-slate-600 hover:text-brand-600 font-medium p-2 block" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
          <Link href="/jobs" className="text-slate-600 hover:text-brand-600 font-medium p-2 block" onClick={() => setIsMobileMenuOpen(false)}>Tuition Jobs</Link>
          <Link href="/tutors" className="text-slate-600 hover:text-brand-600 font-medium p-2 block" onClick={() => setIsMobileMenuOpen(false)}>Find Tutors</Link>
          
          <a href="/#features" className="text-slate-600 hover:text-brand-600 font-medium p-2 block" onClick={() => setIsMobileMenuOpen(false)}>{t.nav.features}</a>
          <a href="/#how-it-works" className="text-slate-600 hover:text-brand-600 font-medium p-2 block" onClick={() => setIsMobileMenuOpen(false)}>{t.nav.howItWorks}</a>

          {displayUser ? (
             <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center px-2 mb-4 bg-gray-50 p-3 rounded-lg">
                    <div className="flex-shrink-0">
                    {displayImage ? (
                        <img 
                        src={displayImage} 
                        alt="User" 
                        className="h-10 w-10 rounded-full border border-gray-200" 
                        />
                    ) : (
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold border ${user?.is_teacher ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                        {displayName[0] || 'U'}
                        </div>
                    )}
                    </div>
                    <div className="ml-3 overflow-hidden">
                    <div className="text-base font-medium text-gray-800 truncate">{displayName}</div>
                    <div className="text-sm font-medium text-gray-500 truncate">{displayEmail}</div>
                    </div>
                </div>

                <div className="space-y-1">
                    <button onClick={() => { push('dashboard'); setIsMobileMenuOpen(false); }} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left font-medium rounded-md">
                        <LayoutDashboard className="w-4 h-4 text-gray-400" />
                        Dashboard
                    </button>
                    <button onClick={() => { push('profile-edit'); setIsMobileMenuOpen(false); }} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left font-medium rounded-md">
                        <UserIcon className="w-4 h-4 text-gray-400" />
                        Edit Profile
                    </button>
                    {user && (
                        <button 
                            onClick={() => { toggleUserMode(); setIsMobileMenuOpen(false); }} 
                            className={`flex items-center gap-2 px-4 py-2 text-sm w-full text-left font-bold rounded-md ${user.is_teacher ? 'text-blue-600 hover:bg-blue-50' : 'text-indigo-600 hover:bg-indigo-50'}`}
                        >
                            <RefreshCw className="w-4 h-4" />
                            Switch to {user.is_teacher ? 'Finder' : 'Tutor'} Mode
                        </button>
                    )}
                    <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left font-medium rounded-md">
                        <LogOut className="w-4 h-4 text-red-400" />
                        Sign out
                    </button>
                </div>
             </div>
          ) : (
             <div className="pt-4 space-y-3">
                <button onClick={() => { openAuthModal(); setIsMobileMenuOpen(false); }} className="w-full py-2.5 text-slate-600 font-bold border border-slate-200 rounded-xl hover:bg-slate-50">
                    Log In
                </button>
                <button onClick={() => { openAuthModal(); setIsMobileMenuOpen(false); }} className="w-full py-3 bg-brand-600 text-white font-bold rounded-xl shadow-lg shadow-brand-300/50 flex items-center justify-center">
                    {t.nav.getStarted}
                </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
