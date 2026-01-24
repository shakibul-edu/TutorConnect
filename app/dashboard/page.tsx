
'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { useSession } from 'next-auth/react';
import { stateManager } from '../../services/stateManager';
import { AlertCircle, PlusCircle } from 'lucide-react';
import PostJobModal from '../../components/PostJobModal';
import SellerDashboard from '../../components/dashboard/SellerDashboard';
import BuyerDashboard from '../../components/dashboard/BuyerDashboard';
import ContactRequestList from '../../components/dashboard/ContactRequestList';
import { getContactRequests, updateContactRequest } from '../../services/backend';
import { ContactRequest } from '../../types';
import { toast } from '../../lib/toast';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  // @ts-ignore
  const { data: session } = useSession();
  const [isPostJobModalOpen, setIsPostJobModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [contactLoading, setContactLoading] = useState(false);
  const [requestsAsStudent, setRequestsAsStudent] = useState<ContactRequest[]>([]);
  const [requestsAsTeacher, setRequestsAsTeacher] = useState<ContactRequest[]>([]);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // @ts-ignore
  const token = (session as any)?.backendAccess;

  const triggerRefresh = () => setRefreshKey(prev => prev + 1);

  useEffect(() => {
    const fetchContactRequests = async () => {
      if (!token || !user) return;
      setContactLoading(true);
      try {
        const [asStudent, asTeacher] = await Promise.all([
          getContactRequests(token, { student: user.id }),
          getContactRequests(token, { teacher: user.id })
        ]);

        setRequestsAsStudent(Array.isArray(asStudent) ? asStudent : []);
        setRequestsAsTeacher(Array.isArray(asTeacher) ? asTeacher : []);
      } catch (error) {
        console.error('Error loading contact requests', error);
      } finally {
        setContactLoading(false);
      }
    };

    fetchContactRequests();
  }, [token, user, refreshKey]);

  const handleContactStatusChange = async (id: number, status: 'accepted' | 'rejected') => {
    if (!token) {
      toast.error('You must be logged in to update requests.');
      return;
    }
    setActionLoadingId(id);
    try {
      await updateContactRequest(token, String(id), { status });
      toast.success(`Request ${status}.`);
      triggerRefresh();
    } catch (error) {
      console.error('Error updating contact request', error);
      toast.error('Failed to update request.');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <AlertCircle className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Access Denied</h2>
        <p className="text-gray-500">Please log in to view your personalized dashboard.</p>
      </div>
    );
  }

  const myJobs = stateManager.getJobs().filter(j => j.posted_by.id === user.id);
  const myBids = stateManager.getBidsByTutor(user.id);
  const totalBidsReceived = myJobs.reduce((acc, job) => acc + job.bids_count, 0);

  return (
    <div key={refreshKey} className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${user.is_teacher ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'}`}>
                {user.is_teacher ? 'Tutor Mode' : 'Finder Mode'}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Welcome, {user.first_name}!</h1>
          </div>
          {!user.is_teacher && (
            <button 
              onClick={() => setIsPostJobModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold shadow-md hover:bg-blue-700"
            >
              <PlusCircle className="w-5 h-5" />
              Post Requirement
            </button>
          )}
        </div>

        {user.is_teacher ? (
            <SellerDashboard myBids={myBids} />
        ) : (
            <BuyerDashboard 
                myJobs={myJobs} 
                totalBidsReceived={totalBidsReceived} 
                onRefresh={triggerRefresh} 
                user={user}
            />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <ContactRequestList 
            title="Sent Contact Requests" 
            requests={requestsAsStudent} 
            role="student" 
            loading={contactLoading}
          />

          {(user.is_teacher || requestsAsTeacher.length > 0) && (
            <ContactRequestList 
              title="Requests To You" 
              requests={requestsAsTeacher} 
              role="teacher" 
              loading={contactLoading}
              onStatusChange={handleContactStatusChange}
              actionLoadingId={actionLoadingId}
            />
          )}
        </div>

        {isPostJobModalOpen && (
          <PostJobModal 
            isOpen={isPostJobModalOpen} 
            onClose={() => setIsPostJobModalOpen(false)} 
            user={user} 
            onSuccess={triggerRefresh}
          />
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
