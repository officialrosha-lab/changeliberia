import { InvoicesClient } from './invoices-client';

export const metadata = {
  title: 'My Invoices | Change Liberia',
  description: 'View invoices for Change Liberia Studio services.',
  alternates: { canonical: '/invoices' },
  robots: { index: false, follow: false },
};

export default function InvoicesPage() {
  return <InvoicesClient />;
}
