'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiPost } from '../../../lib/api';
import { usePollSocket } from '../../../lib/use-poll-socket';

type PollOption = {
  id: string;
  text: string;
  voteCount: number;
};

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
  options: PollOption[];
};

export default function PollDetailClient({ initialPoll }: { initialPoll: PollDetails }) {
  const [poll, setPoll] = useState<PollDetails>(initialPoll);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { onPollUpdate } = usePollSocket({ pollId: initialPoll.id });

  useEffect(() => {
    return onPollUpdate((update) => {
      if (update.pollId !== poll.id) return;
      setPoll((current) => ({
        ...current,
        totalVotes: update.totalVotes,
        options: current.options.map((option) => {
          const updatedOption = update.options.find((item) => item.id === option.id);
          return updatedOption ? { ...option, voteCount: updatedOption.voteCount } : option;
        }),
      }));
    });
  }, [onPollUpdate, poll.id]);

  const sortedOptions = useMemo(
    () => [...poll.options].sort((a, b) => b.voteCount - a.voteCount),
    [poll.options],
  );

  async function handleVote(optionId: string) {
    setError(null);
    setSubmitting(true);
    try {
      await apiPost(`/polls/${poll.id}/vote`, { optionId });
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('Vote failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="space-y-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300">
            {poll.status.toLowerCase()}
          </span>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {poll.category ?? 'General'} · {poll.county ?? 'Nationwide'}
          </span>
        </div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">{poll.title}</h1>
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{poll.description}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {sortedOptions.map((option) => {
          const percentage = poll.totalVotes > 0 ? Math.round((option.voteCount / poll.totalVotes) * 100) : 0;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleVote(option.id)}
              disabled={submitting || poll.status !== 'ACTIVE'}
              className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5 text-left transition hover:border-blue-500 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-blue-400"
            >
              <div className="flex items-center justify-between gap-4">
                <span className="font-semibold text-zinc-900 dark:text-white">{option.text}</span>
                <span className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{percentage}%</span>
              </div>
              <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">{option.voteCount.toLocaleString()} votes</p>
            </button>
          );
        })}
      </div>

      <div className="rounded-3xl bg-zinc-50 p-4 text-sm text-zinc-600 dark:bg-neutral-900 dark:text-zinc-300">
        <p>
          <strong>Total votes:</strong> {poll.totalVotes.toLocaleString()}
        </p>
        <p className="mt-2">
          <strong>Expires:</strong> {new Date(poll.expiresAt).toLocaleString()}
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      ) : null}
    </section>
  );
}
