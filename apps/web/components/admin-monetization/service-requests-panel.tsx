'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiGet, apiPatch } from '../../lib/api';
import { useAuthStore } from '../../lib/store';

type ServiceRequestStatus =
  | 'SUBMITTED'
  | 'SCOPING'
  | 'QUOTED'
  | 'IN_PROGRESS'
  | 'DELIVERED'
  | 'CLOSED'
  | 'DECLINED';

interface ServiceRequest {
  id: string;
  title: string;
  description: string;
  status: ServiceRequestStatus;
  quotedAmount: string | null;
  currency: string;
  requester: { id: string; fullName: string; email: string | null };
  createdAt: string;
}

const STATUS_LABEL: Record<ServiceRequestStatus, string> = {
  SUBMITTED: 'Submitted',
  SCOPING: 'Scoping',
  QUOTED: 'Quoted',
  IN_PROGRESS: 'In progress',
  DELIVERED: 'Delivered',
  CLOSED: 'Closed',
  DECLINED: 'Declined',
};

const STATUS_STYLES: Record<ServiceRequestStatus, string> = {
  SUBMITTED: 'bg-zinc-100 text-zinc-600 dark:bg-neutral-800 dark:text-neutral-400',
  SCOPING: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  QUOTED: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  DELIVERED: 'bg-green-100 text-green-700 dark:bg-emerald-900 dark:text-emerald-300',
  CLOSED: 'bg-zinc-100 text-zinc-600 dark:bg-neutral-800 dark:text-neutral-400',
  DECLINED: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
};

// Mirrors ALLOWED_TRANSITIONS in apps/api/src/monetization/service-requests.service.ts
// — UI hinting only, the backend re-enforces this on every advance() call.
const ALLOWED_TRANSITIONS: Record<ServiceRequestStatus, ServiceRequestStatus[]> = {
  SUBMITTED: ['SCOPING', 'DECLINED'],
  SCOPING: ['QUOTED', 'DECLINED'],
  QUOTED: ['IN_PROGRESS', 'DECLINED'],
  IN_PROGRESS: ['DELIVERED'],
  DELIVERED: ['CLOSED'],
  CLOSED: [],
  DECLINED: [],
};

export function ServiceRequestsPanel() {
  const token = useAuthStore((s) => s.token);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [advancingId, setAdvancingId] = useState<string | null>(null);
  const [toStatus, setToStatus] = useState<ServiceRequestStatus | ''>('');
  const [note, setNote] = useState('');
  const [quotedAmount, setQuotedAmount] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await apiGet<ServiceRequest[]>('/admin/service-requests', token);
      setRequests(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load service requests');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  function startAdvance(requestId: string) {
    setAdvancingId(requestId);
    setToStatus('');
    setNote('');
    setQuotedAmount('');
  }

  async function handleAdvance(requestId: string) {
    if (!token || !toStatus) return;
    if (toStatus === 'QUOTED' && !quotedAmount.trim()) {
      setError('A quoted amount is required when moving to Quoted');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await apiPatch(
        `/admin/service-requests/${requestId}/advance`,
        {
          toStatus,
          note: note.trim() || undefined,
          quotedAmount: toStatus === 'QUOTED' ? Number(quotedAmount) : undefined,
        },
        token,
      );
      setAdvancingId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to advance request');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <div className="py-8 text-center dark:text-neutral-300">Loading Studio requests…</div>;
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-neutral-700 dark:bg-neutral-800">
            <tr>
              <th className="px-4 py-3 text-left font-semibold dark:text-white">Request</th>
              <th className="px-4 py-3 text-left font-semibold dark:text-white">Requester</th>
              <th className="px-4 py-3 text-left font-semibold dark:text-white">Status</th>
              <th className="px-4 py-3 text-left font-semibold dark:text-white">Quoted</th>
              <th className="px-4 py-3 text-left font-semibold dark:text-white">Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => {
              const nextOptions = ALLOWED_TRANSITIONS[req.status];
              return (
                <tr key={req.id} className="border-b border-zinc-200 dark:border-neutral-800">
                  <td className="px-4 py-3 font-medium dark:text-neutral-100">
                    {req.title}
                    <p className="mt-0.5 line-clamp-1 text-xs font-normal text-zinc-400 dark:text-neutral-500">
                      {req.description}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-neutral-300">
                    {req.requester.fullName}
                    {req.requester.email && (
                      <span className="block text-xs text-zinc-400 dark:text-neutral-500">
                        {req.requester.email}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-1 text-xs ${STATUS_STYLES[req.status]}`}>
                      {STATUS_LABEL[req.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 dark:text-neutral-300">
                    {req.quotedAmount ? `${req.currency} ${req.quotedAmount}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {nextOptions.length > 0 ? (
                      <button
                        onClick={() => startAdvance(req.id)}
                        className="font-medium text-emerald-600 hover:underline dark:text-emerald-400"
                      >
                        Advance
                      </button>
                    ) : (
                      <span className="text-zinc-400 dark:text-neutral-500">No actions</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {requests.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-500 dark:text-neutral-400">
                  No Studio requests yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {advancingId && (
        <div className="rounded-2xl border border-zinc-200 p-5 dark:border-neutral-700">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Advance request</h3>

          <div className="mt-3 flex flex-wrap gap-2">
            {ALLOWED_TRANSITIONS[requests.find((r) => r.id === advancingId)!.status].map((status) => (
              <button
                key={status}
                onClick={() => setToStatus(status)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  toStatus === status
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-100 text-zinc-600 dark:bg-neutral-800 dark:text-neutral-300'
                }`}
              >
                {STATUS_LABEL[status]}
              </button>
            ))}
          </div>

          {toStatus === 'QUOTED' && (
            <input
              type="number"
              min={0}
              placeholder="Quoted amount (USD)"
              value={quotedAmount}
              onChange={(e) => setQuotedAmount(e.target.value)}
              className="mt-3 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
            />
          )}

          <textarea
            placeholder="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="mt-3 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
          />

          <div className="mt-4 flex gap-2">
            <button
              disabled={busy || !toStatus}
              onClick={() => void handleAdvance(advancingId)}
              className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-500 dark:hover:bg-emerald-400"
            >
              {busy ? 'Saving…' : 'Confirm'}
            </button>
            <button
              onClick={() => setAdvancingId(null)}
              className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
