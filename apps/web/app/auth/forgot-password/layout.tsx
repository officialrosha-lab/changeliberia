import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Forgot Password — Change Liberia',
  description: 'Reset the password for your Change Liberia account.',
  alternates: { canonical: '/auth/forgot-password' },
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
