
'use client';

import React, { useState } from 'react';
import { TutorCard } from '../../components/TutorCard';
import { MOCK_TEACHERS } from '../../services/mockData';
import Sidebar, { FilterState } from '../../components/Sidebar';
import { SlidersHorizontal } from 'lucide-react';

const TutorsPage: React.FC = () => {
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    postId: "", // Acts as Tutor ID search
    schedule: undefined,
    feeRange: 25000,
    gender: "Any",
    tuitionType: "All Tuition",
    distance: 20
  });

  const filteredTutors = MOCK_TEACHERS.filter(tutor => {
    // 1. Search ID (Tutor ID or User ID)
    if (filters.postId && tutor.id.toString() !== filters.postId && tutor.user.id.toString() !== filters.postId) {
        return false;
    }

    // 2. Fee Range (Tutor's starting salary should be less than user's max)
    if (tutor.min_salary > filters.feeRange) {
        return false;
    }

    // 3. Distance
    if (tutor.preferred_distance > filters.distance) {
        return false;
    }

    // 4. Gender
    if (filters.gender !== "Any") {
        if (tutor.gender !== 'any' && tutor.gender.toLowerCase() !== filters.gender.toLowerCase()) {
            return false;
        }
    }

    // 5. Tuition Type
    if (filters.tuitionType !== "All Tuition") {
        const requiredMode = filters.tuitionType === "Online" ? "online" : "offline";
        if (tutor.teaching_mode !== 'any' && tutor.teaching_mode !== requiredMode) {
            return false;
        }
    }

    return true;
  });

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
             <Sidebar onApplyFilter={(newFilters) => {
                setFilters(newFilters);
                setShowMobileFilter(false);
            }} />
        </div>

        {/* Main Content */}
        <div className="flex-grow">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Find Qualified Tutors</h2>
                <p className="text-gray-500">Showing {filteredTutors.length} verified educators</p>
            </div>
      
            {filteredTutors.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                    {filteredTutors.map(tutor => (
                        <TutorCard key={tutor.id} tutor={tutor} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200 border-dashed">
                    <p className="text-gray-500">No tutors match your current criteria.</p>
                     <button 
                        onClick={() => window.location.reload()}
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
