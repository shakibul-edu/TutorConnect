
import React from 'react';
import { RouterProvider, usePathname } from './lib/router';
import { AuthProvider } from './lib/auth';
import { ToastProvider } from './lib/toast';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './app/page';
import JobsPage from './app/jobs/page';
import TutorsPage from './app/tutors/page';
import DashboardPage from './app/dashboard/page';
import ProfileEditPage from './app/profile-edit/page';
import JobDetailsPage from './app/job-details/page';
import TutorDetailsPage from './app/tutor-details/page';

const PageContent = () => {
    const pathname = usePathname();
    
    if (pathname.startsWith('job-details/')) {
        const id = pathname.split('/')[1];
        return <JobDetailsPage id={id} />;
    }

    if (pathname.startsWith('tutor-details/')) {
        const id = pathname.split('/')[1];
        return <TutorDetailsPage id={id} />;
    }

    switch(pathname) {
        case 'jobs': return <JobsPage />;
        case 'tutors': return <TutorsPage />;
        case 'dashboard': return <DashboardPage />;
        case 'profile-edit': return <ProfileEditPage />;
        case 'home':
        default: return <HomePage />;
    }
}

export default function App() {
  return (
    <RouterProvider>
      <ToastProvider>
        <AuthProvider>
          <div className="min-h-screen bg-gray-50 flex flex-col">
              <Navbar />
              <main className="flex-grow">
                  <PageContent />
              </main>
              <Footer />
          </div>
        </AuthProvider>
      </ToastProvider>
    </RouterProvider>
  )
}
