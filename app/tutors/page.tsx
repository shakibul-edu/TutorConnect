

'use client';

import React, { useState, useEffect } from 'react';
import { TutorCard } from '../../components/TutorCard';
import { SeoTutorCard } from '../../components/SeoTutorCard';
import Sidebar, { DEFAULT_FILTER_STATE, FilterState } from '../../components/Sidebar';
import { SlidersHorizontal, Plus } from 'lucide-react';
import { getTeachers, getPublicTutors } from '../../services/backend';
import { useSession } from 'next-auth/react';
import PostJobModal from '../../components/PostJobModal';
import { useAuth } from '../../lib/auth';
import { FetchApi } from '../../FetchApi';
import useLocation from '../../LocationHook';
import { MapPin } from 'lucide-react';
import LocationPermissionModal from '../../components/LocationPermissionModal';

const TutorsPage: React.FC = () => {
    const { data: session, status } = useSession();
    const { user } = useAuth();
    
    const [showMobileFilter, setShowMobileFilter] = useState(false);
    const [tutors, setTutors] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isPostJobModalOpen, setIsPostJobModalOpen] = useState(false);
    const [sidebarResetSignal, setSidebarResetSignal] = useState(0);
    const [filters, setFilters] = useState<FilterState>({
        ...DEFAULT_FILTER_STATE,
        tuitionType: "Any",
    });

    const { location, retryLocation } = useLocation(session);
    const [hasLocation, setHasLocation] = useState(true); // default true to avoid flash
    const [showLocationModal, setShowLocationModal] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined' || status !== 'authenticated') return;

        let cancelled = false;

        const checkLocationPermission = async () => {
            // Check browser permission state (not localStorage, which gets filled by server sync)
            let browserPermissionGranted = false;
            try {
                if (navigator.permissions && navigator.permissions.query) {
                    const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
                    browserPermissionGranted = result.state === 'granted';
                }
            } catch {
                // Permissions API not supported, fall back to localStorage check
                const stored = localStorage.getItem('user_location');
                browserPermissionGranted = stored !== null && stored !== 'null' && stored !== 'undefined';
            }

            if (cancelled) return;
            setHasLocation(browserPermissionGranted);

            // Show modal once per session if browser permission not granted
            if (!browserPermissionGranted && !sessionStorage.getItem('tutors_location_prompted')) {
                sessionStorage.setItem('tutors_location_prompted', 'true');
                setShowLocationModal(true);
            }
        };

        const timer = setTimeout(checkLocationPermission, 300);
        return () => { cancelled = true; clearTimeout(timer); };
    }, [status, location]);

    const handleLocationModalConfirm = () => {
        setShowLocationModal(false);
        retryLocation().then(() => setHasLocation(true)).catch(() => {});
    };

    const handleLocationModalCancel = () => {
        setShowLocationModal(false);
        // They dismissed it — treat as "has location" so the banner stays visible but form isn't blocked
        // The inline banner below will still be visible
    };

    const fetchTutors = async (appliedFilters: any = {}) => {
        setLoading(true);

        // For search engine robots and guest users, fetch public SEO tutors when not logged in
        if (status !== 'authenticated') {
            try {
                const response = await getPublicTutors();
                if (response && response.results) {
                    const parsedTutors = response.results.map((t: any) => {
                        const parts = t.slug.split('-');
                        const idStr = parts.pop();
                        const id = Number(idStr) || 0;
                        const name = t.name || parts
                            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ');
                        return {
                            id: String(id),
                            slug: t.slug,
                            name,
                            bio: t.bio || '',
                            gender: t.gender || 'any',
                            highest_qualification: t.highest_qualification || 'Qualified',
                            medium_list: t.mediums || t.medium_list || [],
                            maximum_grade: '',
                            distance: t.preferred_distance || 0,
                            expected_salary: t.min_salary || t.starting_salary || 0,
                            profile_picture: t.profile_picture || '',
                            verified: !!t.verified,
                            teaching_mode: t.teaching_mode || 'any',
                            reviews_average: t.rating || 0,
                            reviews_count: t.review_count || 0,
                            subjects: t.subjects || [],
                            location: t.location || '',
                            location_name: t.location_name || t.location || '',
                        };
                    });
                    setTutors(parsedTutors);
                }
            } catch (error) {
                console.error('Error fetching public tutors:', error);
                setTutors([]);
            } finally {
                setLoading(false);
            }
            return;
        }

        const backendAccess = (session as any)?.backendAccess;
        if (!backendAccess) {
            setLoading(false);
            return;
        }
        try {
            const response = await getTeachers(backendAccess, appliedFilters);
            if (response) {
                setTutors(Array.isArray(response) ? response : response.results || []);
            }
        } catch (error) {
            setTutors([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTutors();
    }, [session, status]);

    const handleApplyFilter = (newFilters: FilterState) => {
        setFilters(newFilters);
        fetchTutors(newFilters);
        setShowMobileFilter(false);
    };

    const handleResetFilters = () => {
      setFilters(DEFAULT_FILTER_STATE);
      setSidebarResetSignal((value) => value + 1);
      fetchTutors(DEFAULT_FILTER_STATE);
    };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <LocationPermissionModal
          isOpen={showLocationModal}
          onConfirm={handleLocationModalConfirm}
          onCancel={handleLocationModalCancel}
      />
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
                 <Sidebar
                   academicFilters
                   resetSignal={sidebarResetSignal}
                   onApplyFilter={handleApplyFilter}
                 />
           </div>

        {/* Main Content */}
        <div className="flex-grow">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Find Qualified Tutors</h2>
                <p className="text-gray-500">Showing {tutors.length} verified educators</p>
            </div>
            
            {!hasLocation && status === 'authenticated' && (
                <div className="mb-6 bg-indigo-50 border border-indigo-100 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-200 rounded-full mix-blend-multiply filter blur-2xl opacity-50 -mr-10 -mt-10"></div>
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm flex-shrink-0 text-indigo-600">
                            <MapPin className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-indigo-900 text-lg">Enable Location</h3>
                            <p className="text-sm text-indigo-700 font-medium">To find your nearby tutor fast, enable the location.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowLocationModal(true)}
                        className="relative z-10 w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl whitespace-nowrap transition-colors shadow-md active:scale-95"
                    >
                        Enable Location
                    </button>
                </div>
            )}
      
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            ) : tutors.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                    {tutors.map(tutor => (
                        status === 'authenticated' ? (
                            <TutorCard key={tutor.id} tutor={tutor} />
                        ) : (
                            <SeoTutorCard key={tutor.id} tutor={tutor} />
                        )
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200 border-dashed">
                    <p className="text-gray-500">No tutors match your current criteria.</p>
                     <button 
                      onClick={handleResetFilters}
                        className="mt-2 text-indigo-600 hover:underline font-medium"
                    >
                        Reset Filters
                    </button>
                </div>
            )}
        </div>
      </div>

      {/* Floating Post Job Button (Mobile Only) */}
      {user && (
        <button
          onClick={() => setIsPostJobModalOpen(true)}
          className="md:hidden fixed bottom-6 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-2xl hover:bg-indigo-700 active:scale-95 transition-all z-50 flex items-center justify-center"
          aria-label="Post a job"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Post Job Modal */}
      {isPostJobModalOpen && user && (
        <PostJobModal
          isOpen={isPostJobModalOpen}
          onClose={() => setIsPostJobModalOpen(false)}
          user={user}
          onSuccess={() => {
            setIsPostJobModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default TutorsPage;
