'use client';

import React, { useState, useEffect } from 'react';
import { JobCard } from '../../components/JobCard';
import Sidebar, { FilterState } from '../../components/Sidebar';
import { SlidersHorizontal } from 'lucide-react';
import { getJobPosts } from '../../services/backend';
import { useSession } from 'next-auth/react';
import { JobPost } from '../../types';

const JobBoardPage: React.FC = () => {
    const { data: session, status } = useSession();
    console.log('🔍 JobBoardPage Debug - Session status:', status, 'Session data:', session);
    const [showMobileFilter, setShowMobileFilter] = useState(false);
    const [jobs, setJobs] = useState<JobPost[]>([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState<FilterState>({
      postId: "", 
      schedule: undefined,
      feeRange: 25000,
      gender: "Any",
      tuitionType: "Any", // matches JobPost.teaching_mode ("online" | "offline" | "any") ? No, sidebar has "All Tuition", "Online", "Offline".
      distance: 20
    });

    const fetchJobs = async (appliedFilters: any = {}) => {
        setLoading(true);

        // Wait for authenticated session before calling backend if token needed, 
        // OR generic public get might be allowed? 
        // Backend service checks for token. If no token, it returns null.
        // Assuming job board requires login as per current backend.ts implementation.
        if (status !== 'authenticated') {
            setLoading(false);
            return;
        }

        const backendAccess = (session as any)?.backendAccess;
        if (!backendAccess) {
             console.warn('No backend access token available yet');
            setLoading(false);
            return;
        }

        try {
            // Map Sidebar filters to API filters if needed
            // Sidebar: tuitionType: "Online", "Offline", "All Tuition"
            // API: teaching_mode: "online", "offline", "any"
            const apiFilters = { ...appliedFilters };
            
            if (apiFilters.tuitionType === "All Tuition") apiFilters.tuitionType = undefined;
            else if (apiFilters.tuitionType) apiFilters.teaching_mode = apiFilters.tuitionType.toLowerCase();

             // Gender: "Any", "Male", "Female" -> lower case
            if (apiFilters.gender === "Any") delete apiFilters.gender;
            else if (apiFilters.gender) apiFilters.gender = apiFilters.gender.toLowerCase();

            const response = await getJobPosts(backendAccess, apiFilters);
            if (response) {
                setJobs(Array.isArray(response) ? response : response.results || []);
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
    }, [session, status]);

    const handleApplyFilter = (newFilters: FilterState) => {
        setFilters(newFilters);
        fetchJobs(newFilters);
        setShowMobileFilter(false);
    };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Mobile Filter Toggle */}
         <div className="lg:hidden mb-4">
            <button 
                onClick={() => setShowMobileFilter(!showMobileFilter)}
                className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 p-3 rounded-lg text-gray-700 font-medium"
            >
                <SlidersHorizontal className="w-5 h-5" />
                {showMobileFilter ? 'Hide Filters' : 'Show Advanced Filters'}
            </button>
        </div>

        {/* Sidebar */}
           <div className={`lg:w-72 flex-shrink-0 ${showMobileFilter ? 'block' : 'hidden lg:block'}`}>
               <Sidebar onApplyFilter={handleApplyFilter} />
           </div>

        {/* Main Content */}
        <div className="flex-grow">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Browse Tuition Jobs</h2>
                <p className="text-gray-500">Found {jobs.length} opportunities</p>
            </div>
      
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            ) : jobs.length > 0 ? (
                <div className="flex flex-col gap-6"> 
                {/* Changed to flex-col for list view as Job Cards often look better in list stack, 
                    but Grid is also fine. TutorsPage uses Grid. JobCard is wide. 
                    Checking JobCard design (Step 141): It has padding and description. 
                    Grid col-1 is probably best for readability of description, or grid-cols-2. 
                    TutorsPage used grid-cols-2 lg:grid-cols-3. 
                    JobCard looks like it might be dense for 3 cols. Let's stick to 1 or 2. 
                    Let's use Grid 1 col for mobile, 2 for large. */}
                    <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-2">
                        {jobs.map(job => (
                            <JobCard key={job.id} job={job} />
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200 border-dashed">
                    <p className="text-gray-500">No jobs match your current criteria.</p>
                     <button 
                        onClick={() => fetchJobs()}
                        className="mt-2 text-indigo-600 hover:underline font-medium"
                    >
                        Reset Filters
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default JobBoardPage;
