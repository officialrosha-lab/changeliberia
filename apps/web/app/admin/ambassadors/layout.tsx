import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ambassadors — Change Liberia Admin',
  description: 'Manage Change Liberia ambassador applications and assignments.',
  robots: { index: false, follow: false },
};

export default function AmbassadorsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
