/**
 * app/tutors/[category]/[location]/page.tsx
 *
 * Statically generated SEO landing page for subject+location OR class+location combos.
 * Examples:
 *   /tutors/mathematics/dhaka  → Mathematics tutors in Dhaka
 *   /tutors/class-5/chittagong → Class 5 tutors in Chittagong
 *
 * Both subject+location and class+location share this single route.
 * The page resolves the [category] segment by checking both SEO endpoints,
 * preferring subject matches first, then class matches.
 *
 * - generateStaticParams: merges subject-location and class-location pages
 * - generateMetadata: unique per combination (subject vs class detected at runtime)
 * - JSON-LD: ItemList + BreadcrumbList
 * - ISR: revalidate every hour
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { REVALIDATE, SITE_NAME, SITE_URL } from '../../../../lib/seo/config';
import {
  fetchSeoSubjectLocationPages,
  fetchSeoClassLocationPages,
  fetchTutorsBySubjectAndLocation,
  fetchTutorsByClassAndLocation,
  type SeoTutor,
} from '../../../../lib/seo/fetcher';
import {
  generateSubjectLocationMetadata,
  generateClassLocationMetadata,
} from '../../../../lib/seo/metadata';
import {
  buildSubjectLocationPageSchemas,
  buildClassLocationPageSchemas,
} from '../../../../lib/seo/jsonld';

export const revalidate = 3600;

// ---------------------------------------------------------------------------
// Page resolution result
// ---------------------------------------------------------------------------

type ResolvedPage =
  | { type: 'subject'; subjectName: string; locationName: string; tutor_count: number }
  | { type: 'class'; className: string; locationName: string; tutor_count: number }
  | null;

async function resolvePage(
  category: string,
  location: string,
): Promise<ResolvedPage> {
  const [subjectPages, classPages] = await Promise.all([
    fetchSeoSubjectLocationPages(),
    fetchSeoClassLocationPages(),
  ]);

  const subjectMatch = subjectPages.find(
    (p) => p.subject_slug === category && p.location_slug === location,
  );
  if (subjectMatch) {
    return {
      type: 'subject',
      subjectName: subjectMatch.subject_name,
      locationName: subjectMatch.location_name,
      tutor_count: subjectMatch.tutor_count,
    };
  }

  const classMatch = classPages.find(
    (p) => p.class_slug === category && p.location_slug === location,
  );
  if (classMatch) {
    return {
      type: 'class',
      className: classMatch.class_name,
      locationName: classMatch.location_name,
      tutor_count: classMatch.tutor_count,
    };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Static params — merge both subject+location and class+location combinations
// ---------------------------------------------------------------------------

export async function generateStaticParams() {
  const [subjectPages, classPages] = await Promise.all([
    fetchSeoSubjectLocationPages(),
    fetchSeoClassLocationPages(),
  ]);

  const fromSubjects = subjectPages.map((p) => ({
    category: p.subject_slug,
    location: p.location_slug,
  }));

  const fromClasses = classPages.map((p) => ({
    category: p.class_slug,
    location: p.location_slug,
  }));

  // Deduplicate (a subject slug and class slug should never collide but guard anyway)
  const seen = new Set<string>();
  const all = [...fromSubjects, ...fromClasses].filter((entry) => {
    const key = `${entry.category}/${entry.location}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return all;
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

type Props = { params: Promise<{ category: string; location: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, location } = await params;

  const [subjectPages, classPages] = await Promise.all([
    fetchSeoSubjectLocationPages(),
    fetchSeoClassLocationPages(),
  ]);

  const subjectMatch = subjectPages.find(
    (p) => p.subject_slug === category && p.location_slug === location,
  );
  if (subjectMatch) return generateSubjectLocationMetadata(subjectMatch);

  const classMatch = classPages.find(
    (p) => p.class_slug === category && p.location_slug === location,
  );
  if (classMatch) return generateClassLocationMetadata(classMatch);

  return { title: 'Page Not Found' };
}

import SeoTutorList from '../../../../components/SeoTutorList';

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function CategoryLocationPage({ params }: Props) {
  const { category, location } = await params;

  const resolved = await resolvePage(category, location);
  if (!resolved) notFound();

  // Fetch tutors and build JSON-LD based on type
  let tutors: SeoTutor[] = [];
  let jsonLd: object;
  let pageTitle: string;
  let pageDescription: string;
  let subjectOrClassName: string;

  if (resolved.type === 'subject') {
    const [allSubjectPages, fetchedTutors] = await Promise.all([
      fetchSeoSubjectLocationPages(),
      fetchTutorsBySubjectAndLocation(category, location),
    ]);
    tutors = fetchedTutors;
    const page = allSubjectPages.find(
      (p) => p.subject_slug === category && p.location_slug === location,
    )!;
    jsonLd = buildSubjectLocationPageSchemas(page, tutors);
    subjectOrClassName = resolved.subjectName;
    pageTitle = `${resolved.subjectName} Tutors in ${resolved.locationName}`;
    pageDescription = `Find ${resolved.tutor_count}+ expert ${resolved.subjectName} tutors in ${resolved.locationName}. Verified teachers offering home and online tuition on ${SITE_NAME}.`;
  } else {
    const [allClassPages, fetchedTutors] = await Promise.all([
      fetchSeoClassLocationPages(),
      fetchTutorsByClassAndLocation(category, location),
    ]);
    tutors = fetchedTutors;
    const page = allClassPages.find(
      (p) => p.class_slug === category && p.location_slug === location,
    )!;
    jsonLd = buildClassLocationPageSchemas(page, tutors);
    subjectOrClassName = resolved.className;
    pageTitle = `${resolved.className} Tutors in ${resolved.locationName}`;
    pageDescription = `Find ${resolved.tutor_count}+ qualified ${resolved.className} tutors in ${resolved.locationName}. Home & online tuition available on ${SITE_NAME}.`;
  }

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-gray-500">
          <ol className="flex items-center gap-2 flex-wrap">
            <li>
              <Link href="/" className="hover:text-indigo-600 transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link
                href="/tutors"
                className="hover:text-indigo-600 transition-colors"
              >
                Tutors
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link
                href={`/tutors/${location}`}
                className="hover:text-indigo-600 transition-colors"
              >
                {resolved.locationName}
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="text-gray-900 font-medium" aria-current="page">
              {subjectOrClassName}
            </li>
          </ol>
        </nav>

        {/* Hero */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 md:p-12 text-white mb-10 shadow-xl">
          <div className="inline-flex items-center gap-2 bg-white/20 text-white text-sm font-medium px-3 py-1 rounded-full mb-4">
            {resolved.type === 'subject' ? '📚 Subject Tuition' : '🎓 Class Tuition'}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">{pageTitle}</h1>
          <p className="text-indigo-100 text-lg mb-6 max-w-2xl">
            {pageDescription}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/tutors"
              className="inline-flex items-center gap-2 bg-white text-indigo-600 font-semibold px-6 py-3 rounded-xl hover:bg-indigo-50 transition-colors shadow-md"
            >
              Browse All Tutors
            </Link>
            <Link
              href={`/tutors/${location}`}
              className="inline-flex items-center gap-2 border border-white text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/10 transition-colors"
            >
              All Tutors in {resolved.locationName}
            </Link>
          </div>
        </div>

        {/* Stat pills */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-center">
            <p className="text-3xl font-bold text-indigo-600">
              {tutors.length || resolved.tutor_count}+
            </p>
            <p className="text-gray-600 text-sm mt-1">Tutors Available</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-center">
            <p className="text-3xl font-bold text-indigo-600">✓</p>
            <p className="text-gray-600 text-sm mt-1">All Verified</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-center">
            <p className="text-3xl font-bold text-indigo-600">Free</p>
            <p className="text-gray-600 text-sm mt-1">To Browse</p>
          </div>
        </div>

        {/* Tutor listings */}
        {tutors.length > 0 ? (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {subjectOrClassName} Tutors in {resolved.locationName}
            </h2>
            <SeoTutorList initialTutors={tutors} />
            {tutors.length > 12 && (
              <div className="text-center mt-8">
                <Link
                  href="/tutors"
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors duration-200 shadow-md"
                >
                  See All {tutors.length} Tutors
                </Link>
              </div>
            )}
          </section>
        ) : (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">
              No tutors listed yet for {subjectOrClassName} in{' '}
              {resolved.locationName}.
            </p>
            <Link
              href="/tutors"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Browse All Available Tutors
            </Link>
          </div>
        )}

        {/* Why section */}
        <section className="mt-12 bg-gradient-to-br from-gray-50 to-indigo-50 border border-indigo-100 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Why find a {subjectOrClassName} tutor on {SITE_NAME}?
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                icon: '🎯',
                title: 'Subject Specialists',
                desc: `All tutors on our platform specialise in ${subjectOrClassName} and related topics.`,
              },
              {
                icon: '📍',
                title: 'Local to You',
                desc: `Find tutors right in ${resolved.locationName} — no long commutes.`,
              },
              {
                icon: '💻',
                title: 'Online or Home',
                desc: 'Choose between home visit or online sessions — whatever suits you.',
              },
              {
                icon: '⭐',
                title: 'Student Reviews',
                desc: 'Read genuine student reviews to pick the best fit.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-3 bg-white rounded-xl p-4 border border-gray-200"
              >
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="font-semibold text-gray-900">{item.title}</p>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
