import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Verify Your Email — Change Liberia',
  description: 'Confirm your email address to finish setting up your Change Liberia account.',
  robots: { index: false, follow: false },
};

export default function VerifyEmailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
