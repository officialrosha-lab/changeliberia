import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Membership — Change Liberia',
  description:
    'Become a Change Liberia supporting member. Petitions, Civic Pulse, and a verified lawmaker\'s basic access stay free forever — membership only unlocks optional extras.',
  alternates: { canonical: '/membership' },
};

export default function MembershipLayout({ children }: { children: React.ReactNode }) {
  return children;
}
