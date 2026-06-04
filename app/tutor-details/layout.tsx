import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tutor Profile & Reviews - E-Tuition',
  description: 'View detailed tutor profiles including qualifications, expertise, rates, and student reviews. Connect with verified tutors on E-Tuition.',
  keywords: ['tutor profile', 'tutor reviews', 'tutor qualifications', 'expert tutors', 'Bangladesh'],
};

export default function TutorDetailsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
