import type { Metadata } from 'next';
import { OfficialDashboardClient } from './official-dashboard-client';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Official Dashboard — Change Liberia',
  description: 'Track and respond to petitions and public inquiries directed to your institution on Change Liberia.',
  robots: { index: false, follow: false },
};

export default function OfficialDashboardPage() {
  return <OfficialDashboardClient />;
}
