import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Find Local Tutors Near You - E-Tuition',
  description: 'Browse thousands of verified tutors in Bangladesh. Find qualified teachers for all subjects, classes, and learning styles. Search by location, price, and availability.',
  keywords: ['tutors', 'private tuition', 'home tutors', 'online tutors', 'education', 'Bangladesh', 'local tutors'],
  openGraph: {
    title: 'Find Qualified Tutors - E-Tuition',
    description: 'Discover experienced tutors by GPS location. Search filters include subjects, rates, and availability.',
    type: 'website',
  },
};

export default function TutorsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
