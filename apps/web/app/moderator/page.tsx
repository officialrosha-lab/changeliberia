import type { Metadata } from 'next';
import { ModeratorPageClient } from './moderator-page-client';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Moderator Dashboard — Change Liberia',
  description: 'Review reported content and pending petitions on Change Liberia.',
  robots: { index: false, follow: false },
};

export default function ModeratorPage() {
  return <ModeratorPageClient />;
}
