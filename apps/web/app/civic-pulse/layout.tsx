import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Civic Pulse — Change Liberia',
  description: 'See trends and real-time civic activity across petitions and polls on Change Liberia.',
  alternates: { canonical: '/civic-pulse' },
};

export default function CivicPulseLayout({ children }: { children: React.ReactNode }) {
  return children;
}
