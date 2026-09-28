import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Active Sessions — Change Liberia',
  description: 'Review and manage the devices signed in to your Change Liberia account.',
  robots: { index: false, follow: false },
};

export default function SessionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
