import { SponsorshipsClient } from './sponsorships-client';

export const metadata = {
  title: 'Become a Sponsor | Change Liberia',
  description:
    'Purchase a sponsorship package and put your organization’s name behind civic accountability in Liberia.',
  alternates: { canonical: '/sponsorships' },
};

export default function SponsorshipsPage() {
  return <SponsorshipsClient />;
}
