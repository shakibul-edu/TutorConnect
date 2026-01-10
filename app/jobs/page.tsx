
'use client';

import React, { useState, useEffect } from 'react';
import { JobCard } from '../../components/JobCard';
import Sidebar, { FilterState } from '../../components/Sidebar';
import { SlidersHorizontal } from 'lucide-react';
import { stateManager } from '../../services/stateManager';

const JobsPage: React.FC = () => {
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [jobs, setJobs] = useState(stateManager.getJobs());
  const [filters, setFilters] = useState<FilterState>({
    postId: "",
    schedule: undefined,
    feeRange: 25000,
    gender: "Any",
    tuitionType: "All Tuition",
    distance: 20
  });

  // Re-fetch jobs from stateManager whenever a user interacts or component mounts
  useEffect(() => {
    setJobs(stateManager.getJobs());
  }, []);

  const handleUpdate = () => {
    setJobs([...stateManager.getJobs()]);
  };

  const filteredJobs = jobs.filter(job => {
    if (filters.postId && job.id.toString() !== filters.postId) return false;
    if (job.min_salary > filters.feeRange) return false;
    if (job.preferred_distance > filters.distance) return false;
    if (filters.gender !== "Any" && job.gender !== 'any' && job.gender.toLowerCase() !== filters.gender.toLowerCase()) return false;
    if (filters.tuitionType !== "All Tuition") {
        const requiredMode = filters.tuitionType === "Online" ? "online" : "offline";
        if (job.teaching_mode !== 'any' && job.teaching_mode !== requiredMode) return false;
    }
    return true;
  });

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
                <p className="text-gray-500">Showing {filteredJobs.length} results</p>
            </div>

            {filteredJobs.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
                    {filteredJobs.map(job => (
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
