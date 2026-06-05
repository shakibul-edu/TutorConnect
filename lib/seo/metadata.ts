/**
 * lib/seo/metadata.ts
 *
 * Metadata generator helpers for each page type.
 * All functions return a Next.js `Metadata` object ready for export.
 */

import type { Metadata } from 'next';
import {
  SITE_URL,
  SITE_NAME,
  DEFAULT_OG_IMAGE,
  TWITTER_HANDLE,
} from './config';
import type {
  SeoTutor,
  SeoLocation,
  SeoSubject,
  SeoClass,
  SeoSubjectLocationPage,
  SeoClassLocationPage,
} from './fetcher';

// ---------------------------------------------------------------------------
// Canonical URL builder
// ---------------------------------------------------------------------------

/** Build an absolute canonical URL from a relative path. */
export function buildCanonicalUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

// ---------------------------------------------------------------------------
// Shared OG image helper
// ---------------------------------------------------------------------------

function ogImage(url: string, alt: string) {
  return [{ url, width: 1200, height: 630, alt }];
}

// ---------------------------------------------------------------------------
// Tutor Profile Metadata  (/tutor/[slug])
// ---------------------------------------------------------------------------

export function generateTutorMetadata(tutor: SeoTutor): Metadata {
  const tutorName = tutor.name || 'Tutor';
  const canonicalPath = `/tutor/${tutor.slug}`;
  const canonical = buildCanonicalUrl(canonicalPath);
  const subjects = tutor.subjects?.join(', ') || 'various subjects';
  const location = tutor.location_name || tutor.location || 'Bangladesh';
  const qualification = tutor.highest_qualification
    ? tutor.highest_qualification.charAt(0).toUpperCase() +
      tutor.highest_qualification.slice(1)
    : '';

  const title = `${tutorName} — ${qualification} Tutor in ${location} | ${SITE_NAME}`;
  const description =
    tutor.bio
      ? `${tutor.bio.slice(0, 140).trimEnd()}… Book a session with ${tutorName} on ${SITE_NAME}.`
      : `${tutorName} is a verified tutor in ${location} teaching ${subjects}. ${tutor.experience_years}+ years of experience. Book on ${SITE_NAME}.`;

  const imageUrl = tutor.profile_picture
    ? tutor.profile_picture.startsWith('http')
      ? tutor.profile_picture
      : `${process.env.NEXT_PUBLIC_IMG_URL || SITE_URL}${tutor.profile_picture}`
    : DEFAULT_OG_IMAGE;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'profile',
      url: canonical,
      siteName: SITE_NAME,
      title,
      description,
      images: ogImage(imageUrl, `${tutor.name} — Tutor profile photo`),
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      site: TWITTER_HANDLE,
      title,
      description,
      images: [imageUrl],
    },
  };
}

// ---------------------------------------------------------------------------
// Location Page Metadata  (/tutors/[location])
// ---------------------------------------------------------------------------

export function generateLocationMetadata(location: SeoLocation): Metadata {
  const canonicalPath = `/tutors/${location.slug}`;
  const canonical = buildCanonicalUrl(canonicalPath);

  const title = `Tutors in ${location.name} — Find Local Home Tutors | ${SITE_NAME}`;
  const description =
    location.description ||
    `Find ${location.tutor_count}+ verified tutors in ${location.name}, Bangladesh. Compare qualifications, read reviews, and book home or online tuition on ${SITE_NAME}.`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      url: canonical,
      siteName: SITE_NAME,
      title,
      description,
      images: ogImage(DEFAULT_OG_IMAGE, `Tutors in ${location.name}`),
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      site: TWITTER_HANDLE,
      title,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

// ---------------------------------------------------------------------------
// Subject Page Metadata  (/tutors/[subject])
// ---------------------------------------------------------------------------

export function generateSubjectMetadata(subject: SeoSubject): Metadata {
  const canonicalPath = `/tutors/${subject.slug}`;
  const canonical = buildCanonicalUrl(canonicalPath);

  const title = `${subject.name} Tutors — Find Expert Subject Teachers | ${SITE_NAME}`;
  const description =
    subject.description ||
    `Find ${subject.tutor_count}+ verified ${subject.name} tutors. Compare qualifications, read reviews, and book home or online tuition on ${SITE_NAME}.`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      url: canonical,
      siteName: SITE_NAME,
      title,
      description,
      images: ogImage(DEFAULT_OG_IMAGE, `${subject.name} Tutors`),
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      site: TWITTER_HANDLE,
      title,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

// ---------------------------------------------------------------------------
// Class Page Metadata  (/tutors/[class])
// ---------------------------------------------------------------------------

export function generateClassMetadata(cls: SeoClass): Metadata {
  const canonicalPath = `/tutors/${cls.slug}`;
  const canonical = buildCanonicalUrl(canonicalPath);

  const title = `${cls.name} Tutors — Find Qualified Class Teachers | ${SITE_NAME}`;
  const description =
    cls.description ||
    `Find ${cls.tutor_count}+ verified tutors for ${cls.name}. Compare qualifications, read reviews, and book home or online tuition on ${SITE_NAME}.`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      url: canonical,
      siteName: SITE_NAME,
      title,
      description,
      images: ogImage(DEFAULT_OG_IMAGE, `${cls.name} Tutors`),
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      site: TWITTER_HANDLE,
      title,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

// ---------------------------------------------------------------------------
// Subject + Location Page Metadata  (/tutors/[subject]/[location])
// ---------------------------------------------------------------------------

export function generateSubjectLocationMetadata(
  page: SeoSubjectLocationPage,
): Metadata {
  const canonicalPath = `/tutors/${page.subject_slug}/${page.location_slug}`;
  const canonical = buildCanonicalUrl(canonicalPath);

  const title = `${page.subject_name} Tutors in ${page.location_name} | ${SITE_NAME}`;
  const description = `Find ${page.tutor_count}+ expert ${page.subject_name} tutors in ${page.location_name}. Verified teachers offering home and online tuition. Book on ${SITE_NAME}.`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      url: canonical,
      siteName: SITE_NAME,
      title,
      description,
      images: ogImage(
        DEFAULT_OG_IMAGE,
        `${page.subject_name} Tutors in ${page.location_name}`,
      ),
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      site: TWITTER_HANDLE,
      title,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

// ---------------------------------------------------------------------------
// Class + Location Page Metadata  (/tutors/[class]/[location])
// ---------------------------------------------------------------------------

export function generateClassLocationMetadata(
  page: SeoClassLocationPage,
): Metadata {
  const canonicalPath = `/tutors/${page.class_slug}/${page.location_slug}`;
  const canonical = buildCanonicalUrl(canonicalPath);

  const title = `${page.class_name} Tutors in ${page.location_name} | ${SITE_NAME}`;
  const description = `Find ${page.tutor_count}+ qualified ${page.class_name} tutors in ${page.location_name}. Home & online tuition available. Book on ${SITE_NAME}.`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      url: canonical,
      siteName: SITE_NAME,
      title,
      description,
      images: ogImage(
        DEFAULT_OG_IMAGE,
        `${page.class_name} Tutors in ${page.location_name}`,
      ),
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      site: TWITTER_HANDLE,
      title,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
  };
}
