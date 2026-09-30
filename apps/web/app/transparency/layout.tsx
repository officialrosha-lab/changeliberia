import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Transparency — Change Liberia',
  description:
    'What Change Liberia collects from optional paid tools and professional services, and the civic principle that keeps petitions and Civic Pulse free forever.',
  alternates: { canonical: '/transparency' },
};

export default function TransparencyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
