
import React, { useState } from 'react';
import { JobPost, Bid, Review } from '../../types';
import { stateManager } from '../../services/stateManager';
import StatCard from './StatCard';
import { Briefcase, Users, CheckCircle, Star, Eye } from 'lucide-react';
import ReviewModal from '../ReviewModal';

interface BuyerDashboardProps {
  myJobs: JobPost[];
  totalBidsReceived: number;
  onRefresh: () => void;
  user: any;
}

const BuyerDashboard: React.FC<BuyerDashboardProps> = ({ myJobs, totalBidsReceived, onRefresh, user }) => {
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [selectedBidForReview, setSelectedBidForReview] = useState<Bid | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [viewingReview, setViewingReview] = useState<Review | undefined>(undefined);

  const selectedJob = myJobs.find(j => j.id === selectedJobId);
  const applicants = selectedJobId ? stateManager.getBidsForJob(selectedJobId) : [];

  const handleAcceptBid = (bidId: number) => {
    if (confirm('Are you sure you want to hire this tutor? This will close the job to other applicants.')) {
      stateManager.updateBidStatus(bidId, 'accepted');
      onRefresh();
    }
  };

  const handleRejectBid = (bidId: number) => {
    stateManager.updateBidStatus(bidId, 'rejected');
    onRefresh();
  };

  const openReviewModal = (bid: Bid) => {
    // Check if review exists
    const existingReview = stateManager.getReviewForJobAndTutor(bid.job_id, bid.tutor.id);
    
    if (existingReview) {
      setViewingReview(existingReview);
      setSelectedBidForReview(bid);
      setIsReviewModalOpen(true);
    } else {
      setViewingReview(undefined);
      setSelectedBidForReview(bid);
      setIsReviewModalOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Active Posts" value={myJobs.filter(j => j.status === 'open').length} colorClass="bg-blue-600" icon={Briefcase} />
        <StatCard title="Total Bids" value={totalBidsReceived} colorClass="bg-purple-600" icon={Users} />
        <StatCard title="Hired Tutors" value={myJobs.filter(j => j.status === 'hired').length} colorClass="bg-emerald-500" icon={CheckCircle} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-fit">
          <div className="px-6 py-4 border-b border-gray-50 bg-gray-50">
            <h3 className="font-bold text-gray-900">My Job Posts</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {myJobs.length > 0 ? myJobs.map(job => (
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
                    {job.bids_count} Bids
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
              applicants.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {applicants.map(bid => {
                    const existingReview = stateManager.getReviewForJobAndTutor(bid.job_id, bid.tutor.id);
                    return (
                      <div key={bid.id} className={`p-6 transition-colors ${bid.status === 'accepted' ? 'bg-green-50/50' : 'hover:bg-gray-50'}`}>
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xl flex-shrink-0">
                            {bid.tutor.user.first_name[0]}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold text-gray-900 text-lg">{bid.tutor.user.first_name} {bid.tutor.user.last_name}</h4>
                                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">{bid.tutor.highest_qualification}</p>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-gray-900">{bid.proposed_salary} BDT</div>
                              </div>
                            </div>
                            <div className="mt-3 bg-white p-3 rounded-lg border border-gray-100 italic text-sm text-gray-600">
                              "{bid.message}"
                            </div>
                            <div className="mt-4 flex gap-2">
                              {bid.status === 'pending' && selectedJob?.status === 'open' && (
                                <>
                                  <button 
                                    onClick={() => handleAcceptBid(bid.id)}
                                    className="flex-1 bg-green-600 text-white py-2 rounded-md text-sm font-bold hover:bg-green-700"
                                  >
                                    Accept & Hire
                                  </button>
                                  <button 
                                    onClick={() => handleRejectBid(bid.id)}
                                    className="flex-1 bg-white border border-red-200 text-red-500 py-2 rounded-md text-sm font-bold hover:bg-red-50"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {bid.status === 'accepted' && (
                                <div className="w-full flex flex-col gap-3">
                                  <div className="flex items-center justify-center gap-2 py-2 bg-green-100 text-green-800 rounded-md font-bold text-sm">
                                    <CheckCircle className="w-4 h-4" />
                                    Tutor Hired
                                  </div>
                                  <button 
                                    onClick={() => openReviewModal(bid)}
                                    className={`flex items-center justify-center gap-2 py-2 rounded-md font-bold text-sm transition-colors ${existingReview ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-yellow-400 text-yellow-900 hover:bg-yellow-500'}`}
                                  >
                                    {existingReview ? (
                                      <>
                                        <Eye className="w-4 h-4" />
                                        View Feedback
                                      </>
                                    ) : (
                                      <>
                                        <Star className="w-4 h-4 fill-current" />
                                        Leave Feedback
                                      </>
                                    )}
                                  </button>
                                </div>
                              )}
                              {bid.status === 'rejected' && (
                                <span className="text-sm font-bold text-red-400 py-2">Application Rejected</span>
                              )}
                            </div>
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

      {isReviewModalOpen && selectedBidForReview && (
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => {
            setIsReviewModalOpen(false);
            setSelectedBidForReview(null);
            setViewingReview(undefined);
          }}
          jobId={selectedBidForReview.job_id}
          tutorId={selectedBidForReview.tutor.id}
          reviewerId={user.id}
          tutorName={`${selectedBidForReview.tutor.user.first_name} ${selectedBidForReview.tutor.user.last_name}`}
          review={viewingReview}
          readOnly={!!viewingReview}
          onSuccess={() => {
            alert('Thank you for your feedback!');
            onRefresh();
          }}
        />
      )}
    </div>
  );
};

export default BuyerDashboard;
