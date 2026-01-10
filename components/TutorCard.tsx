
'use client';

import React from 'react';
import { TeacherProfile } from '../types';
import { MapPin, Star, CheckCircle, School, Flag, Wifi } from 'lucide-react';
import { stateManager } from '../services/stateManager';
import { useRouter } from '../lib/router';

interface TutorCardProps {
  tutor: TeacherProfile;
}

export const TutorCard: React.FC<TutorCardProps> = ({ tutor }) => {
  const ratingData = stateManager.getTutorRating(tutor.id);
  const { push } = useRouter();

  const handleViewProfile = () => {
    push(`tutor-details/${tutor.id}`);
  };

  // Helper to format lists nicely
  const formatList = (items: { name: string }[]) => items.map(i => i.name).join(', ');

  const getModeLabel = (mode: string) => {
    if (mode === 'any') return 'Online & Offline';
    return mode.charAt(0).toUpperCase() + mode.slice(1);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100 overflow-hidden flex flex-col h-full cursor-pointer" onClick={handleViewProfile}>
      <div className="p-6 flex-grow">
        {/* Header Section */}
        <div className="flex items-start gap-4 mb-4 border-b border-gray-50 pb-4">
          <img 
            src={tutor.profile_picture || `https://ui-avatars.com/api/?name=${tutor.user.first_name}`} 
            alt={tutor.user.username} 
            className="w-16 h-16 rounded-full object-cover border-2 border-indigo-50"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-indigo-600">
                  {tutor.user.first_name} {tutor.user.last_name}
                </h3>
                {tutor.verified && (
                    <span title="Verified Tutor" className="flex-shrink-0 ml-1">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </span>
                )}
            </div>
            <p className="text-sm text-gray-500 capitalize">{tutor.highest_qualification}</p>
             <div className="flex items-center gap-1 mt-1">
                <Star className={`w-4 h-4 ${ratingData.count > 0 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                <span className="text-sm font-bold text-gray-900">
                  {ratingData.count > 0 ? ratingData.avg : 'New'}
                </span>
                <span className="text-sm text-gray-400">({ratingData.count} reviews)</span>
            </div>
          </div>
        </div>

        {/* Info Grid - Replaces Bio */}
        <div className="grid grid-cols-1 gap-2 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-2">
             <Wifi className="w-4 h-4 text-indigo-500 flex-shrink-0" />
             <span className="font-medium">{getModeLabel(tutor.teaching_mode)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-indigo-500 flex-shrink-0" />
            <span className="truncate">{tutor.preferred_distance}km coverage area</span>
          </div>

          <div className="flex items-start gap-2">
            <Flag className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-1" title={formatList(tutor.mediums)}>
              {formatList(tutor.mediums)}
            </span>
          </div>

          <div className="flex items-start gap-2">
            <School className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-1" title={formatList(tutor.grades)}>
              {formatList(tutor.grades)}
            </span>
          </div>
        </div>

        {/* Subjects Tags */}
        <div className="space-y-2 mt-auto">
             <div className="flex flex-wrap gap-2">
                {tutor.subjects.slice(0, 3).map(sub => (
                    <span key={sub.id} className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-md font-medium">
                    {sub.name}
                    </span>
                ))}
                {tutor.subjects.length > 3 && (
                    <span className="px-2 py-1 bg-gray-50 text-gray-500 text-xs rounded-md font-medium">+{tutor.subjects.length - 3}</span>
                )}
            </div>
        </div>
      </div>
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
         <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Starting from</span>
            <span className="text-lg font-bold text-gray-900">{tutor.min_salary} BDT<span className="text-sm font-normal text-gray-500">/mo</span></span>
         </div>
        <button 
            onClick={(e) => {
                e.stopPropagation();
                handleViewProfile();
            }}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md font-bold hover:bg-indigo-700 transition-all active:scale-95 shadow-sm"
        >
          View Profile
        </button>
      </div>
    </div>
  );
};
