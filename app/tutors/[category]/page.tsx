/**
 * app/tutors/[category]/page.tsx
 *
 * Statically generated SEO landing page for tutors in a specific location,
 * subject, or class.
 * URL: /tutors/dhaka, /tutors/accounting-class-10, /tutors/class-10, etc.
 *
 * NOTE: The dynamic segment is named [category] because Next.js requires
 * sibling dynamic folders to share the same segment name. This segment
 * can hold a location, a subject, or a class slug.
 *
 * Resolution order:
 * 1. Location: /api/seo/locations/[slug]/
 * 2. Subject: /api/seo/subjects/[slug]/
 * 3. Class: /api/seo/classes/[slug]/
 *
 * - generateStaticParams: merges locations, subjects, and classes
 * - generateMetadata: unique metadata depending on the resolved entity type
 * - JSON-LD: ItemList + BreadcrumbList per resolved entity type
 * - ISR: revalidate every hour
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { SITE_NAME } from '../../../lib/seo/config';
import {
  fetchSeoLocations,
  fetchSeoLocationBySlug,
  fetchTutorsByLocation,
  fetchSeoSubjects,
  fetchSeoClasses,
  fetchSeoSubjectBySlug,
  fetchSeoClassBySlug,
  fetchTutorsBySubject,
  fetchTutorsByClass,
} from '../../../lib/seo/fetcher';
import {
  generateLocationMetadata,
  generateSubjectMetadata,
  generateClassMetadata,
} from '../../../lib/seo/metadata';
import {
  buildLocationPageSchemas,
  buildSubjectPageSchemas,
  buildClassPageSchemas,
} from '../../../lib/seo/jsonld';
import SeoTutorList from '../../../components/SeoTutorList';

export const revalidate = 3600;

// ---------------------------------------------------------------------------
// Helper: slugify
// ---------------------------------------------------------------------------

const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

// ---------------------------------------------------------------------------
// Static params
// ---------------------------------------------------------------------------

export async function generateStaticParams() {
  const [locations, subjects, classes] = await Promise.all([
    fetchSeoLocations(),
    fetchSeoSubjects(),
    fetchSeoClasses(),
  ]);

  const fromLocs = locations.map((loc) => ({ category: loc.slug }));
  const fromSubs = subjects.map((sub) => ({ category: sub.slug || slugify(sub.name) }));
  const fromCls = classes.map((cls) => ({ category: cls.slug || slugify(cls.name) }));

  // Deduplicate params
  const seen = new Set<string>();
  const all = [...fromLocs, ...fromSubs, ...fromCls].filter((entry) => {
    if (!entry.category) return false;
    if (seen.has(entry.category)) return false;
    seen.add(entry.category);
    return true;
  });

  return all;
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

type Props = { params: Promise<{ category: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: slug } = await params;

  // 1. Check if location
  const loc = await fetchSeoLocationBySlug(slug);
  if (loc) return generateLocationMetadata(loc);

  // 2. Check if subject
  const subject = await fetchSeoSubjectBySlug(slug);
  if (subject) return generateSubjectMetadata(subject);

  // 3. Check if class
  const cls = await fetchSeoClassBySlug(slug);
  if (cls) return generateClassMetadata(cls);

  return { title: 'Page Not Found' };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function CategoryTutorsPage({ params }: Props) {
  const { category: slug } = await params;

  // 1. Check if location
  const loc = await fetchSeoLocationBySlug(slug);
  if (loc) {
    const tutors = await fetchTutorsByLocation(slug);
    const jsonLd = buildLocationPageSchemas(loc, tutors);

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
              <li className="text-gray-900 font-medium" aria-current="page">
                {loc.name}
              </li>
            </ol>
          </nav>

          {/* Hero */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 md:p-12 text-white mb-10 shadow-xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              Tutors in {loc.name}
            </h1>
            <p className="text-indigo-100 text-lg mb-6 max-w-2xl">
              {loc.description ||
                `Find ${loc.tutor_count || tutors.length}+ verified tutors in ${loc.name}, Bangladesh.
                 Expert teachers available for home and online tuition.`}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/tutors"
                className="inline-flex items-center gap-2 bg-white text-indigo-600 font-semibold px-6 py-3 rounded-xl hover:bg-indigo-50 transition-colors shadow-md"
              >
                Browse All Tutors
              </Link>
              <Link
                href="/auth/signin"
                className="inline-flex items-center gap-2 border border-white text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/10 transition-colors"
              >
                Sign In to Contact
              </Link>
            </div>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-center">
              <p className="text-3xl font-bold text-indigo-600">
                {tutors.length || loc.tutor_count}+
              </p>
              <p className="text-gray-600 text-sm mt-1">Verified Tutors</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-center">
              <p className="text-3xl font-bold text-indigo-600">100%</p>
              <p className="text-gray-600 text-sm mt-1">Background Checked</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-center col-span-2 md:col-span-1">
              <p className="text-3xl font-bold text-indigo-600">Free</p>
              <p className="text-gray-600 text-sm mt-1">To Browse & Compare</p>
            </div>
          </div>

          {/* Tutor list */}
          {tutors.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Featured Tutors in {loc.name}
              </h2>
              <SeoTutorList initialTutors={tutors} />

              {tutors.length > 12 && (
                <div className="text-center mt-8">
                  <Link
                    href="/tutors"
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors duration-200 shadow-md"
                  >
                    See All {tutors.length} Tutors in {loc.name}
                  </Link>
                </div>
              )}
            </section>
          )}

          {/* Why E-Tuition */}
          <section className="mt-12 bg-gradient-to-br from-gray-50 to-indigo-50 border border-indigo-100 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Why choose {SITE_NAME} in {loc.name}?
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  icon: '🎓',
                  title: 'Verified Educators',
                  desc: 'Every tutor is background-checked and credential-verified.',
                },
                {
                  icon: '📍',
                  title: 'GPS-Matched',
                  desc: `Find tutors near you in ${loc.name} with our location-based search.`,
                },
                {
                  icon: '💬',
                  title: 'Direct Communication',
                  desc: 'Contact tutors directly — no middleman, no hidden fees.',
                },
                {
                  icon: '⭐',
                  title: 'Student Reviews',
                  desc: 'Read honest reviews from verified students before booking.',
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

  // 2. Check if subject
  const subject = await fetchSeoSubjectBySlug(slug);
  if (subject) {
    const tutors = await fetchTutorsBySubject(slug);
    const jsonLd = buildSubjectPageSchemas(subject, tutors);

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
              <li className="text-gray-900 font-medium" aria-current="page">
                {subject.name} Tutors
              </li>
            </ol>
          </nav>

          {/* Hero */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 md:p-12 text-white mb-10 shadow-xl">
            <div className="inline-flex items-center gap-2 bg-white/20 text-white text-sm font-medium px-3 py-1 rounded-full mb-4">
              📚 Subject Tuition
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              {subject.name} Tutors
            </h1>
            <p className="text-indigo-100 text-lg mb-6 max-w-2xl">
              {subject.description ||
                `Find ${subject.tutor_count || tutors.length}+ verified ${subject.name} tutors in Bangladesh.
                 Expert teachers available for home and online tuition.`}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/tutors"
                className="inline-flex items-center gap-2 bg-white text-indigo-600 font-semibold px-6 py-3 rounded-xl hover:bg-indigo-50 transition-colors shadow-md"
              >
                Browse All Tutors
              </Link>
              <Link
                href="/auth/signin"
                className="inline-flex items-center gap-2 border border-white text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/10 transition-colors"
              >
                Sign In to Contact
              </Link>
            </div>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-4 mb-10">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-center">
              <p className="text-3xl font-bold text-indigo-600">
                {tutors.length || subject.tutor_count}+
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

          {/* Tutor list */}
          {tutors.length > 0 ? (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Featured {subject.name} Tutors
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
                No tutors listed yet for {subject.name}.
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
              Why find a {subject.name} tutor on {SITE_NAME}?
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  icon: '🎯',
                  title: 'Subject Specialists',
                  desc: `All tutors on our platform specialise in ${subject.name} and related topics.`,
                },
                {
                  icon: '📍',
                  title: 'Flexible Options',
                  desc: 'Find tutors offering either home visits or online sessions.',
                },
                {
                  icon: '💻',
                  title: 'Direct Communication',
                  desc: 'Connect with tutors directly with zero coordinator fees.',
                },
                {
                  icon: '⭐',
                  title: 'Student Reviews',
                  desc: 'Read genuine reviews to select the best match.',
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

  // 3. Check if class
  const cls = await fetchSeoClassBySlug(slug);
  if (cls) {
    const tutors = await fetchTutorsByClass(slug);
    const jsonLd = buildClassPageSchemas(cls, tutors);

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
              <li className="text-gray-900 font-medium" aria-current="page">
                {cls.name} Tutors
              </li>
            </ol>
          </nav>

          {/* Hero */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 md:p-12 text-white mb-10 shadow-xl">
            <div className="inline-flex items-center gap-2 bg-white/20 text-white text-sm font-medium px-3 py-1 rounded-full mb-4">
              🎓 Class Tuition
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              {cls.name} Tutors
            </h1>
            <p className="text-indigo-100 text-lg mb-6 max-w-2xl">
              {cls.description ||
                `Find ${cls.tutor_count || tutors.length}+ verified tutors for ${cls.name} in Bangladesh.
                 Expert teachers available for home and online tuition.`}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/tutors"
                className="inline-flex items-center gap-2 bg-white text-indigo-600 font-semibold px-6 py-3 rounded-xl hover:bg-indigo-50 transition-colors shadow-md"
              >
                Browse All Tutors
              </Link>
              <Link
                href="/auth/signin"
                className="inline-flex items-center gap-2 border border-white text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/10 transition-colors"
              >
                Sign In to Contact
              </Link>
            </div>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-4 mb-10">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-center">
              <p className="text-3xl font-bold text-indigo-600">
                {tutors.length || cls.tutor_count}+
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

          {/* Tutor list */}
          {tutors.length > 0 ? (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Featured {cls.name} Tutors
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
                No tutors listed yet for {cls.name}.
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
              Why find a {cls.name} tutor on {SITE_NAME}?
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  icon: '🎓',
                  title: 'Grade Specialists',
                  desc: `All tutors on our platform are familiar with the curriculum and requirements for ${cls.name}.`,
                },
                {
                  icon: '📍',
                  title: 'Flexible Options',
                  desc: 'Find tutors offering either home visits or online sessions.',
                },
                {
                  icon: '💻',
                  title: 'Direct Communication',
                  desc: 'Connect with tutors directly with zero coordinator fees.',
                },
                {
                  icon: '⭐',
                  title: 'Student Reviews',
                  desc: 'Read genuine reviews to select the best match.',
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

  notFound();
}
