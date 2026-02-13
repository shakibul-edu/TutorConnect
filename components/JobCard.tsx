
'use client';

import React, { useState, useEffect } from 'react';
import { JobPost } from '../types';
import { MapPin, DollarSign, BookOpen, Clock, Users } from 'lucide-react';
import { useAuth } from '../lib/auth';
import BidModal from './BidModal';
import { useRouter } from '../lib/router';

interface JobCardProps {
  job: JobPost;
  onUpdate?: () => void;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onUpdate }) => {
  const { user } = useAuth();
  const { push } = useRouter();
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  useEffect(() => {
    console.log('🔍 JobCard Debug - User state:', {
      exists: !!user,
      is_teacher: user?.is_teacher,
      email: user?.email,
      full_user: user
    });
  }, [user]);

  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <div id={job.id.toString()} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100 overflow-hidden">
      <div className="p-6 cursor-pointer" onClick={() => push(`job-details/${job.id}`)}>
        <div className="flex justify-between items-start mb-4">
          <div>
             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-2">
              {job.teaching_mode === 'any' ? 'Online & Offline' : job.teaching_mode}
            </span>
            <span className='ml-2'>
              {job.status === 'open' ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Open
                </span>) :(
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Closed
                </span>
                )}
            </span>
            <h3 className="text-lg font-semibold text-gray-900 leading-tight hover:text-indigo-600 transition-colors">{job.title}</h3>
            <p className="text-sm text-gray-500 mt-1">Posted by {job.posted_by_name}</p>
          </div>
          <span className="text-sm text-gray-400 whitespace-nowrap">
            {isClient ? timeAgo(job.created_at) : new Date(job.created_at).toLocaleDateString()}
          </span>
        </div>

        <p className="text-gray-600 text-sm line-clamp-3 mb-4">
          {job.description}
        </p>

        <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <span className="font-medium text-gray-900">{job.budget_salary} BDT</span>
          </div>
          <div className="flex items-center gap-2">
             <MapPin className="w-4 h-4 text-gray-400" />
             <span>{job.distance}km range</span>
          </div>
           <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-gray-400" />
            <span>{job.grade?.name}</span>
          </div>
           <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            <span>{job.bids_count} Bids</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-2">
          {job.subject_list?.map(sub => (
            <span key={sub.id} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
              {sub.name}
            </span>
          ))}
        </div>
      </div>
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-between items-center">
        <button 
          onClick={() => push(`job-details/${job.id}`)}
          className="text-indigo-600 hover:text-indigo-700 text-sm font-medium transition-colors"
        >
          View Details
        </button>
        {user?.is_teacher && job.is_biddable !== false && (
          <button 
            onClick={(e) => {
                e.stopPropagation();
                if (job.status === 'open') {
                  setIsBidModalOpen(true);
                }
            }}
            disabled={job.status !== 'open'}
            className="bg-indigo-600 text-white px-4 py-1.5 rounded text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Bid Now
          </button>
        )}
      </div>

      {isBidModalOpen && user && (
        <BidModal
          isOpen={isBidModalOpen}
          onClose={() => setIsBidModalOpen(false)}
          job={job}
          onSuccess={() => {
            alert('Your application has been submitted!');
            onUpdate?.();
          }}
        />
      )}
    </div>
  );
};
