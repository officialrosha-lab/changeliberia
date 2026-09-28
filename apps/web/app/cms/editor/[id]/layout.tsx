import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Editor — Change Liberia',
  description: 'Edit a Change Liberia content page.',
  robots: { index: false, follow: false },
};

export default function CmsEditorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
