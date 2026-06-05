/**
 * lib/seo/fetcher.ts
 *
 * Server-only fetch helpers for the Django SEO endpoints.
 * All functions use `next: { revalidate }` for ISR caching.
 * They return empty arrays on failure so that `generateStaticParams`
 * never breaks a production build when the API is unreachable.
 */

import { API_BASE_URL, REVALIDATE } from './config';

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface SeoTutor {
  id: number;
  slug: string;
  name: string;
  bio: string;
  subjects: string[];
  location: string;
  location_name?: string;
  profile_picture: string;
  rating: number;
  review_count: number;
  highest_qualification: string;
  experience_years: number;
  teaching_mode: string;
  verified: boolean;
  min_salary: number;
  updated_at: string;
}

export interface SeoLocation {
  slug: string;
  name: string;
  tutor_count: number;
  description?: string;
}

export interface SeoSubject {
  slug: string;
  name: string;
  tutor_count: number;
  description?: string;
}

export interface SeoClass {
  slug: string;
  name: string;
  tutor_count: number;
  description?: string;
}

export interface SeoSubjectLocationPage {
  subject_slug: string;
  location_slug: string;
  subject_name: string;
  location_name: string;
  tutor_count: number;
}

export interface SeoClassLocationPage {
  class_slug: string;
  location_slug: string;
  class_name: string;
  location_name: string;
  tutor_count: number;
}

// ---------------------------------------------------------------------------
// Generic paginated fetcher
// ---------------------------------------------------------------------------

interface PaginatedResponse<T> {
  count?: number;
  next?: string | null;
  results?: T[];
}

/**
 * Fetches ALL pages from a paginated Django endpoint.
 * Handles both paginated (`{ results, next }`) and plain-array responses.
 */
async function fetchAllPages<T>(
  endpoint: string,
  revalidate: number = REVALIDATE.LISTING,
): Promise<T[]> {
  const all: T[] = [];
  let url: string | null = `${API_BASE_URL}${endpoint}`;

  while (url) {
    try {
      console.log(`[SEO] Request: GET ${url}`);
      const res = await fetch(url, {
        next: { revalidate },
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        console.warn(`[SEO] Response Error for ${url}: HTTP ${res.status}`);
        break;
      }

      const data: PaginatedResponse<T> | T[] = await res.json();
      console.log(
        `[SEO] Response Success for ${url}: HTTP ${res.status} - Items count: ${
          Array.isArray(data) ? data.length : (data.results ? data.results.length : 0)
        }`
      );

      if (Array.isArray(data)) {
        all.push(...data);
        break; // non-paginated response
      }

      if (data.results) {
        all.push(...data.results);
      }

      url = data.next ?? null;
    } catch (err) {
      console.warn(`[SEO] Fetch error for ${url}:`, err);
      break;
    }
  }

  return all;
}

// ---------------------------------------------------------------------------
// Public fetch functions — one per SEO endpoint
// ---------------------------------------------------------------------------

/** Fetch all tutor SEO entries. Used for sitemap + /tutor/[slug] pages. */
export async function fetchSeoTutors(): Promise<SeoTutor[]> {
  return fetchAllPages<SeoTutor>('/api/seo/tutors/', REVALIDATE.PROFILE);
}

/** Fetch a single tutor by slug. */
export async function fetchSeoTutorBySlug(
  slug: string,
): Promise<SeoTutor | null> {
  const url = `${API_BASE_URL}/api/seo/tutors/${slug}/`;
  console.log(`[SEO] Request: GET ${url}`);
  try {
    const res = await fetch(url, {
      next: { revalidate: REVALIDATE.PROFILE },
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      console.warn(`[SEO] Response Error for ${url}: HTTP ${res.status}`);
      return null;
    }
    const data = await res.json();
    console.log(`[SEO] Response Success for ${url}: HTTP ${res.status}`);
    return data;
  } catch (err) {
    console.warn(`[SEO] Fetch error for ${url}:`, err);
    return null;
  }
}

/** Fetch all location SEO entries. */
export async function fetchSeoLocations(): Promise<SeoLocation[]> {
  return fetchAllPages<SeoLocation>('/api/seo/locations/');
}

/** Fetch a single location by slug. */
export async function fetchSeoLocationBySlug(
  slug: string,
): Promise<SeoLocation | null> {
  const url = `${API_BASE_URL}/api/seo/locations/${slug}/`;
  console.log(`[SEO] Request: GET ${url}`);
  try {
    const res = await fetch(url, {
      next: { revalidate: REVALIDATE.LISTING },
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      console.warn(`[SEO] Response Error for ${url}: HTTP ${res.status}`);
      return null;
    }
    const data = await res.json();
    console.log(`[SEO] Response Success for ${url}: HTTP ${res.status}`);
    return data;
  } catch (err) {
    console.warn(`[SEO] Fetch error for ${url}:`, err);
    return null;
  }
}

/** Fetch a single subject by slug. */
export async function fetchSeoSubjectBySlug(
  slug: string,
): Promise<SeoSubject | null> {
  const url = `${API_BASE_URL}/api/seo/subjects/${slug}/`;
  console.log(`[SEO] Request: GET ${url}`);
  try {
    const res = await fetch(url, {
      next: { revalidate: REVALIDATE.LISTING },
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      console.warn(`[SEO] Response Error for ${url}: HTTP ${res.status}`);
      return null;
    }
    const data = await res.json();
    console.log(`[SEO] Response Success for ${url}: HTTP ${res.status}`);
    return data;
  } catch (err) {
    console.warn(`[SEO] Fetch error for ${url}:`, err);
    return null;
  }
}

/** Fetch a single class by slug. */
export async function fetchSeoClassBySlug(
  slug: string,
): Promise<SeoClass | null> {
  const url = `${API_BASE_URL}/api/seo/classes/${slug}/`;
  console.log(`[SEO] Request: GET ${url}`);
  try {
    const res = await fetch(url, {
      next: { revalidate: REVALIDATE.LISTING },
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      console.warn(`[SEO] Response Error for ${url}: HTTP ${res.status}`);
      return null;
    }
    const data = await res.json();
    console.log(`[SEO] Response Success for ${url}: HTTP ${res.status}`);
    return data;
  } catch (err) {
    console.warn(`[SEO] Fetch error for ${url}:`, err);
    return null;
  }
}

/** Fetch all subject SEO entries. */
export async function fetchSeoSubjects(): Promise<SeoSubject[]> {
  return fetchAllPages<SeoSubject>('/api/seo/subjects/');
}

/** Fetch all class SEO entries. */
export async function fetchSeoClasses(): Promise<SeoClass[]> {
  return fetchAllPages<SeoClass>('/api/seo/classes/');
}

/** Fetch all subject+location combo pages. */
export async function fetchSeoSubjectLocationPages(): Promise<
  SeoSubjectLocationPage[]
> {
  return fetchAllPages<SeoSubjectLocationPage>('/api/seo/subject-location-pages/');
}

/** Fetch all class+location combo pages. */
export async function fetchSeoClassLocationPages(): Promise<
  SeoClassLocationPage[]
> {
  return fetchAllPages<SeoClassLocationPage>('/api/seo/class-location-pages/');
}

/**
 * Fetches tutors for a specific location for use on location landing pages.
 * Falls back to empty array on error.
 */
export async function fetchTutorsByLocation(
  locationSlug: string,
): Promise<SeoTutor[]> {
  return fetchAllPages<SeoTutor>(
    `/api/seo/tutors/?location=${encodeURIComponent(locationSlug)}`,
  );
}

/**
 * Fetches tutors for a specific subject.
 */
export async function fetchTutorsBySubject(
  subjectSlug: string,
): Promise<SeoTutor[]> {
  return fetchAllPages<SeoTutor>(
    `/api/seo/tutors/?subject=${encodeURIComponent(subjectSlug)}`,
  );
}

/**
 * Fetches tutors for a specific class.
 */
export async function fetchTutorsByClass(
  classSlug: string,
): Promise<SeoTutor[]> {
  return fetchAllPages<SeoTutor>(
    `/api/seo/tutors/?class=${encodeURIComponent(classSlug)}`,
  );
}

/**
 * Fetches tutors for a specific subject+location combo page.
 */
export async function fetchTutorsBySubjectAndLocation(
  subjectSlug: string,
  locationSlug: string,
): Promise<SeoTutor[]> {
  return fetchAllPages<SeoTutor>(
    `/api/seo/tutors/?subject=${encodeURIComponent(subjectSlug)}&location=${encodeURIComponent(locationSlug)}`,
  );
}

/**
 * Fetches tutors for a specific class+location combo page.
 */
export async function fetchTutorsByClassAndLocation(
  classSlug: string,
  locationSlug: string,
): Promise<SeoTutor[]> {
  return fetchAllPages<SeoTutor>(
    `/api/seo/tutors/?class=${encodeURIComponent(classSlug)}&location=${encodeURIComponent(locationSlug)}`,
  );
}
