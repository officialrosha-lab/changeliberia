import { apiGet } from '../../../lib/api';
import { fetchAsDataUri, renderShareCardPng } from '../../../lib/share-card';

export const runtime = 'nodejs';

type Petition = {
  title: string;
  summary?: string | null;
  imageUrl?: string | null;
  category?: string | null;
  categories?: string[];
  signaturesCount?: number;
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const url = new URL(request.url);
  const pick = (key: string) => url.searchParams.get(key)?.trim() || null;

  const petition = await apiGet<Petition>(`/petitions/${id}`).catch(() => null);
  if (!petition) {
    return new Response('Petition not found', { status: 404 });
  }

  const coverImageUrl = pick('image') ?? petition.imageUrl ?? null;
  const coverImageDataUri = coverImageUrl ? await fetchAsDataUri(coverImageUrl) : null;

  const countParam = pick('count');
  const count = countParam
    ? Number(countParam)
    : petition.signaturesCount && petition.signaturesCount > 0
      ? petition.signaturesCount
      : null;

  const image = await renderShareCardPng({
    title: pick('title') ?? petition.title ?? 'Untitled petition',
    summary: pick('summary') ?? petition.summary ?? '',
    category: pick('category') ?? petition.category ?? petition.categories?.[0] ?? '',
    count,
    coverImageDataUri,
  });

  image.headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
  return image;
}
