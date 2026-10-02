import { notFound, redirect } from 'next/navigation';
import { apiGet } from '../../../lib/api';

type ShareLinkResponse = {
  success: boolean;
  redirectUrl: string;
};

export default async function ShareLinkRedirectPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const data = await apiGet<ShareLinkResponse>(`/whatsapp/share-link/${code}`).catch(() => null);

  if (!data?.redirectUrl) {
    notFound();
  }

  redirect(data.redirectUrl);
}
