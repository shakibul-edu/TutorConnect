
'use client';

import React, { useState } from 'react';
import { Link, usePathname, useRouter } from '../lib/router';
import { useAuth } from '../lib/auth';
import { useSession, signOut } from 'next-auth/react';
import { 
  GraduationCap, 
  Bell, 
  PlusCircle, 
  Menu, 
  X, 
  LogOut, 
  User as UserIcon, 
  LayoutDashboard, 
  RefreshCw,
  Search
} from 'lucide-react';
import PostJobModal from './PostJobModal';

const Navbar: React.FC = () => {
  const { user, logout, openAuthModal, toggleUserMode } = useAuth();
  const { data: session } = useSession();
  const pathname = usePathname();
  const { push } = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPostJobModalOpen, setIsPostJobModalOpen] = useState(false);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // Display session user if available, otherwise fall back to app user
  const sessionUser = session?.user;
  const displayUser = sessionUser || user;
  const displayName = sessionUser?.name || (user ? `${user.first_name} ${user.last_name}` : '');
  const displayEmail = sessionUser?.email || user?.email || '';
  const displayImage = sessionUser?.image || '';

  const handleLogout = async () => {
    // Sign out from NextAuth
    await signOut({ redirect: false });
    // Also call app's logout
    logout();
    closeMobileMenu();
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link 
              href="home"
              className="flex-shrink-0 flex items-center gap-2 cursor-pointer"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${user?.is_teacher ? 'bg-indigo-600' : 'bg-blue-600'}`}>
                 <GraduationCap className="text-white w-5 h-5" />
              </div>
              <span className="font-bold text-xl tracking-tight text-gray-900">TutorConnect</span>
            </Link>
            <nav className="hidden md:ml-8 md:flex md:space-x-8">
              <Link 
                href="jobs"
                className={`${pathname === 'jobs' ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium h-16`}
              >
                Tuition Jobs
              </Link>
              <Link 
                href="tutors"
                className={`${pathname === 'tutors' ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium h-16`}
              >
                Find Tutors
              </Link>
            </nav>
          </div>
          
          <div className="hidden md:flex items-center gap-4">
            {displayUser ? (
              <>
                <div className="flex items-center bg-gray-50 rounded-full px-3 py-1 border border-gray-200">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${user?.is_teacher ? 'text-indigo-600' : 'text-blue-600'}`}>
                    {user?.is_teacher ? 'Tutor Mode' : 'Finder Mode'}
                  </span>
                </div>

                <button className="text-gray-500 hover:text-gray-700 p-2 relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                </button>

                 {user?.is_teacher ? (
                   <button 
                     onClick={() => push('profile-edit')}
                     className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                   >
                     My Profile
                   </button>
                 ) : null /* COMMENTED OUT - Post Job feature under development
                 (
                    <button 
                      onClick={() => setIsPostJobModalOpen(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                    >
                      <PlusCircle className="w-4 h-4" />
                      Post a Job
                    </button>
                 ) */}

                <div className="relative group">
                   <button className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none">
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
              <>
                <button onClick={openAuthModal} className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Log in
                </button>
                <button onClick={openAuthModal} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm">
                  Sign up
                </button>
              </>
            )}
          </div>

          <div className="-mr-2 flex items-center md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            >
              {isMobileMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white shadow-inner">
          <div className="pt-2 pb-3 space-y-1">
            <button 
              onClick={() => { push('home'); closeMobileMenu(); }} 
              className={`${pathname === 'home' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'} block pl-3 pr-4 py-2 border-l-4 text-base font-medium w-full text-left`}
            >
              Home
            </button>
            <button 
              onClick={() => { push('jobs'); closeMobileMenu(); }} 
              className={`${pathname === 'jobs' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'} block pl-3 pr-4 py-2 border-l-4 text-base font-medium w-full text-left`}
            >
              Tuition Jobs
            </button>
            <button 
              onClick={() => { push('tutors'); closeMobileMenu(); }} 
              className={`${pathname === 'tutors' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'} block pl-3 pr-4 py-2 border-l-4 text-base font-medium w-full text-left`}
            >
              Find Tutors
            </button>
          </div>

          {user && (
            <div className="pt-2 pb-3 border-t border-gray-100 space-y-1">
              <div className="px-4 py-2 mb-2">
                 <button 
                    onClick={() => { toggleUserMode(); closeMobileMenu(); }}
                    className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-bold text-sm shadow-sm transition-all border ${user.is_teacher ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}
                 >
                    <RefreshCw className="w-4 h-4" />
                    Switch to {user.is_teacher ? 'Finder' : 'Tutor'} Mode
                 </button>
              </div>
              
              <button 
                onClick={() => { push('dashboard'); closeMobileMenu(); }} 
                className={`${pathname === 'dashboard' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'} flex items-center gap-3 pl-3 pr-4 py-2 border-l-4 text-base font-medium w-full text-left`}
              >
                <LayoutDashboard className="w-5 h-5 text-gray-400" />
                Dashboard
              </button>
              
              {/* COMMENTED OUT - Post Job feature under development
              {!user.is_teacher && (
                <button 
                  onClick={() => { setIsPostJobModalOpen(true); closeMobileMenu(); }} 
                  className="flex items-center gap-3 pl-3 pr-4 py-2 border-l-4 border-transparent text-blue-600 font-bold bg-blue-50 w-full text-left"
                >
                  <PlusCircle className="w-5 h-5" />
                  Post a Job
                </button>
              )}
              */}

              {user.is_teacher && (
                <button 
                  onClick={() => { push('jobs'); closeMobileMenu(); }} 
                  className="flex items-center gap-3 pl-3 pr-4 py-2 border-l-4 border-transparent text-indigo-600 font-bold bg-indigo-50 w-full text-left"
                >
                  <Search className="w-5 h-5" />
                  Browse Jobs
                </button>
              )}
            </div>
          )}

          <div className="pt-4 pb-4 border-t border-gray-200">
            {displayUser ? (
              <div className="flex items-center px-4">
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
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">{displayName}</div>
                  <div className="text-sm font-medium text-gray-500">{displayEmail}</div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="ml-auto flex-shrink-0 bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <LogOut className="h-6 w-6" />
                </button>
              </div>
            ) : (
               <div className="px-4 space-y-2">
                 <button onClick={() => { openAuthModal(); closeMobileMenu(); }} className="block w-full text-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
                   Sign in / Sign up
                 </button>
               </div>
            )}
          </div>
        </div>
      )}

      {isPostJobModalOpen && user && (
        <PostJobModal 
          isOpen={isPostJobModalOpen} 
          onClose={() => setIsPostJobModalOpen(false)} 
          user={user} 
          onSuccess={() => {
            push('dashboard');
          }}
        />
      )}
    </header>
  );
};

export default Navbar;
