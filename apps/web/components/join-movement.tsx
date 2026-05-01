'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost, apiDelete } from '../lib/api';
import { useAuthStore } from '../lib/store';

type MemberStatus = { id: string; role: string; joinedAt: string } | null;

export function JoinMovement() {
  const token = useAuthStore((s) => s.token);
  const [count, setCount] = useState<number | null>(null);
  const [status, setStatus] = useState<MemberStatus>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void apiGet<{ count: number }>('/membership/count')
      .then((d) => setCount(d.count))
      .catch(() => null);

    if (token) {
      void apiGet<MemberStatus>('/membership/me', token)
        .then((d) => setStatus(d))
        .catch(() => null);
    }
  }, [token]);

  async function join() {
    if (!token) {
      window.location.href = '/auth/login';
      return;
    }
    setLoading(true);
    try {
      const m = await apiPost<{ id: string; role: string; joinedAt: string }>(
        '/membership/join',
        { role: 'supporter' },
        token,
      );
      setStatus(m);
      setCount((c) => (c ?? 0) + 1);
    } finally {
      setLoading(false);
    }
  }

  async function leave() {
    if (!token) return;
    setLoading(true);
    try {
      await apiDelete('/membership/leave', token);
      setStatus(null);
      setCount((c) => Math.max((c ?? 1) - 1, 0));
    } finally {
      setLoading(false);
    }
  }

  const isMember = Boolean(status);

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl dark:bg-emerald-950">
          ✊
        </div>
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-neutral-50">
            Join the Movement
          </h2>
          {count !== null && (
            <p className="text-sm text-zinc-500 dark:text-neutral-400">
              {count.toLocaleString()} member{count !== 1 ? 's' : ''} in solidarity
            </p>
          )}
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-neutral-400">
        Stand with Liberians who believe in civic accountability. Joining the movement means
        you support the mission of verified, transparent petitioning for real change.
      </p>

      {isMember ? (
        <div className="mt-5 space-y-3">
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <span>✅</span>
            You are a member — thank you for your solidarity.
          </div>
          <button
            type="button"
            onClick={leave}
            disabled={loading}
            className="text-xs text-zinc-400 underline hover:text-zinc-600 dark:text-neutral-500 dark:hover:text-neutral-300"
          >
            Leave movement
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={join}
          disabled={loading}
          className="mt-5 w-full rounded-2xl bg-emerald-600 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60 dark:bg-emerald-500 dark:hover:bg-emerald-400"
        >
          {loading ? 'Joining…' : 'Join in solidarity'}
        </button>
      )}
    </div>
  );
}
