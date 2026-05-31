import { apiGet } from '../../../lib/api';
import PollDetailClient from './PollDetailClient';

type PollDetails = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category?: string | null;
  county?: string | null;
  totalVotes: number;
  status: string;
  expiresAt: string;
  options: Array<{ id: string; text: string; voteCount: number }>;
};

export default async function PollDetailPage({ params }: { params: { slug: string } }) {
  const poll = await apiGet<PollDetails>(`/polls/slug/${params.slug}`).catch(() => null);

  if (!poll) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 text-center text-zinc-600 dark:text-zinc-300">
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-white">Poll not found</h1>
        <p className="mt-4">The poll you requested cannot be found or has been removed.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <PollDetailClient initialPoll={poll} />
    </main>
  );
}
