import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Change Password — Change Liberia',
  description: 'Update the password for your Change Liberia account.',
  robots: { index: false, follow: false },
};

export default function ChangePasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
