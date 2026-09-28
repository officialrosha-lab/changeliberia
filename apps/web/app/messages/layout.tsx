import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Messages — Change Liberia',
  description: 'Read and send messages with other Change Liberia members.',
  robots: { index: false, follow: false },
};

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
