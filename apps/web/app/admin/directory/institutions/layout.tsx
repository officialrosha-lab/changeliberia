import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Institutions — Change Liberia Admin',
  description: 'Manage government institutions listed in the Change Liberia directory.',
  robots: { index: false, follow: false },
};

export default function DirectoryInstitutionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
