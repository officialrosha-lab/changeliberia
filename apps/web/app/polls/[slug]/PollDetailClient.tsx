'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import Link from 'next/link';
import { apiPost } from '../../../lib/api';
import { usePollSocket } from '../../../lib/use-poll-socket';
import { useAuthStore } from '../../../lib/store';

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

const BAR_GRADIENTS = [
  'from-emerald-500 to-teal-400',
  'from-blue-500 to-cyan-400',
  'from-violet-500 to-purple-400',
  'from-orange-500 to-amber-400',
  'from-pink-500 to-rose-400',
  'from-indigo-500 to-blue-400',
];

function closesIn(expiresAt: string): { text: string; urgent: boolean } {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms < 0) return { text: 'Closed', urgent: false };
  const days = Math.floor(ms / 86_400_000);
  if (days > 1) return { text: `Closes in ${days} days`, urgent: false };
  const hours = Math.floor(ms / 3_600_000);
  if (hours > 0) return { text: `Closes in ${hours}h`, urgent: true };
  return { text: 'Closes soon', urgent: true };
}

// --- Auth Gate Modal ---
function VoteAuthModal({ onClose }: { onClose: () => void }) {
  const returnUrl = typeof window !== 'undefined' ? window.location.pathname : '';

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-sm rounded-3xl border border-zinc-200 bg-white p-8 shadow-2xl dark:border-neutral-700 dark:bg-neutral-900">
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Icon */}
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950">
          <svg className="h-8 w-8 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        </div>

        <h2 className="text-center text-xl font-extrabold text-zinc-900 dark:text-white">Sign in to vote</h2>
        <p className="mt-2 text-center text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Your vote matters. Create a free account or sign in to cast your vote and see live results.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <Link
            href={`/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98]"
          >
            Sign in
          </Link>
          <Link
            href={`/auth/signup?returnUrl=${encodeURIComponent(returnUrl)}`}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700"
          >
            Create free account
          </Link>
        </div>

        <p className="mt-4 text-center text-xs text-zinc-400 dark:text-zinc-600">
          You&apos;ll be returned to this poll after signing in.
        </p>
      </div>
    </div>
  );
}

// --- Animated bar (mounts at 0 → animates to target width) ---
function AnimatedBar({
  percentage,
  gradient,
  delay = 0,
  isVoted,
}: {
  percentage: number;
  gradient: string;
  delay?: number;
  isVoted: boolean;
}) {
  const [width, setWidth] = useState(0);
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current) {
      setWidth(percentage);
      return;
    }
    mounted.current = true;
    const t = setTimeout(() => setWidth(percentage), delay + 80);
    return () => clearTimeout(t);
  }, [percentage, delay]);

  return (
    <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-neutral-800">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-700 ease-out ${isVoted ? 'shadow-sm' : ''}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

// --- Animated vote count number ---
function CountUp({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    if (value === prev.current) return;
    const diff = value - prev.current;
    const steps = Math.min(Math.abs(diff), 12);
    let step = 0;
    const id = setInterval(() => {
      step++;
      setDisplay(Math.round(prev.current + (diff * step) / steps));
      if (step >= steps) {
        clearInterval(id);
        prev.current = value;
      }
    }, 40);
    return () => clearInterval(id);
  }, [value]);

  return <>{display.toLocaleString()}</>;
}

export default function PollDetailClient({ initialPoll }: { initialPoll: PollDetails }) {
  const [poll, setPoll] = useState<PollDetails>(initialPoll);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [votedOptionId, setVotedOptionId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const token = useAuthStore((s) => s.token);

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
  const isActive = poll.status === 'ACTIVE' || poll.status === 'APPROVED';
  const categoryColor = CATEGORY_COLORS[poll.category ?? ''] ?? 'bg-zinc-100 text-zinc-700 dark:bg-neutral-800 dark:text-neutral-300';
  const expiry = closesIn(poll.expiresAt);
  const maxVotes = Math.max(...poll.options.map((o) => o.voteCount), 1);

  async function handleVote(optionId: string) {
    if (votedOptionId || !isActive) return;
    if (!token) {
      setShowAuthModal(true);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await apiPost(`/polls/${poll.id}/vote`, { optionId }, token);
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
    <>
      {showAuthModal && <VoteAuthModal onClose={() => setShowAuthModal(false)} />}

      <section className="space-y-6">
        {/* Poll header */}
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${categoryColor}`}>
              {poll.category ?? 'General'}
            </span>
            {poll.county && (
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700 dark:bg-neutral-800 dark:text-neutral-300">
                {poll.county}
              </span>
            )}
            {isActive ? (
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Live
              </span>
            ) : (
              <span className="rounded-full bg-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-600 dark:bg-neutral-700 dark:text-neutral-400">
                Closed
              </span>
            )}
          </div>

          <h1 className="text-3xl font-extrabold leading-tight text-zinc-900 dark:text-white">{poll.title}</h1>

          {poll.description && (
            <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{poll.description}</p>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
                </svg>
                <CountUp value={poll.totalVotes} /> votes
              </span>
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

        {/* Voting hint / success */}
        {isActive && !votedOptionId && !token && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              <span className="font-semibold text-zinc-700 dark:text-zinc-200">Sign in to vote.</span>{' '}
              Your voice shapes Liberia&apos;s future.
            </p>
            <Link
              href={`/auth/login?returnUrl=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '')}`}
              className="flex-shrink-0 rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              Sign in
            </Link>
          </div>
        )}
        {isActive && !votedOptionId && token && (
          <p className="text-center text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Select an option below to cast your vote
          </p>
        )}
        {votedOptionId && (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-950">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 shadow">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
              Thanks for voting! Results update in real time.
            </p>
          </div>
        )}

        {/* Options — image grid layout */}
        {hasImages ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {sortedOptions.map((option, idx) => {
              const percentage = poll.totalVotes > 0 ? Math.round((option.voteCount / poll.totalVotes) * 100) : 0;
              const isVoted = votedOptionId === option.id;
              const isLeading = option.voteCount === maxVotes && poll.totalVotes > 0;
              const canVote = isActive && !votedOptionId && !submitting;
              const gradient = BAR_GRADIENTS[idx % BAR_GRADIENTS.length];
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleVote(option.id)}
                  disabled={!canVote && isActive}
                  className={`group relative flex flex-col overflow-hidden rounded-3xl border text-left transition-all duration-300
                    ${isVoted
                      ? 'border-emerald-500 ring-2 ring-emerald-300 dark:ring-emerald-700'
                      : canVote
                        ? 'border-zinc-200 hover:-translate-y-1 hover:border-emerald-400 hover:shadow-xl dark:border-neutral-800'
                        : 'border-zinc-200 dark:border-neutral-800'
                    }
                    bg-white shadow-sm dark:bg-neutral-950 disabled:cursor-not-allowed`}
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100 dark:bg-neutral-800">
                    {option.imageUrl ? (
                      <img
                        src={option.imageUrl}
                        alt={option.text}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-zinc-300 dark:text-neutral-600">
                        <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 18h16.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    )}
                    {isVoted && (
                      <div className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 shadow-lg">
                        <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </div>
                    )}
                    {isLeading && !isVoted && poll.totalVotes > 0 && (
                      <div className="absolute left-3 top-3 rounded-full bg-amber-400 px-2.5 py-0.5 text-[10px] font-bold text-amber-900 shadow">
                        Leading
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-zinc-900 dark:text-white">{option.text}</span>
                      <span className={`text-sm font-bold tabular-nums ${isVoted ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                        {percentage}%
                      </span>
                    </div>
                    <AnimatedBar
                      percentage={percentage}
                      gradient={gradient}
                      delay={idx * 80}
                      isVoted={isVoted}
                    />
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      <CountUp value={option.voteCount} /> votes
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          /* Text-only layout — richer chart */
          <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
            {sortedOptions.map((option, idx) => {
              const percentage = poll.totalVotes > 0 ? Math.round((option.voteCount / poll.totalVotes) * 100) : 0;
              const isVoted = votedOptionId === option.id;
              const isLeading = option.voteCount === maxVotes && poll.totalVotes > 0;
              const canVote = isActive && !votedOptionId && !submitting;
              const gradient = BAR_GRADIENTS[idx % BAR_GRADIENTS.length];
              const isLast = idx === sortedOptions.length - 1;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleVote(option.id)}
                  disabled={!canVote && isActive}
                  className={`group relative w-full p-5 text-left transition-all duration-200 disabled:cursor-not-allowed
                    ${!isLast ? 'border-b border-zinc-100 dark:border-neutral-800' : ''}
                    ${isVoted
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/40'
                      : canVote
                        ? 'hover:bg-zinc-50 dark:hover:bg-neutral-900'
                        : ''
                    }`}
                >
                  {/* Rank dot + text row */}
                  <div className="mb-3 flex items-center gap-3">
                    {/* Rank circle */}
                    <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold
                      ${isVoted
                        ? 'bg-emerald-500 text-white'
                        : isLeading && poll.totalVotes > 0
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                          : 'bg-zinc-100 text-zinc-500 dark:bg-neutral-800 dark:text-neutral-400'
                      }`}>
                      {isVoted
                        ? <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                        : idx + 1
                      }
                    </span>

                    <div className="flex flex-1 items-start justify-between gap-3 min-w-0">
                      <span className={`font-semibold leading-snug ${isVoted ? 'text-emerald-800 dark:text-emerald-300' : 'text-zinc-900 dark:text-white'}`}>
                        {option.text}
                      </span>
                      <div className="flex flex-shrink-0 flex-col items-end gap-0.5">
                        <span className={`text-lg font-extrabold tabular-nums leading-none ${isVoted ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-800 dark:text-zinc-200'}`}>
                          {percentage}%
                        </span>
                        {isLeading && poll.totalVotes > 0 && (
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                            leading
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Animated bar */}
                  <div className="ml-10">
                    <AnimatedBar
                      percentage={percentage}
                      gradient={gradient}
                      delay={idx * 100}
                      isVoted={isVoted}
                    />
                    <p className="mt-1.5 text-xs text-zinc-400 dark:text-zinc-500">
                      <CountUp value={option.voteCount} /> vote{option.voteCount !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Hover arrow (only when can vote) */}
                  {canVote && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100">
                      <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}

            {/* Total footer */}
            <div className="border-t border-zinc-100 px-5 py-3 dark:border-neutral-800">
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                <CountUp value={poll.totalVotes} /> total vote{poll.totalVotes !== 1 ? 's' : ''} · updates live
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}
      </section>
    </>
  );
}
