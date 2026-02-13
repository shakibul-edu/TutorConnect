
import React, { useState, useEffect } from 'react';
import { JobPost, JobBid, DashboardStats } from '../../types';
import StatCard from './StatCard';
import { Briefcase, Users, CheckCircle, Send } from 'lucide-react';
import { getJobBids } from '../../services/backend';

interface BuyerDashboardProps {
  myJobs: JobPost[];
  totalBidsReceived: number;
  onRefresh: () => void;
  user: any;
  stats?: DashboardStats | null;
  loading?: boolean;
  token: string;
}

const BuyerDashboard: React.FC<BuyerDashboardProps> = ({ myJobs, totalBidsReceived, onRefresh, user, stats, loading, token }) => {
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [applicants, setApplicants] = useState<JobBid[]>([]);
  const [bidsLoading, setBidsLoading] = useState(false);

  const selectedJob = myJobs.find(j => j.id === selectedJobId);

  useEffect(() => {
    const fetchBids = async () => {
      if (!selectedJobId || !token) return;
      setBidsLoading(true);
      try {
        const bids = await getJobBids(token, selectedJobId);
        if (bids && Array.isArray(bids)) {
          setApplicants(bids);
        }
      } catch (error) {
        console.error('Error fetching bids:', error);
      } finally {
        setBidsLoading(false);
      }
    };

    fetchBids();
  }, [selectedJobId, token]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Active Posts" value={myJobs.filter(j => j.status === 'open').length} colorClass="bg-blue-600" icon={Briefcase} />
        <StatCard title="Total Bids" value={totalBidsReceived} colorClass="bg-purple-600" icon={Users} />
        <StatCard title="Hired Tutors" value={myJobs.filter(j => j.status === 'hired').length} colorClass="bg-emerald-500" icon={CheckCircle} />
        <StatCard 
          title="Requests Sent" 
          value={stats?.total_contact_requests_sent ?? 0} 
          colorClass="bg-amber-600" 
          icon={Send} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-fit">
          <div className="px-6 py-4 border-b border-gray-50 bg-gray-50">
            <h3 className="font-bold text-gray-900">My Job Posts</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {loading ? (
              <div className="p-12 text-center text-gray-400">Loading jobs...</div>
            ) : myJobs.length > 0 ? myJobs.map(job => (
              <button 
                key={job.id} 
                onClick={() => setSelectedJobId(job.id)}
                className={`w-full p-5 text-left transition-all hover:bg-blue-50 group border-l-4 ${selectedJobId === job.id ? 'bg-blue-50 border-blue-600' : 'border-transparent'}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className={`font-bold ${selectedJobId === job.id ? 'text-blue-700' : 'text-gray-900'}`}>{job.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">{job.grade?.name} • <span className="capitalize">{job.status}</span></p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${job.status === 'hired' ? 'bg-green-100 text-green-700' : 'bg-indigo-600 text-white'}`}>
                    {job.bids_count || 0} Bids
                  </span>
                </div>
              </button>
            )) : (
              <div className="p-12 text-center text-gray-400">No jobs posted.</div>
            )}
          </div>
        </div>

        <div className="lg:col-span-7 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
          <div className="px-6 py-4 border-b border-gray-50 bg-gray-50">
            <h3 className="font-bold text-gray-900">
              {selectedJob ? `Applicants for: ${selectedJob.title}` : 'Select a job to view bids'}
            </h3>
          </div>
          
          <div className="p-0">
            {selectedJobId ? (
              bidsLoading ? (
                <div className="p-24 text-center text-gray-400">Loading applicants...</div>
              ) : applicants.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {applicants.map(bid => {
                    const statusColors = {
                      pending: 'bg-yellow-100 text-yellow-800',
                      accepted: 'bg-green-100 text-green-800',
                      rejected: 'bg-red-50 text-red-500',
                      closed: 'bg-gray-100 text-gray-500'
                    };
                    
                    return (
                      <div key={bid.id} className={`p-6 transition-colors ${bid.status === 'accepted' ? 'bg-green-50/50' : 'hover:bg-gray-50'}`}>
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xl flex-shrink-0">
                            T
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold text-gray-900 text-lg">Tutor #{bid.tutor}</h4>
                                <p className="text-xs text-gray-500 mt-1">Applied {new Date(bid.created_at).toLocaleDateString()}</p>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-gray-900">{bid.proposed_salary} BDT</div>
                                <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${statusColors[bid.status]}`}>
                                  {bid.status}
                                </span>
                              </div>
                            </div>
                            <div className="mt-3 bg-white p-3 rounded-lg border border-gray-100 italic text-sm text-gray-600">
                              "{bid.message}"
                            </div>
                            {bid.teacher_phone && (
                              <div className="mt-2 text-sm text-gray-600">
                                <span className="font-semibold">Contact:</span> {bid.teacher_phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-24 text-center text-gray-400">No one has bid on this job yet.</div>
              )
            ) : (
              <div className="p-24 flex flex-col items-center justify-center text-center">
                <Users className="w-12 h-12 text-gray-200 mb-2" />
                <h4 className="text-gray-900 font-bold">Manage Applicants</h4>
                <p className="text-gray-500 text-sm mt-1">Select a post to see who applied and hire your perfect tutor.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyerDashboard;
