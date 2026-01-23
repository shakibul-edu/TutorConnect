

'use client';

import React, { useState, useEffect } from 'react';
import { TutorCard } from '../../components/TutorCard';
import Sidebar, { FilterState } from '../../components/Sidebar';
import { SlidersHorizontal } from 'lucide-react';
import { getTeachers } from '../../services/backend';
import { useSession } from 'next-auth/react';

const TutorsPage: React.FC = () => {
    const { data: session } = useSession();
  const [showMobileFilter, setShowMobileFilter] = useState(false);
    const [tutors, setTutors] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    postId: "", // Acts as Tutor ID search
    schedule: undefined,
    feeRange: 25000,
    gender: "Any",
    tuitionType: "All Tuition",
    distance: 20
  });

    const fetchTutors = async (appliedFilters: any = {}) => {
        setLoading(true);
        const idToken = (session as any)?.id_token;
        if (!idToken) {
            setLoading(false);
            return;
        }
        try {
            const response = await getTeachers(idToken, appliedFilters);
            if (response) {
                setTutors(Array.isArray(response) ? response : response.results || []);
            }
        } catch (error) {
            console.error("Error fetching tutors:", error);
            setTutors([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTutors();
    }, [session]);

    const handleApplyFilter = (newFilters: FilterState) => {
        setFilters(newFilters);
        fetchTutors(newFilters);
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
                <h2 className="text-2xl font-bold text-gray-900">Find Qualified Tutors</h2>
                <p className="text-gray-500">Showing {tutors.length} verified educators</p>
            </div>
      
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            ) : tutors.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                    {tutors.map(tutor => (
                        <TutorCard key={tutor.id} tutor={tutor} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200 border-dashed">
                    <p className="text-gray-500">No tutors match your current criteria.</p>
                     <button 
                        onClick={() => fetchTutors()}
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

export default TutorsPage;
