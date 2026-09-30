import { OrganizationDetailClient } from './organization-detail-client';

export const metadata = {
  title: 'Organization workspace — Change Liberia',
  robots: { index: false, follow: false },
};

export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrganizationDetailClient organizationId={id} />;
}
