import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Apply for an Official Account — Change Liberia',
  description: 'Request a verified official account to respond to petitions on behalf of your institution.',
  alternates: { canonical: '/official/apply' },
};

export default function OfficialApplyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
