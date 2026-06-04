import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tuition Job Details - E-Tuition',
  description: 'View detailed tuition job postings with subject requirements, student details, location, rates, and schedule. Apply to teach on E-Tuition.',
  keywords: ['tuition job details', 'teaching opportunity', 'job description', 'student requirements', 'Bangladesh'],
};

export default function JobDetailsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
