import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tuition Job Opportunities - Earn as a Tutor | E-Tuition',
  description: 'Browse active tuition job postings and find opportunities to teach. Connect with students looking for tutors in Bangladesh. Post your profile and start earning.',
  keywords: ['tuition jobs', 'tutor jobs', 'teaching opportunities', 'earn money', 'private tuition', 'Bangladesh'],
  openGraph: {
    title: 'Tuition Job Board - Find Teaching Opportunities',
    description: 'Discover tuition job postings from students near you. Flexible hours, competitive rates.',
    type: 'website',
  },
};

export default function TuitionJobsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
