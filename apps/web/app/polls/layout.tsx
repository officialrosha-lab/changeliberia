import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Browse Polls — Change Liberia',
  description: 'Vote and see results on civic polls covering issues that matter across Liberia.',
  alternates: { canonical: '/polls' },
};

export default function PollsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
