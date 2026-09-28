import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create an Account — Change Liberia',
  description: 'Join Change Liberia to create, sign, and track petitions that drive real civic change.',
  alternates: { canonical: '/auth/signup' },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
