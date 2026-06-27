import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://changeliberia-web.vercel.app';
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api-production-8873.up.railway.app/api/v1';

type PetitionEntry = { id: string; updatedAt: string };
type PollEntry = { slug: string; expiresAt: string };

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return [] as unknown as T;
  return res.json() as Promise<T>;
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
    fetchJson<PetitionEntry[]>(`${API_URL}/petitions?limit=200`).catch(() => [] as PetitionEntry[]),
    fetchJson<PollEntry[]>(`${API_URL}/polls?status=ACTIVE&limit=100`).catch(() => [] as PollEntry[]),
  ]);

  const petitionRoutes: MetadataRoute.Sitemap = petitions.map((p) => ({
    url: `${BASE_URL}/petitions/${p.id}`,
    lastModified: new Date(p.updatedAt),
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  const pollRoutes: MetadataRoute.Sitemap = polls.map((p) => ({
    url: `${BASE_URL}/polls/${p.slug}`,
    lastModified: new Date(p.expiresAt),
    changeFrequency: 'hourly',
    priority: 0.7,
  }));

  return [...staticRoutes, ...petitionRoutes, ...pollRoutes];
}
