import type { MetadataRoute } from 'next';
import {
  SITE_URL,
  STATIC_ROUTES,
} from './config';
import {
  fetchSeoTutors,
  fetchSeoLocations,
  fetchSeoSubjects,
  fetchSeoClasses,
  fetchSeoSubjectLocationPages,
  fetchSeoClassLocationPages,
} from './fetcher';

export type SitemapEntry = MetadataRoute.Sitemap[number];

export async function buildAllEntries(): Promise<SitemapEntry[]> {
  const now = new Date();

  // Static pages — emit canonical + bilingual alternates
  const staticEntries: SitemapEntry[] = STATIC_ROUTES.flatMap((r) => {
    const canonical = `${SITE_URL}${r.path}`;
    const enUrl = `${SITE_URL}${r.path}${r.path.includes('?') ? '&' : '?'}lang=en`;
    const base: SitemapEntry = {
      url: canonical,
      lastModified: now,
      changeFrequency: r.changeFrequency,
      priority: r.priority,
      alternates: {
        languages: {
          'bn': canonical,       // bn is default, served at canonical URL
          'en': enUrl,
          'x-default': canonical,
        },
      },
    };
    // Also emit the ?lang=en URL as its own entry so crawlers discover it
    const enEntry: SitemapEntry = {
      url: enUrl,
      lastModified: now,
      changeFrequency: r.changeFrequency,
      priority: r.priority * 0.9, // slightly lower priority than canonical
      alternates: {
        languages: {
          'bn': canonical,
          'en': enUrl,
          'x-default': canonical,
        },
      },
    };
    return [base, enEntry];
  });

  // Fetch all dynamic data in parallel
  const [tutors, locations, subjects, classes, subjectLocations, classLocations] =
    await Promise.all([
      fetchSeoTutors(),
      fetchSeoLocations(),
      fetchSeoSubjects(),
      fetchSeoClasses(),
      fetchSeoSubjectLocationPages(),
      fetchSeoClassLocationPages(),
    ]);

  // Tutor profiles (/tutor/[slug])
  const tutorEntries: SitemapEntry[] = tutors
    .filter((tutor) => tutor.slug)
    .map((tutor) => ({
      url: `${SITE_URL}/tutor/${tutor.slug}`,
      lastModified: tutor.updated_at ? new Date(tutor.updated_at) : now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

  // Location pages (/tutors/[location])
  const locationEntries: SitemapEntry[] = locations
    .filter((loc) => loc.slug)
    .map((loc) => ({
      url: `${SITE_URL}/tutors/${loc.slug}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.85,
    }));

const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

  // Subject pages — for any subject that has a standalone page
  const subjectEntries: SitemapEntry[] = subjects
    .filter((sub) => sub.slug || sub.name)
    .map((sub) => ({
      url: `${SITE_URL}/tutors/${sub.slug || slugify(sub.name)}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.75,
    }));

  // Class pages — for any class that has a standalone page
  const classEntries: SitemapEntry[] = classes
    .filter((cls) => cls.slug || cls.name)
    .map((cls) => ({
      url: `${SITE_URL}/tutors/${cls.slug || slugify(cls.name)}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.75,
    }));

  // Subject + location combo pages
  const subjectLocationEntries: SitemapEntry[] = subjectLocations
    .filter((page) => page.subject_slug && page.location_slug)
    .map((page) => ({
      url: `${SITE_URL}/tutors/${page.subject_slug}/${page.location_slug}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.9,
    }));

  // Class + location combo pages
  const classLocationEntries: SitemapEntry[] = classLocations
    .filter((page) => page.class_slug && page.location_slug)
    .map((page) => ({
      url: `${SITE_URL}/tutors/${page.class_slug}/${page.location_slug}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.9,
    }));

  return [
    ...staticEntries,
    ...locationEntries,
    ...subjectEntries,
    ...classEntries,
    ...subjectLocationEntries,
    ...classLocationEntries,
    ...tutorEntries,
  ];
}
