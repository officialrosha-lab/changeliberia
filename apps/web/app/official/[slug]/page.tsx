import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getApiBase } from '../../../lib/api';
import { OfficialProfileCard } from '../../../components/official-profile-card';

export const dynamic = 'force-dynamic';

interface OfficialProfile {
  id: string;
  slug: string;
  name: string;
  category: string;
  county: string | null;
  district: string | null;
  politicalParty: string | null;
  termStartDate: string | null;
  termEndDate: string | null;
  officialEmail: string;
  phone: string | null;
  bio: string | null;
  photoUrl: string | null;
  officeHours: string | null;
  officeAddress: string | null;
  stats: { activePetitions: number; resolvedCount: number };
}

async function fetchProfile(slug: string): Promise<OfficialProfile | null> {
  const res = await fetch(`${getApiBase()}/official/${slug}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const profile = await fetchProfile(slug);
  if (!profile) return { title: 'Official not found — Change Liberia' };
  return {
    title: `${profile.name} — Change Liberia`,
    description: profile.bio ?? `Official profile for ${profile.name} on Change Liberia.`,
  };
}

export default async function OfficialProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = await fetchProfile(slug);
  if (!profile) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <OfficialProfileCard profile={profile} />
    </main>
  );
}
