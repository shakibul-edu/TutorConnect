'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Star, CheckCircle, Wifi, GraduationCap, BookOpen, LogIn } from 'lucide-react';
import { getBackendImageUrl } from '../utils/imageHelper';

interface SeoTutorCardProps {
  tutor: {
    id: string;
    slug?: string;
    name: string;
    bio?: string;
    gender?: string;
    highest_qualification?: string;
    medium_list?: string[] | { name: string }[];
    teaching_mode?: string;
    expected_salary?: number;
    profile_picture?: string;
    verified?: boolean;
    reviews_average?: number;
    reviews_count?: number;
    subjects?: string[] | { name: string }[];
    location?: string;
    location_name?: string;
  };
}

export const SeoTutorCard: React.FC<SeoTutorCardProps> = ({ tutor }) => {
  const slugify = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');
  };

  const slug = tutor.slug || `${slugify(tutor.name)}-${tutor.id}`;

  const getModeLabel = (mode: string) => {
    if (mode === 'any') return 'Online & Offline';
    return mode.charAt(0).toUpperCase() + mode.slice(1);
  };

  const formatSubjects = (subjects: string[] | { name: string }[] | undefined): string[] => {
    if (!Array.isArray(subjects) || subjects.length === 0) return [];
    return subjects.map((s: any) => typeof s === 'string' ? s : s.name).filter(Boolean);
  };

  const formatMediums = (mediums: string[] | { name: string }[] | undefined): string => {
    if (!Array.isArray(mediums) || mediums.length === 0) return '';
    return mediums.map((m: any) => typeof m === 'string' ? m : m.name).filter(Boolean).join(', ');
  };

  const subjectsList = formatSubjects(tutor.subjects);
  const mediumsStr = formatMediums(tutor.medium_list);
  const hasProfilePic = !!tutor.profile_picture;

  return (
    <Link
      href={`/tutor/${slug}`}
      className="group card cursor-pointer overflow-hidden flex flex-col h-full"
    >
      <article className="p-6 flex-grow" itemScope itemType="https://schema.org/Person">
        {/* Header Section */}
        <div className="flex items-start gap-4 mb-4 border-b border-gray-100 pb-4">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-indigo-50 flex-shrink-0 bg-indigo-100 flex items-center justify-center">
            {hasProfilePic ? (
              <Image
                src={getBackendImageUrl(tutor.profile_picture)}
                alt={tutor.name}
                width={64}
                height={64}
                className="w-full h-full object-cover"
                loading="lazy"
                itemProp="image"
              />
            ) : (
              <span className="text-xl font-bold text-indigo-600">
                {tutor.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors" itemProp="name">
                {tutor.name}
              </h3>
              {tutor.verified && (
                <span title="Verified Tutor" className="flex-shrink-0 ml-1">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </span>
              )}
            </div>
            {tutor.highest_qualification && (
              <p className="text-sm text-gray-500 capitalize" itemProp="jobTitle">{tutor.highest_qualification}</p>
            )}
            <div className="flex items-center gap-1 mt-1">
              <Star className={`w-4 h-4 ${(tutor.reviews_count || 0) > 0 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
              <span className="text-sm font-bold text-gray-900">
                {(tutor.reviews_count || 0) > 0 ? tutor.reviews_average : 'New'}
              </span>
              <span className="text-sm text-gray-400">({tutor.reviews_count || 0} reviews)</span>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 gap-2 text-sm text-gray-600 mb-4">
          {tutor.teaching_mode && (
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 text-indigo-500 flex-shrink-0" />
              <span className="font-medium">{getModeLabel(tutor.teaching_mode)}</span>
            </div>
          )}

          {(tutor.location_name || tutor.location) && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-500 flex-shrink-0" />
              <span className="truncate" itemProp="address">{tutor.location_name || tutor.location}</span>
            </div>
          )}

          {mediumsStr && (
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-indigo-500 flex-shrink-0" />
              <span className="line-clamp-1">{mediumsStr}</span>
            </div>
          )}
        </div>

        {/* Subject Tags */}
        {subjectsList.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {subjectsList.slice(0, 3).map((sub, i) => (
              <span key={i} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-md font-medium">
                {sub}
              </span>
            ))}
            {subjectsList.length > 3 && (
              <span className="px-2 py-0.5 bg-gray-50 text-gray-500 text-xs rounded-md font-medium">
                +{subjectsList.length - 3}
              </span>
            )}
          </div>
        )}
      </article>

      {/* Footer */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
        {(tutor.expected_salary || 0) > 0 && (
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Starting from</span>
            <span className="text-lg font-bold text-gray-900">
              {tutor.expected_salary} BDT<span className="text-sm font-normal text-gray-500">/mo</span>
            </span>
          </div>
        )}
        <div className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md font-bold text-center group-hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
          <LogIn className="w-4 h-4" />
          Sign in to view profile
        </div>
      </div>
    </Link>
  );
};
