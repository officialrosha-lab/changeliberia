'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../../lib/api';
import { Card } from '../ui/card';

type Supporter = {
  id: string;
  email: string | null;
  phone: string | null;
  source: string;
  joinedAt: string;
  unsubscribed: boolean;
};

type SupporterStats = {
  total: number;
  withEmail: number;
  withPhone: number;
  unsubscribed: number;
};

const PAGE_SIZE = 25;

export function AdminSupportersPanel() {
  const [stats, setStats] = useState<SupporterStats | null>(null);
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<SupporterStats>('/admin/supporters/stats')
      .then(setStats)
      .catch(() => {
        /* stats are supplementary — table still loads without them */
      });
  }, [sendResult]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      skip: String(page * PAGE_SIZE),
      take: String(PAGE_SIZE),
    });
    if (search.trim()) params.set('search', search.trim());

    apiGet<{ supporters: Supporter[]; total: number }>(`/admin/supporters?${params}`)
      .then((data) => {
        setSupporters(data.supporters);
        setTotal(data.total);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load supporters'))
      .finally(() => setLoading(false));
  }, [page, search]);

  async function handleSend() {
    setSending(true);
    setSendError(null);
    try {
      const result = await apiPost<{ recipientCount: number; successCount: number; failedCount: number }>(
        '/admin/supporters/broadcast',
        { subject, message },
      );
      setSendResult(
        `Sent to ${result.successCount} of ${result.recipientCount} supporters${result.failedCount ? ` (${result.failedCount} failed)` : ''}.`,
      );
      setSubject('');
      setMessage('');
      setConfirming(false);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Failed to send update');
    } finally {
      setSending(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total supporters', value: stats?.total },
          { label: 'With email', value: stats?.withEmail },
          { label: 'With phone', value: stats?.withPhone },
          { label: 'Unsubscribed', value: stats?.unsubscribed },
        ].map(({ label, value }) => (
          <Card key={label} rounded="xl" className="p-4">
            <p className="text-xs font-medium text-zinc-500 dark:text-neutral-400">{label}</p>
            <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-neutral-50">{value ?? '—'}</p>
          </Card>
        ))}
      </div>

      {/* Send update */}
      <Card rounded="2xl" className="p-5">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-neutral-50">Send an update</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-neutral-400">
          Emails every supporter who left an address and hasn&apos;t unsubscribed
          {stats ? ` — ${stats.withEmail - stats.unsubscribed} right now` : ''}. Each email includes an unsubscribe link.
        </p>

        <div className="mt-4 space-y-3">
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            maxLength={200}
            className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your update here. Blank lines start a new paragraph."
            rows={6}
            maxLength={20000}
            className="w-full resize-none rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
          />
        </div>

        {sendError && (
          <p className="mt-3 text-sm font-medium text-red-600 dark:text-red-400">{sendError}</p>
        )}
        {sendResult && (
          <p className="mt-3 text-sm font-medium text-emerald-700 dark:text-emerald-400">{sendResult}</p>
        )}

        <div className="mt-4 flex items-center gap-3">
          {!confirming ? (
            <button
              type="button"
              disabled={!subject.trim() || !message.trim()}
              onClick={() => setConfirming(true)}
              className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-500 dark:hover:bg-emerald-400"
            >
              Review &amp; send
            </button>
          ) : (
            <>
              <p className="text-sm font-medium text-zinc-700 dark:text-neutral-300">
                Send to {stats ? Math.max(stats.withEmail - stats.unsubscribed, 0) : '…'} supporters?
              </p>
              <button
                type="button"
                onClick={handleSend}
                disabled={sending}
                className="rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? 'Sending…' : 'Confirm send'}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={sending}
                className="rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </Card>

      {/* Supporter list */}
      <Card rounded="2xl" className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-neutral-50">Supporters</h2>
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search email or phone…"
            className="w-64 rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
          />
        </div>

        {error && <p className="mt-4 text-sm font-medium text-red-600 dark:text-red-400">{error}</p>}

        <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-200 dark:border-neutral-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-neutral-800 dark:bg-neutral-900">
                <th className="px-4 py-3 text-left font-semibold text-zinc-700 dark:text-neutral-300">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-700 dark:text-neutral-300">Phone</th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-700 dark:text-neutral-300">Source</th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-700 dark:text-neutral-300">Joined</th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-700 dark:text-neutral-300">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-500 dark:text-neutral-400">
                    Loading…
                  </td>
                </tr>
              ) : supporters.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-500 dark:text-neutral-400">
                    No supporters found
                  </td>
                </tr>
              ) : (
                supporters.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-zinc-200 hover:bg-zinc-50 dark:border-neutral-800 dark:hover:bg-neutral-800/30"
                  >
                    <td className="px-4 py-3 text-zinc-900 dark:text-neutral-100">{s.email || '—'}</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-neutral-400">{s.phone || '—'}</td>
                    <td className="px-4 py-3 text-xs text-zinc-500 dark:text-neutral-500">{s.source}</td>
                    <td className="px-4 py-3 text-xs text-zinc-500 dark:text-neutral-500">
                      {new Date(s.joinedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {s.unsubscribed ? (
                        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-neutral-800 dark:text-neutral-400">
                          Unsubscribed
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                          Subscribed
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-zinc-600 dark:text-neutral-400">
          <span>
            Page {page + 1} of {totalPages} ({total} total)
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded-full border border-zinc-300 px-4 py-1.5 font-medium hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="rounded-full border border-zinc-300 px-4 py-1.5 font-medium hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              Next
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
