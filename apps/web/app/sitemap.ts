import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://changeliberia-web.vercel.app';
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api-production-8873.up.railway.app/api/v1';

type PetitionEntry = { id: string; updatedAt: string };
type PollEntry = { slug: string };

async function fetchAllPages<T>(endpoint: string, pageSize = 100): Promise<T[]> {
  const results: T[] = [];
  let page = 1;
  while (true) {
    try {
      const res = await fetch(`${API_URL}${endpoint}?limit=${pageSize}&page=${page}`, {
        next: { revalidate: 3600 },
      });
      if (!res.ok) break;
      const data: T[] = await res.json();
      if (!Array.isArray(data) || data.length === 0) break;
      results.push(...data);
      if (data.length < pageSize) break;
      page++;
    } catch {
      break;
    }
  }
  return results;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/petitions`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE_URL}/polls`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE_URL}/civic-pulse`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/how-it-works`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/leaders`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
  ];

  const [petitions, polls] = await Promise.all([
    fetchAllPages<PetitionEntry>('/petitions'),
    fetchAllPages<PollEntry>('/polls?status=ACTIVE'),
  ]);

  const petitionRoutes: MetadataRoute.Sitemap = petitions.map((p) => ({
    url: `${BASE_URL}/petitions/${p.id}`,
    lastModified: new Date(p.updatedAt),
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  // Polls have no reliable update timestamp — omit lastModified rather than
  // using expiresAt, which is a closing time not a modification time
  const pollRoutes: MetadataRoute.Sitemap = polls.map((p) => ({
    url: `${BASE_URL}/polls/${p.slug}`,
    changeFrequency: 'hourly' as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...petitionRoutes, ...pollRoutes];
}
