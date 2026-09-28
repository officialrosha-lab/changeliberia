import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Notifications — Change Liberia',
  description: 'See updates on your petitions, signatures, and account activity on Change Liberia.',
  robots: { index: false, follow: false },
};

export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
