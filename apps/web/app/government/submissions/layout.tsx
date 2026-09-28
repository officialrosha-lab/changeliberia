import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Government Submissions — Change Liberia',
  description: 'Petitions and inquiries submitted to government institutions on Change Liberia.',
  robots: { index: false, follow: false },
};

export default function GovernmentSubmissionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
