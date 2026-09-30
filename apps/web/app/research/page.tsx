import { ResearchClient } from './research-client';

export const metadata = {
  title: 'Research Products | Change Liberia',
  description:
    'Data reports and analysis built from platform-wide petition and civic engagement trends across Liberia.',
  alternates: { canonical: '/research' },
};

export default function ResearchPage() {
  return <ResearchClient />;
}
