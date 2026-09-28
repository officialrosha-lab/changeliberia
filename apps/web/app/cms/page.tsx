import type { Metadata } from 'next';
import { CMSPageClient } from './cms-page-client';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Content Manager — Change Liberia',
  description: 'Manage static pages and content blocks published on Change Liberia.',
  robots: { index: false, follow: false },
};

export default function CMSPage() {
  return <CMSPageClient />;
}
