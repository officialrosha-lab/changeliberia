import { OrganizationsClient } from './organizations-client';

export const metadata = {
  title: 'Organizations — Change Liberia',
  description: 'Create and manage your NGO or team workspace on Change Liberia.',
  alternates: { canonical: '/organizations' },
  robots: { index: false, follow: false },
};

export default function OrganizationsPage() {
  return <OrganizationsClient />;
}
