'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getTeacherFullProfile } from '../services/backend';
import { TutorCard } from './TutorCard';
import { SeoTutor } from '../lib/seo/fetcher';
import { SeoTutorCard } from './SeoTutorCard';

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

  // Fallback / Guest view: render SEO-friendly cards with available data
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {initialTutors.map((t) => {
        const { id, name } = parseTutorFromSlug(t.slug);
        
        return (
          <SeoTutorCard
            key={t.slug}
            tutor={{
              id: String(id),
              slug: t.slug,
              name: t.name || name,
              bio: t.bio,
              highest_qualification: t.highest_qualification,
              teaching_mode: t.teaching_mode,
              verified: t.verified,
              profile_picture: t.profile_picture,
              reviews_average: t.rating,
              reviews_count: t.review_count,
              expected_salary: t.min_salary,
              subjects: t.subjects,
              location: t.location,
              location_name: t.location_name,
              medium_list: t.mediums,
            }}
          />
        );
      })}
    </div>
  );
}
