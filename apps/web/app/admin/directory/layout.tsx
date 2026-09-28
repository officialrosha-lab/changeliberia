import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Directory — Change Liberia Admin',
  description: 'Manage the directory of government institutions and contacts on Change Liberia.',
  robots: { index: false, follow: false },
};

export default function DirectoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
