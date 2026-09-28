import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Directory Analytics — Change Liberia Admin',
  description: 'Routing and response analytics for the Change Liberia contact directory.',
  robots: { index: false, follow: false },
};

export default function DirectoryAnalyticsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
