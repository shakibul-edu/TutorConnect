
'use client';

import React, { useState, useEffect } from 'react';
import { JobCard } from '../../components/JobCard';
import Sidebar, { FilterState } from '../../components/Sidebar';
import { SlidersHorizontal } from 'lucide-react';
import { getJobPosts } from '../../services/backend';
import { JobPost } from '../../types';
import { useSession } from 'next-auth/react';

const JobsPage: React.FC = () => {
  const { data: session, status } = useSession();
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    postId: "",
    schedule: undefined,
    feeRange: 25000,
    gender: "Any",
    tuitionType: "All Tuition",
    distance: 20
  });
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
      if (status === 'loading') return;
      setLoading(true);
      try {
          const apiFilters: any = {};
          if (filters.postId) apiFilters.id = filters.postId;
          if (filters.feeRange) apiFilters.max_salary = filters.feeRange; 
          if (filters.gender && filters.gender !== "Any") apiFilters.gender = filters.gender.toLowerCase();
          if (filters.tuitionType && filters.tuitionType !== "All Tuition") {
             const requiredMode = filters.tuitionType === "Online" ? "online" : "offline";
             apiFilters.teaching_mode = requiredMode;
          }
           if (filters.distance) apiFilters.preferred_distance = filters.distance;

          const backendAccess = (session as any)?.backendAccess;
          const token = backendAccess || localStorage.getItem('auth_token') || '';
          
          const fetchedJobs = await getJobPosts(token, apiFilters);
          if (Array.isArray(fetchedJobs)) {
              setJobs(fetchedJobs);
          } else {
              setJobs([]);
          }
      } catch (error) {
          console.error("Error fetching jobs:", error);
          setJobs([]); 
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
    fetchJobs();
  }, [filters, session, status]);

  const handleUpdate = () => {
    fetchJobs();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:hidden mb-4">
            <button 
                onClick={() => setShowMobileFilter(!showMobileFilter)}
                className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 p-3 rounded-lg text-gray-700 font-medium"
            >
                <SlidersHorizontal className="w-5 h-5" />
                {showMobileFilter ? 'Hide Filters' : 'Show Advanced Filters'}
            </button>
        </div>

        <div className={`lg:w-64 flex-shrink-0 ${showMobileFilter ? 'block' : 'hidden lg:block'}`}>
            <Sidebar onApplyFilter={(newFilters) => {
                setFilters(newFilters);
                setShowMobileFilter(false);
            }} />
        </div>

        <div className="flex-grow">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Browse Tuition Jobs</h2>
                <p className="text-gray-500">Showing {jobs.length} results</p>
            </div>

            {loading ? (
                 <div className="flex justify-center py-12">
                     <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                 </div>
            ) : jobs.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
                    {jobs.map(job => (
                      <JobCard key={job.id} job={job} onUpdate={handleUpdate} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200 border-dashed">
                    <p className="text-gray-500">No jobs match your current filters.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default JobsPage;
