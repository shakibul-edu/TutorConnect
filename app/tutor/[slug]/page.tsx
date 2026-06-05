/**
 * app/tutor/[slug]/page.tsx
 *
 * Statically generated SEO-optimised tutor profile page.
 * - generateStaticParams: pre-builds one page per tutor at build time
 * - generateMetadata: unique title / OG / Twitter / canonical per tutor
 * - JSON-LD: Person + AggregateRating + Offer + BreadcrumbList
 * - ISR: revalidate every 24 hours
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SITE_NAME, SITE_URL } from '../../../lib/seo/config';
import {
  fetchSeoTutors,
  fetchSeoTutorBySlug,
} from '../../../lib/seo/fetcher';
import { generateTutorMetadata } from '../../../lib/seo/metadata';
import { buildTutorPageSchemas } from '../../../lib/seo/jsonld';
import TutorDetailsClient from './TutorDetailsClient';

export const revalidate = 86400;

// Helper to parse tutor name and ID from slug if backend doesn't return full details
function parseTutorFromSlug(slug: string) {
  const parts = slug.split('-');
  const idStr = parts.pop();
  const id = Number(idStr) || 0;
  
  if (!id) return null;
  
  const name = parts
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
    
  return {
    id,
    slug,
    name,
    bio: '',
    subjects: [],
    location: '',
    rating: 0,
    review_count: 0,
    highest_qualification: '',
    experience_years: 0,
    teaching_mode: '',
    verified: false,
    min_salary: 0,
    profile_picture: '',
    updated_at: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Static params — pre-build every tutor profile at deploy time
// ---------------------------------------------------------------------------

export async function generateStaticParams() {
  const tutors = await fetchSeoTutors();
  return tutors.map((t) => ({ slug: t.slug }));
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  let tutor = await fetchSeoTutorBySlug(slug);
  if (!tutor) {
    tutor = parseTutorFromSlug(slug);
  }
  if (!tutor) return { title: 'Tutor Not Found' };
  return generateTutorMetadata(tutor);
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function TutorSeoPage({ params }: Props) {
  const { slug } = await params;
  let tutor = await fetchSeoTutorBySlug(slug);
  
  // Fallback to parsing from slug if single tutor SEO endpoint doesn't exist
  if (!tutor) {
    tutor = parseTutorFromSlug(slug);
  }

  if (!tutor) notFound();

  const tutorName = tutor.name || 'Tutor';
  const jsonLd = buildTutorPageSchemas({ ...tutor, name: tutorName });

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <TutorDetailsClient 
        slug={slug} 
        initialTutor={tutor} 
        siteUrl={SITE_URL} 
        siteName={SITE_NAME} 
      />
    </>
  );
}
