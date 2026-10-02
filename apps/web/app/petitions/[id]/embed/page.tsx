import type { Metadata } from 'next';
import { apiGet } from '../../../../lib/api';

type EmbedPetition = {
  id: string;
  title: string;
  imageUrl?: string;
  summary: string;
  signaturesCount: number;
  goal: number;
};

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function PetitionEmbedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const petition = await apiGet<EmbedPetition>(`/petitions/${id}`).catch(() => null);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://changeliberia.org';

  if (!petition) {
    return (
      <div className="flex h-full min-h-[200px] items-center justify-center p-6 text-center text-sm text-zinc-500">
        This petition is unavailable.
      </div>
    );
  }

  const progress = Math.min(100, Math.round((petition.signaturesCount / Math.max(1, petition.goal)) * 100));
  const petitionUrl = `${siteUrl}/petitions/${petition.id}`;

  return (
    <div className="flex h-full min-h-screen flex-col justify-between bg-white p-4 text-zinc-900">
      <div>
        {petition.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={petition.imageUrl}
            alt={petition.title}
            className="mb-3 h-32 w-full rounded-xl object-cover"
          />
        )}
        <h1 className="text-base font-bold leading-snug">{petition.title}</h1>
        <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-zinc-600">{petition.summary}</p>

        <div className="mt-3">
          <div className="flex items-center justify-between text-xs font-medium">
            <span>
              <span className="font-extrabold text-emerald-600">{petition.signaturesCount.toLocaleString()}</span> signed
            </span>
            <span className="text-zinc-500">Goal: {petition.goal.toLocaleString()}</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-zinc-100">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="mt-4">
        <a
          href={petitionUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full rounded-full bg-amber-400 px-4 py-2.5 text-center text-sm font-semibold text-zinc-900 transition hover:bg-amber-300"
        >
          Sign this petition →
        </a>
        <a
          href={siteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 block text-center text-[11px] font-medium text-zinc-400 hover:text-zinc-600"
        >
          Change Liberia
        </a>
      </div>
    </div>
  );
}
