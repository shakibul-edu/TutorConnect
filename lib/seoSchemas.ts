/**
 * JSON-LD Schema generation utilities for SEO optimization
 */

export interface TutorSchemaData {
  id: string;
  name: string;
  qualifications?: string;
  rate?: number;
  ratingValue?: number;
  reviewCount?: number;
  subjects?: string[];
  experience?: string;
}

export interface JobSchemaData {
  id: string;
  title: string;
  description?: string;
  subject?: string;
  rate?: number;
  class?: string;
  datePosted?: string;
  validThrough?: string;
}

/**
 * Generate LocalBusiness schema for E-Tuition
 */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'E-Tuition',
    description: 'Online platform connecting students with local tutors',
    url: 'https://etuition.app',
    logo: 'https://etuition.app/logo.png',
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

/**
 * Generate Person (Tutor) schema
 */
export function generateTutorSchema(tutor: TutorSchemaData) {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: tutor.name,
    url: `https://etuition.app/tutor/${tutor.name ? tutor.name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-') : 'tutor'}-${tutor.id}`,
  };

  if (tutor.qualifications) {
    schema.qualifications = tutor.qualifications;
  }

  if (tutor.subjects && tutor.subjects.length > 0) {
    schema.knowsAbout = tutor.subjects;
  }

  if (tutor.experience) {
    schema.jobTitle = `${tutor.experience} Tutor`;
  }

  // Add rating if available
  if (tutor.ratingValue !== undefined) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: tutor.ratingValue,
      reviewCount: tutor.reviewCount || 0,
    };
  }

  // Add price information for lessons
  if (tutor.rate !== undefined) {
    schema.makesOffer = {
      '@type': 'Offer',
      priceCurrency: 'BDT',
      price: tutor.rate.toString(),
      priceSpecification: {
        '@type': 'PriceSpecification',
        priceCurrency: 'BDT',
        price: tutor.rate.toString(),
        pricingPattern: 'http://purl.org/goodrelations/v1#PER_HOUR',
      },
    };
  }

  return schema;
}

/**
 * Generate JobPosting schema
 */
export function generateJobSchema(job: JobSchemaData) {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description || job.title,
    url: `https://etuition.app/job-details/${job.id}`,
    hiringOrganization: {
      '@type': 'Organization',
      name: 'E-Tuition Student',
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'BD',
      },
    },
    employmentType: 'PART_TIME',
  };

  if (job.datePosted) {
    schema.datePosted = job.datePosted;
  }

  if (job.validThrough) {
    schema.validThrough = job.validThrough;
  }

  if (job.rate !== undefined) {
    schema.baseSalary = {
      '@type': 'PriceSpecification',
      priceCurrency: 'BDT',
      price: job.rate.toString(),
    };
  }

  return schema;
}

/**
 * Generate BreadcrumbList schema for navigation
 */
export function generateBreadcrumbSchema(breadcrumbs: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}

/**
 * Generate FAQPage schema
 */
export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}
