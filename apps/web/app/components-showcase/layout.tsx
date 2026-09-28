import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Component Showcase — Change Liberia',
  description: 'Internal UI component reference for Change Liberia.',
  robots: { index: false, follow: false },
};

export default function ComponentsShowcaseLayout({ children }: { children: React.ReactNode }) {
  return children;
}
