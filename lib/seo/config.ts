/**
 * lib/seo/config.ts
 * Central SEO configuration. Import from here instead of hard-coding values.
 */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXTAUTH_URL ||
  'https://etuition.app';

export const API_BASE_URL =
  process.env.BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://127.0.0.1:8000';

export const SITE_NAME = 'E-Tuition';

export const DEFAULT_OG_IMAGE = `${SITE_URL}/android-chrome-512x512.png`;

export const TWITTER_HANDLE = '@etuition'; // update when account exists

/** ISR revalidation windows (in seconds) */
export const REVALIDATE = {
  /** Fast-changing listing pages — refresh every hour */
  LISTING: 3600,
  /** Tutor profiles — refresh every 24 h */
  PROFILE: 86_400,
  /** Sitemap — refresh every hour */
  SITEMAP: 3600,
} as const;

/** Maximum URLs allowed in a single sitemap file (Google's hard limit is 50,000) */
export const SITEMAP_CHUNK_SIZE = 50_000;

/** Static routes always included in the sitemap */
export const STATIC_ROUTES = [
  { path: '/', priority: 1.0, changeFrequency: 'daily' as const },
  { path: '/tutors', priority: 0.9, changeFrequency: 'daily' as const },
  { path: '/tuition-jobs', priority: 0.9, changeFrequency: 'daily' as const },
  { path: '/jobs', priority: 0.8, changeFrequency: 'daily' as const },
  { path: '/auth/signin', priority: 0.4, changeFrequency: 'monthly' as const },
] as const;
