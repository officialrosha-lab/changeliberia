import { apiGet } from '../../lib/api';
import { PetitionDiscoveryClient } from '../../components/petition-discovery-client';

type Petition = {
  id: string;
  title: string;
  summary: string;
  description: string;
  imageUrl?: string | null;
  signaturesCount: number;
  todaySignatures: number;
  goal: number;
  category?: string | null;
  createdAt: string;
  creator: {
    id: string;
    fullName: string;
    avatarUrl?: string;
  };
};

type BrowseResponse = {
  categories: Record<string, Petition[]>;
  trending: Petition[];
  total: number;
};

const EMPTY: BrowseResponse = { categories: {}, trending: [], total: 0 };

export default async function PetitionsDiscoveryPage() {
  const data = await apiGet<BrowseResponse>('/petitions/browse/all').catch((error) => {
    console.error('Failed to fetch petitions:', error);
    return null;
  });

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-neutral-950">
      <PetitionDiscoveryClient data={data ?? EMPTY} />
    </main>
  );
}
