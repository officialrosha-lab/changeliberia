import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Monetization — Change Liberia Admin',
  description: 'Manage paid plans, subscriptions, invoices, and entitlement grants on Change Liberia.',
  robots: { index: false, follow: false },
};

export default function MonetizationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
