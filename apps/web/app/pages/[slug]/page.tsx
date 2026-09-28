import type { Metadata } from 'next';
import { CMSPageViewer } from '../../../components/cms';
import { fetchCmsPageWithBlocks } from '../../../lib/cms';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await fetchCmsPageWithBlocks(slug);
  if (!page) return {};

  const title = `${page.ogTitle || page.title} — Change Liberia`;
  const description = page.ogDescription || page.metaDescription || undefined;
  const pageUrl = `https://changeliberia.org/pages/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      type: 'website',
      url: pageUrl,
      siteName: 'Change Liberia',
      title,
      description,
      images: page.ogImage ? [{ url: page.ogImage, width: 1200, height: 630, alt: page.title }] : undefined,
    },
  };
}

export default function PublicCMSPage() {
  return <CMSPageViewer />;
}
