import { DevelopersClient } from './developers-client';

export const metadata = {
  title: 'API Access | Change Liberia',
  description: 'Programmatic access to Change Liberia platform data for newsrooms, researchers, and civic-tech developers.',
  alternates: { canonical: '/developers' },
};

export default function DevelopersPage() {
  return <DevelopersClient />;
}
