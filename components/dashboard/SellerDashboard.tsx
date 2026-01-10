
import React, { useState } from 'react';
import { Bid, Review } from '../../types';
import { stateManager } from '../../services/stateManager';
import StatCard from './StatCard';
import { ClipboardList, CheckCircle, MessageSquare, Clock, Star } from 'lucide-react';
import ReviewModal from '../ReviewModal';

interface SellerDashboardProps {
  myBids: Bid[];
}

const SellerDashboard: React.FC<SellerDashboardProps> = ({ myBids }) => {
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewTutorName, setReviewTutorName] = useState('');

  const handleViewReview = (bid: Bid) => {
    const review = stateManager.getReviewForJobAndTutor(bid.job_id, bid.tutor.id);
    if (review) {
      setSelectedReview(review);
      setReviewTutorName(`${bid.tutor.user.first_name} ${bid.tutor.user.last_name}`);
      setIsReviewModalOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Applications Sent" value={myBids.length} colorClass="bg-indigo-600" icon={ClipboardList} />
        <StatCard title="Hired" value={myBids.filter(b => b.status === 'accepted').length} colorClass="bg-emerald-500" icon={CheckCircle} />
        <StatCard title="Messages" value="0" colorClass="bg-blue-500" icon={MessageSquare} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-gray-900">My Applications</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {myBids.length > 0 ? myBids.map(bid => {
            const job = stateManager.getJobs().find(j => j.id === bid.job_id);
            const review = stateManager.getReviewForJobAndTutor(bid.job_id, bid.tutor.id);
            const statusColors = {
              pending: 'bg-yellow-100 text-yellow-800',
              accepted: 'bg-green-100 text-green-800 border border-green-200',
              rejected: 'bg-red-50 text-red-500'
            };

            return (
              <div key={bid.id} className="p-5 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-lg">{job?.title || 'Unknown Job'}</h4>
                    <div className="flex flex-wrap items-center gap-4 mt-1">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>Applied {new Date(bid.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="text-sm font-semibold text-indigo-600">Proposed: {bid.proposed_salary} BDT</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                     {bid.status === 'accepted' && review && (
                        <button 
                            onClick={() => handleViewReview(bid)}
                            className="flex items-center gap-1 text-sm font-bold text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-200 hover:bg-yellow-100"
                        >
                            <Star className="w-3 h-3 fill-current" />
                            View Feedback
                        </button>
                     )}
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${statusColors[bid.status]}`}>
                      {bid.status}
                    </span>
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="p-12 text-center text-gray-400">No applications found.</div>
          )}
        </div>
      </div>

      {isReviewModalOpen && selectedReview && (
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          tutorName={reviewTutorName}
          review={selectedReview}
          readOnly={true}
        />
      )}
    </div>
  );
};

export default SellerDashboard;
