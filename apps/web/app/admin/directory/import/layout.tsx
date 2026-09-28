import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Import Contacts — Change Liberia Admin',
  description: 'Bulk import institution contacts into the Change Liberia directory.',
  robots: { index: false, follow: false },
};

export default function DirectoryImportLayout({ children }: { children: React.ReactNode }) {
  return children;
}
