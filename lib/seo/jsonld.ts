/**
 * lib/seo/jsonld.ts
 *
 * Schema.org JSON-LD builders for each page type.
 * Each function returns a plain object ready to be serialised
 * with `JSON.stringify` inside a `<script type="application/ld+json">` tag.
 */

import { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from './config';
import type {
  SeoTutor,
  SeoLocation,
  SeoSubject,
  SeoClass,
  SeoSubjectLocationPage,
  SeoClassLocationPage,
} from './fetcher';

// ---------------------------------------------------------------------------
// BreadcrumbList
// ---------------------------------------------------------------------------

interface BreadcrumbItem {
  name: string;
  url: string;
}

/**
 * Builds a BreadcrumbList schema.
 * Pass items from top-level to current page.
 */
export function buildBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// ---------------------------------------------------------------------------
// Organization (root layout — unchanged, kept here for reference)
// ---------------------------------------------------------------------------

export function buildOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: SITE_NAME,
    description:
      'Online platform connecting students with local tutors in Bangladesh',
    url: SITE_URL,
    logo: `${SITE_URL}/android-chrome-512x512.png`,
    sameAs: [
      'https://www.facebook.com/etuition',
      'https://www.linkedin.com/company/etuition',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      email: 'support@etuition.app',
    },
    areaServed: 'BD',
  };
}

// ---------------------------------------------------------------------------
// Person — Tutor Profile  (/tutor/[slug])
// ---------------------------------------------------------------------------

export function buildTutorProfileSchema(tutor: SeoTutor) {
  const profileUrl = `${SITE_URL}/tutor/${tutor.slug}`;
  const imageUrl = tutor.profile_picture
    ? tutor.profile_picture.startsWith('http')
      ? tutor.profile_picture
      : `${process.env.NEXT_PUBLIC_IMG_URL || SITE_URL}${tutor.profile_picture}`
    : DEFAULT_OG_IMAGE;

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: tutor.name,
    url: profileUrl,
    image: imageUrl,
    description: tutor.bio || undefined,
    jobTitle: 'Private Tutor',
    knowsAbout: tutor.subjects,
    worksFor: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
    address: tutor.location_name
      ? {
          '@type': 'PostalAddress',
          addressLocality: tutor.location_name,
          addressCountry: 'BD',
        }
      : undefined,
  };

  // Add AggregateRating only when real data is available
  if (tutor.review_count > 0 && tutor.rating > 0) {
    schema['aggregateRating'] = {
      '@type': 'AggregateRating',
      ratingValue: tutor.rating.toFixed(1),
      reviewCount: tutor.review_count,
      bestRating: '5',
      worstRating: '1',
    };
  }

  // Offer for tutoring service
  schema['offers'] = {
    '@type': 'Offer',
    priceCurrency: 'BDT',
    price: tutor.min_salary,
    availability: 'https://schema.org/InStock',
    url: profileUrl,
  };

  return schema;
}

/**
 * Full JSON-LD block for a tutor profile page.
 * Includes Person + BreadcrumbList schemas as a @graph.
 */
export function buildTutorPageSchemas(tutor: SeoTutor) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      buildTutorProfileSchema(tutor),
      buildBreadcrumbSchema([
        { name: 'Home', url: SITE_URL },
        { name: 'Tutors', url: `${SITE_URL}/tutors` },
        { name: tutor.name, url: `${SITE_URL}/tutor/${tutor.slug}` },
      ]),
    ],
  };
}

// ---------------------------------------------------------------------------
// ItemList — Location Listing  (/tutors/[location])
// ---------------------------------------------------------------------------

export function buildLocationPageSchemas(
  location: SeoLocation,
  tutors: SeoTutor[],
) {
  const pageUrl = `${SITE_URL}/tutors/${location.slug}`;

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Tutors in ${location.name}`,
    description: `List of verified tutors available in ${location.name}, Bangladesh`,
    url: pageUrl,
    numberOfItems: tutors.length || location.tutor_count,
    itemListElement: tutors.slice(0, 20).map((tutor, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${SITE_URL}/tutor/${tutor.slug}`,
      name: tutor.name,
    })),
  };

  const breadcrumb = buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Tutors', url: `${SITE_URL}/tutors` },
    { name: `Tutors in ${location.name}`, url: pageUrl },
  ]);

  return { '@context': 'https://schema.org', '@graph': [itemList, breadcrumb] };
}

export function buildSubjectPageSchemas(
  subject: SeoSubject,
  tutors: SeoTutor[],
) {
  const pageUrl = `${SITE_URL}/tutors/${subject.slug}`;

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${subject.name} Tutors`,
    description: `List of verified ${subject.name} tutors available in Bangladesh`,
    url: pageUrl,
    numberOfItems: tutors.length || subject.tutor_count,
    itemListElement: tutors.slice(0, 20).map((tutor, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${SITE_URL}/tutor/${tutor.slug}`,
      name: tutor.name,
    })),
  };

  const breadcrumb = buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Tutors', url: `${SITE_URL}/tutors` },
    { name: `${subject.name} Tutors`, url: pageUrl },
  ]);

  return { '@context': 'https://schema.org', '@graph': [itemList, breadcrumb] };
}

export function buildClassPageSchemas(
  cls: SeoClass,
  tutors: SeoTutor[],
) {
  const pageUrl = `${SITE_URL}/tutors/${cls.slug}`;

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${cls.name} Tutors`,
    description: `List of qualified tutors available for ${cls.name} in Bangladesh`,
    url: pageUrl,
    numberOfItems: tutors.length || cls.tutor_count,
    itemListElement: tutors.slice(0, 20).map((tutor, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${SITE_URL}/tutor/${tutor.slug}`,
      name: tutor.name,
    })),
  };

  const breadcrumb = buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Tutors', url: `${SITE_URL}/tutors` },
    { name: `${cls.name} Tutors`, url: pageUrl },
  ]);

  return { '@context': 'https://schema.org', '@graph': [itemList, breadcrumb] };
}

// Re-export SeoLocation, SeoSubject, SeoClass types for use in page files
export type { SeoLocation, SeoSubject, SeoClass };

// ---------------------------------------------------------------------------
// ItemList — Subject + Location  (/tutors/[subject]/[location])
// ---------------------------------------------------------------------------

export function buildSubjectLocationPageSchemas(
  page: SeoSubjectLocationPage,
  tutors: SeoTutor[],
) {
  const pageUrl = `${SITE_URL}/tutors/${page.subject_slug}/${page.location_slug}`;

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${page.subject_name} Tutors in ${page.location_name}`,
    description: `Verified ${page.subject_name} tutors in ${page.location_name}, Bangladesh`,
    url: pageUrl,
    numberOfItems: tutors.length || page.tutor_count,
    itemListElement: tutors.slice(0, 20).map((tutor, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${SITE_URL}/tutor/${tutor.slug}`,
      name: tutor.name,
    })),
  };

  const breadcrumb = buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Tutors', url: `${SITE_URL}/tutors` },
    {
      name: `Tutors in ${page.location_name}`,
      url: `${SITE_URL}/tutors/${page.location_slug}`,
    },
    {
      name: `${page.subject_name} Tutors`,
      url: pageUrl,
    },
  ]);

  return { '@context': 'https://schema.org', '@graph': [itemList, breadcrumb] };
}

// ---------------------------------------------------------------------------
// ItemList — Class + Location  (/tutors/[class]/[location])
// ---------------------------------------------------------------------------

export function buildClassLocationPageSchemas(
  page: SeoClassLocationPage,
  tutors: SeoTutor[],
) {
  const pageUrl = `${SITE_URL}/tutors/${page.class_slug}/${page.location_slug}`;

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${page.class_name} Tutors in ${page.location_name}`,
    description: `Qualified ${page.class_name} tutors in ${page.location_name}, Bangladesh`,
    url: pageUrl,
    numberOfItems: tutors.length || page.tutor_count,
    itemListElement: tutors.slice(0, 20).map((tutor, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${SITE_URL}/tutor/${tutor.slug}`,
      name: tutor.name,
    })),
  };

  const breadcrumb = buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Tutors', url: `${SITE_URL}/tutors` },
    {
      name: `Tutors in ${page.location_name}`,
      url: `${SITE_URL}/tutors/${page.location_slug}`,
    },
    {
      name: `${page.class_name} Tutors`,
      url: pageUrl,
    },
  ]);

  return { '@context': 'https://schema.org', '@graph': [itemList, breadcrumb] };
}
