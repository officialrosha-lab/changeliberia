import type { Metadata } from 'next';
import { AdminPageClient } from './admin-page-client';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin Panel — Change Liberia',
  description: 'Platform administration for Change Liberia — petitions, users, and site-wide settings.',
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminPageClient />;
}
