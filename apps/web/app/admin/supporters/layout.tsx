import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Supporters — Change Liberia Admin',
  description: 'Manage supporter contacts and send outreach updates.',
  robots: { index: false, follow: false },
};

export default function SupportersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
