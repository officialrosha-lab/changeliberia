'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiPost } from '../../../lib/api';
import { usePollSocket } from '../../../lib/use-poll-socket';

type PollOption = {
  id: string;
  text: string;
  imageUrl?: string;
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

const CATEGORY_COLORS: Record<string, string> = {
  Infrastructure:   'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  Education:        'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  Health:           'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  Governance:       'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  Agriculture:      'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  'Youth & Jobs':   'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  Environment:      'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
  'Women & Gender': 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300',
  'Human Rights':   'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
};

function closesIn(expiresAt: string): { text: string; urgent: boolean } {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms < 0) return { text: 'Closed', urgent: false };
  const days = Math.floor(ms / 86_400_000);
  if (days > 1) return { text: `Closes in ${days} days`, urgent: false };
  const hours = Math.floor(ms / 3_600_000);
  if (hours > 0) return { text: `Closes in ${hours}h`, urgent: true };
  return { text: 'Closes soon', urgent: true };
}

export default function PollDetailClient({ initialPoll }: { initialPoll: PollDetails }) {
  const [poll, setPoll] = useState<PollDetails>(initialPoll);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [votedOptionId, setVotedOptionId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
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

  const hasImages = poll.options.some((o) => o.imageUrl);
  const isActive = poll.status === 'ACTIVE';
  const categoryColor = CATEGORY_COLORS[poll.category ?? ''] ?? 'bg-zinc-100 text-zinc-700 dark:bg-neutral-800 dark:text-neutral-300';
  const expiry = closesIn(poll.expiresAt);

  async function handleVote(optionId: string) {
    if (votedOptionId || !isActive) return;
    setError(null);
    setSubmitting(true);
    try {
      await apiPost(`/polls/${poll.id}/vote`, { optionId });
      setVotedOptionId(optionId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Vote failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  }

  return (
    <section className="space-y-6">
      {/* Poll header */}
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        {/* Pills row */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${categoryColor}`}>
            {poll.category ?? 'General'}
          </span>
          {poll.county && (
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700 dark:bg-neutral-800 dark:text-neutral-300">
              {poll.county}
            </span>
          )}
          {!isActive && (
            <span className="rounded-full bg-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-600 dark:bg-neutral-700 dark:text-neutral-400">
              Closed
            </span>
          )}
        </div>

        <h1 className="text-3xl font-extrabold leading-tight text-zinc-900 dark:text-white">{poll.title}</h1>

        {poll.description && (
          <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{poll.description}</p>
        )}

        {/* Stats + share row */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
            <span>🗳 {poll.totalVotes.toLocaleString()} votes</span>
            <span className={expiry.urgent ? 'font-semibold text-orange-600 dark:text-orange-400' : ''}>
              {expiry.text}
            </span>
          </div>
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
          >
            {copied ? (
              <>
                <svg className="h-3.5 w-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                </svg>
                Share
              </>
            )}
          </button>
        </div>
      </div>

      {/* Voting hint */}
      {isActive && !votedOptionId && (
        <p className="text-center text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Select an option below to cast your vote
        </p>
      )}
      {votedOptionId && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          Thanks for voting! Results update in real time.
        </div>
      )}

      {/* Options */}
      {hasImages ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {sortedOptions.map((option) => {
            const percentage = poll.totalVotes > 0 ? Math.round((option.voteCount / poll.totalVotes) * 100) : 0;
            const isVoted = votedOptionId === option.id;
            const canVote = isActive && !votedOptionId && !submitting;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleVote(option.id)}
                disabled={!canVote}
                className={`group relative flex flex-col overflow-hidden rounded-3xl border text-left transition-all
                  ${isVoted
                    ? 'border-emerald-500 ring-2 ring-emerald-300 dark:ring-emerald-700'
                    : canVote
                      ? 'border-zinc-200 hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-lg dark:border-neutral-800'
                      : 'border-zinc-200 dark:border-neutral-800'
                  }
                  bg-white shadow-sm dark:bg-neutral-950 disabled:cursor-not-allowed`}
              >
                {/* Image */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100 dark:bg-neutral-800">
                  {option.imageUrl ? (
                    <img
                      src={option.imageUrl}
                      alt={option.text}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-zinc-300 dark:text-neutral-600">
                      <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 18h16.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  )}
                  {isVoted && (
                    <div className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 shadow">
                      <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Text + bar */}
                <div className="flex flex-col gap-2 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-zinc-900 dark:text-white">{option.text}</span>
                    <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{percentage}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-neutral-800">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{option.voteCount.toLocaleString()} votes</p>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {sortedOptions.map((option) => {
            const percentage = poll.totalVotes > 0 ? Math.round((option.voteCount / poll.totalVotes) * 100) : 0;
            const isVoted = votedOptionId === option.id;
            const canVote = isActive && !votedOptionId && !submitting;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleVote(option.id)}
                disabled={!canVote}
                className={`w-full rounded-2xl border p-4 text-left transition-all
                  ${isVoted
                    ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200 dark:border-emerald-700 dark:bg-emerald-950 dark:ring-emerald-800'
                    : canVote
                      ? 'border-zinc-200 bg-zinc-50 hover:border-emerald-400 hover:bg-emerald-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-emerald-600'
                      : 'border-zinc-200 bg-zinc-50 dark:border-neutral-800 dark:bg-neutral-900'
                  }
                  disabled:cursor-not-allowed`}
              >
                <div className="flex items-center justify-between gap-4 mb-2">
                  <span className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-white">
                    {isVoted && (
                      <svg className="h-4 w-4 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                    {option.text}
                  </span>
                  <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex-shrink-0">{percentage}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-neutral-700">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">{option.voteCount.toLocaleString()} votes</p>
              </button>
            );
          })}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}
    </section>
  );
}
