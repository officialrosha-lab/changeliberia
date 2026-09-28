import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Log In — Change Liberia',
  description: 'Sign in to manage your petitions, track signatures, and continue where you left off on Change Liberia.',
  alternates: { canonical: '/auth/login' },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
