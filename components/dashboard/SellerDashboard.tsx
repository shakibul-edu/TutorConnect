
import React, { useState } from 'react';
import { JobBid, DashboardStats } from '../../types';
import StatCard from './StatCard';
import { ClipboardList, CheckCircle, MessageSquare, Send, Clock, ExternalLink, XCircle } from 'lucide-react';
import Link from 'next/link';
import { updateBidStatus } from '../../services/backend';
import { toast } from '../../lib/toast';

interface SellerDashboardProps {
  myBids: JobBid[];
  stats?: DashboardStats | null;
  loading?: boolean;
  token: string;
  onRefresh: () => void;
}

const SellerDashboard: React.FC<SellerDashboardProps> = ({ myBids, stats, loading, token, onRefresh }) => {
  const [closingBidId, setClosingBidId] = useState<number | null>(null);

  const handleCloseBid = async (bidId: number) => {
    if (!confirm('Are you sure you want to close this bid? This action cannot be undone.')) {
      return;
    }
    
    setClosingBidId(bidId);
    try {
      await updateBidStatus(token, bidId, 'closed');
      toast.success('Bid closed successfully');
      onRefresh();
    } catch (error) {
      console.error('Error closing bid:', error);
      toast.error('Failed to close bid');
    } finally {
      setClosingBidId(null);
    }
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-green-100 text-green-800 border border-green-200',
    rejected: 'bg-red-50 text-red-500',
    closed: 'bg-gray-100 text-gray-500'
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Applications Sent" value={myBids.length} colorClass="bg-indigo-600" icon={ClipboardList} />
        <StatCard title="Hired" value={myBids.filter(b => b.status === 'accepted').length} colorClass="bg-emerald-500" icon={CheckCircle} />
        <StatCard title="Messages" value="0" colorClass="bg-blue-500" icon={MessageSquare} />
        <StatCard 
          title="Requests Received" 
          value={stats?.total_contact_requests_received ?? 0} 
          colorClass="bg-amber-600" 
          icon={Send} 
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-gray-900">My Applications</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="p-12 text-center text-gray-400">Loading applications...</div>
          ) : myBids.length > 0 ? myBids.map(bid => {
            return (
              <div key={bid.id} className="p-5 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-gray-900 text-lg">Job #{bid.job}</h4>
                      <Link 
                        href={`/job-details/${bid.job}`}
                        className="text-indigo-600 hover:text-indigo-800 transition-colors"
                        title="View job details"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 mt-1">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>Applied {new Date(bid.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="text-sm font-semibold text-indigo-600">Proposed: {bid.proposed_salary} BDT</div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{bid.message}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {bid.status === 'pending' && (
                      <button
                        onClick={() => handleCloseBid(bid.id)}
                        disabled={closingBidId === bid.id}
                        className="flex items-center gap-1 text-sm font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <XCircle className="w-3 h-3" />
                        {closingBidId === bid.id ? 'Closing...' : 'Close Bid'}
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
    </div>
  );
};

export default SellerDashboard;
