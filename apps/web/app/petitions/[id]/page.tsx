import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { apiGet } from '../../../lib/api';
import { PetitionGovernmentPanel } from '../../../components/petition-government';
import { PetitionMilestones } from '../../../components/petition-milestones';
import { LivePetitionStats } from '../../../components/live-petition-stats';
import { CommentForm } from './comment-form';
import { SignForm } from './sign-form';

type Petition = {
  id: string;
  title: string;
  imageUrl?: string;
  description: string;
  summary: string;
  signaturesCount: number;
  todaySignatures: number;
  goal: number;
  category?: string | null;
};

type PetitionUpdate = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
};

type PetitionComment = {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
};

function renderDescriptionLine(line: string, index: number) {
  const youtubeMatch = line.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/,
  );
  if (youtubeMatch) {
    return (
      <div key={index} className="my-4 aspect-video overflow-hidden rounded-xl">
        <iframe
          src={`https://www.youtube.com/embed/${youtubeMatch[1]}`}
          className="h-full w-full"
          allowFullScreen
          title={`video-${index}`}
        />
      </div>
    );
  }
  if (/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(line) && line.startsWith('http')) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img key={index} src={line} alt="" className="my-4 w-full rounded-xl object-cover" />
    );
  }
  if (/\.(mp4|webm|mov)(\?.*)?$/i.test(line) && line.startsWith('http')) {
    return (
      <video key={index} src={line} controls className="my-4 w-full rounded-xl" />
    );
  }
  return <span key={index}>{line}<br /></span>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const petition = await apiGet<Petition>(`/petitions/${id}`).catch(() => null);
  if (!petition) return {};

  const title = petition.title;
  const description =
    petition.summary || petition.description.slice(0, 160).replace(/\n/g, ' ');
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://changeliberia-web.vercel.app';
  const pageUrl = `${siteUrl}/petitions/${id}`;
  const image = petition.imageUrl
    ? { url: petition.imageUrl, width: 1200, height: 630, alt: title }
    : { url: `${siteUrl}/og-image.png`, width: 1200, height: 630, alt: 'Change Liberia' };

  return {
    title: `${title} — Change Liberia`,
    description,
    openGraph: {
      type: 'website',
      url: pageUrl,
      siteName: 'Change Liberia',
      title,
      description,
      images: [image],
    },
    twitter: {
      card: petition.imageUrl ? 'summary_large_image' : 'summary',
      title,
      description,
      images: [image.url],
    },
  };
}

export default async function PetitionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [petition, updates, comments] = await Promise.all([
    apiGet<Petition>(`/petitions/${id}`).catch(() => null),
    apiGet<PetitionUpdate[]>(`/petitions/${id}/updates`).catch(() => []),
    apiGet<PetitionComment[]>(`/petitions/${id}/comments`).catch(() => []),
  ]);
  if (!petition) return notFound();

  return (
    <main className="min-h-screen pb-28 bg-zinc-50 dark:bg-neutral-950 md:pb-0">
      {/* Hero image strip */}
      {petition.imageUrl && (
        <div className="relative h-56 w-full overflow-hidden bg-zinc-200 dark:bg-neutral-800 sm:h-72 md:h-80">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={petition.imageUrl.includes('unsplash.com') && !petition.imageUrl.includes('?')
              ? `${petition.imageUrl}?auto=format&fit=crop&w=1400&q=80`
              : petition.imageUrl}
            alt={petition.title}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          {petition.category && (
            <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold capitalize text-zinc-800 backdrop-blur-sm dark:bg-neutral-900/90 dark:text-neutral-200">
              {petition.category.replace('-', ' ')}
            </span>
          )}
        </div>
      )}

      <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
        <div className="grid gap-6 md:grid-cols-[1fr_340px] md:gap-8 lg:gap-10">

          {/* LEFT — main content */}
          <div className="space-y-5">

            {/* Title card */}
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 md:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  🟢 Active campaign
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  ✎ {petition.signaturesCount.toLocaleString()} signatures
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>
                  Live updates
                </span>
              </div>

              <h1 className="mt-4 text-2xl font-extrabold leading-snug text-zinc-900 dark:text-white sm:text-3xl md:text-4xl">
                {petition.title}
              </h1>
              <p className="mt-3 text-base leading-relaxed text-zinc-600 dark:text-neutral-400 sm:text-lg">
                {petition.summary}
              </p>

              {/* Live signature stats — count, progress, next milestone, signer feed */}
              <div className="mt-6">
                <LivePetitionStats
                  petitionId={petition.id}
                  initialCount={petition.signaturesCount}
                  initialTodayCount={petition.todaySignatures}
                  goal={petition.goal}
                />
              </div>

              {/* Static stats row */}
              <div className="mt-5 grid grid-cols-2 gap-3">
                {[
                  { label: 'Updates', value: String(updates.length) },
                  { label: 'Comments', value: String(comments.length) },
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl bg-zinc-50 p-3 text-center dark:bg-neutral-800">
                    <p className="text-lg font-extrabold text-zinc-900 dark:text-neutral-50 sm:text-xl">
                      {s.value}
                    </p>
                    <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:text-neutral-500">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Image (if no hero strip) */}
            {!petition.imageUrl && (
              <div className="overflow-hidden rounded-2xl bg-zinc-200 dark:bg-neutral-800">
                <Image
                  src="/globe.svg"
                  alt={petition.title}
                  width={1200}
                  height={500}
                  className="h-auto w-full object-cover"
                />
              </div>
            )}

            {/* Story */}
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 md:p-8">
              <h2 className="text-xl font-extrabold text-zinc-900 dark:text-neutral-50">
                The issue
              </h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-neutral-400">
                Support this campaign to move the issue from public frustration to visible action.
              </p>
              <div className="mt-4 text-sm leading-relaxed text-zinc-700 dark:text-neutral-300 sm:text-base">
                {petition.description.split('\n').map(renderDescriptionLine)}
              </div>
            </div>

            <PetitionGovernmentPanel
              petitionId={petition.id}
              petitionTitle={petition.title}
              signaturesCount={petition.signaturesCount}
            />

            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 md:p-8">
              <PetitionMilestones
                petitionId={petition.id}
                currentSignatures={petition.signaturesCount}
                goal={petition.goal}
              />
            </div>

            {/* Updates */}
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 md:p-8">
              <h2 className="text-xl font-extrabold text-zinc-900 dark:text-neutral-50">
                Updates
                {updates.length > 0 && (
                  <span className="ml-2 rounded-full bg-emerald-100 px-2.5 py-0.5 text-sm font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    {updates.length}
                  </span>
                )}
              </h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-neutral-400">
                Campaign owner posts major developments here.
              </p>
              {updates.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-zinc-200 p-6 text-center dark:border-neutral-700">
                  <p className="text-sm text-zinc-400 dark:text-neutral-500">
                    No updates yet. Check back as the campaign grows.
                  </p>
                </div>
              ) : (
                <ul className="mt-4 space-y-4">
                  {updates.map((u) => (
                    <li
                      key={u.id}
                      className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4 dark:border-neutral-800 dark:bg-neutral-800"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-bold text-zinc-900 dark:text-neutral-50">{u.title}</p>
                        <time className="shrink-0 text-xs text-zinc-400 dark:text-neutral-500">
                          {new Date(u.createdAt).toLocaleDateString('en-LR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </time>
                      </div>
                      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-zinc-600 dark:text-neutral-400">
                        {u.body}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Comments */}
            <CommentForm petitionId={petition.id} initialComments={comments} />
          </div>

          {/* RIGHT — sign form (sticky) */}
          <aside className="md:sticky md:top-20 md:self-start">
            <SignForm
              petitionId={petition.id}
              signatureCount={petition.signaturesCount}
              goal={petition.goal}
            />
          </aside>
        </div>
      </div>
    </main>
  );
}
