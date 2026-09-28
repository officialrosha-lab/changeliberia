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
    alternates: { canonical: `https://changeliberia.org/official/${slug}` },
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

  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    jobTitle: profile.category,
    ...(profile.bio && { description: profile.bio }),
    ...(profile.photoUrl && { image: profile.photoUrl }),
    ...(profile.county && {
      homeLocation: { '@type': 'AdministrativeArea', name: `${profile.county} County, Liberia` },
    }),
    url: `https://changeliberia.org/official/${slug}`,
  };
  const safeJsonLd = JSON.stringify(personJsonLd).replace(/<\/script>/gi, '<\\/script>');

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd }} />
      <OfficialProfileCard profile={profile} />
    </main>
  );
}
