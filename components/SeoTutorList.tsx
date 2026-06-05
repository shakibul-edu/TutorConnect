'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getTeacherFullProfile } from '../services/backend';
import { TutorCard } from './TutorCard';
import { SeoTutor } from '../lib/seo/fetcher';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

interface SeoTutorListProps {
  initialTutors: SeoTutor[];
}

export default function SeoTutorList({ initialTutors }: SeoTutorListProps) {
  const { data: session, status } = useSession();
  const [detailedTutors, setDetailedTutors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper to parse tutor name and ID from slug
  const parseTutorFromSlug = (slug: string) => {
    const parts = slug.split('-');
    const idStr = parts.pop();
    const id = Number(idStr) || 0;
    const name = parts
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    return { id, name };
  };

  // Helper to slugify a name
  const slugify = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');
  };

  useEffect(() => {
    const fetchProfiles = async () => {
      if (status !== 'authenticated' || initialTutors.length === 0) {
        setLoading(false);
        return;
      }

      const token = (session as any)?.backendAccess;
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const profiles = await Promise.all(
          initialTutors.map(async (t) => {
            const idStr = t.slug.split('-').pop();
            if (!idStr) return null;
            try {
              const fullProfile = await getTeacherFullProfile(token, idStr);
              if (fullProfile && fullProfile.teacher_profile) {
                const tp = fullProfile.teacher_profile;
                const reviewsList = fullProfile.reviews || [];
                return {
                  id: String(tp.id),
                  name: tp.name || 'Tutor',
                  gender: tp.gender || 'any',
                  highest_qualification: tp.highest_qualification || 'Qualified',
                  medium_list: tp.medium_list?.map((m: any) => m.name) || [],
                  maximum_grade: tp.grade_list?.[0]?.name || '',
                  distance: tp.preferred_distance || 0,
                  expected_salary: tp.min_salary || 0,
                  profile_picture: tp.profile_picture,
                  verified: tp.verified || false,
                  teaching_mode: tp.teaching_mode || 'any',
                  reviews_average: reviewsList.length
                    ? reviewsList.reduce((sum: number, r: any) => sum + r.rating, 0) / reviewsList.length
                    : 0,
                  reviews_count: reviewsList.length,
                };
              }
            } catch (err) {
              console.error(`Error loading profile for ${t.slug}:`, err);
            }
            return null;
          })
        );

        setDetailedTutors(profiles.filter(Boolean));
      } catch (err) {
        console.error('Error loading detailed profiles:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, [session, status, initialTutors]);

  // If authenticated and loading details, show spinner
  if (status === 'authenticated' && loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // If authenticated and loaded, render standard TutorCards
  if (status === 'authenticated' && detailedTutors.length > 0) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {detailedTutors.map((tutor) => (
          <TutorCard key={tutor.id} tutor={tutor} />
        ))}
      </div>
    );
  }

  // Fallback / Guest view: render beautiful placeholder cards
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {initialTutors.map((t) => {
        const { id, name } = parseTutorFromSlug(t.slug);
        const slug = `${slugify(name)}-${id}`;
        
        return (
          <Link
            key={t.slug}
            href={`/tutor/${slug}`}
            className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200 overflow-hidden cursor-pointer flex flex-col h-full"
          >
            <div className="p-5 flex-grow">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-indigo-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                  <span className="text-xl font-bold text-indigo-600">
                    {name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                    {name}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">ID: #{id}</p>
                  <p className="text-xs text-indigo-600 mt-2 bg-indigo-50 inline-block px-2 py-0.5 rounded-full font-medium">
                    Guest View
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 text-center">
              <span className="text-xs text-indigo-600 font-semibold hover:underline">
                Sign in to view full profile
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
