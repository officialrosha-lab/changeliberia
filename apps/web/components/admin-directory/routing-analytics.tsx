'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiGet } from '../../lib/api';
import { useAuthStore } from '../../lib/store';

interface RoutingStats {
  totalRouted: number;
  emailsSent: number;
  emailsDelivered: number;
  emailsFailed: number;
  deliveryRate: number;
}

interface RoutingEvent {
  id: string;
  petitionId: string | null;
  institutionId: string | null;
  decision: string;
  emailSentAt: string | null;
  emailDeliveredAt: string | null;
  emailFailureReason: string | null;
  matchedTags: string[];
  notes: string;
}

export function RoutingAnalytics() {
  const token = useAuthStore((s) => s.token);
  const [stats, setStats] = useState<RoutingStats | null>(null);
  const [events, setEvents] = useState<RoutingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const [s, e] = await Promise.all([
        apiGet<RoutingStats>(`/admin/directory/routing/stats?days=${days}`, token!),
        apiGet<RoutingEvent[]>(`/admin/directory/routing/events?limit=50`, token!),
      ]);
      setStats(s);
      setEvents(e);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [days, token]);

  useEffect(() => {
    if (!token) return;
    loadAnalytics();
  }, [token, days, loadAnalytics]);

  if (loading) {
    return <div className="text-center py-8 dark:text-neutral-300">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Time Period Selector */}
      <div className="flex gap-2">
        {[7, 30, 90].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              days === d
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-200 text-zinc-900 hover:bg-zinc-300 dark:bg-neutral-700 dark:text-white dark:hover:bg-neutral-600'
            }`}
          >
            Last {d} days
          </button>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg dark:bg-red-950 dark:border-red-900 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4 dark:from-blue-950/40 dark:to-blue-900/20 dark:border-blue-900">
            <p className="text-xs text-blue-700 font-semibold dark:text-blue-300">Total Routed</p>
            <p className="text-2xl font-bold text-blue-900 mt-2 dark:text-blue-200">{stats.totalRouted}</p>
            <p className="text-xs text-blue-600 mt-1 dark:text-blue-400">petitions</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-lg p-4 dark:from-emerald-950/40 dark:to-emerald-900/20 dark:border-emerald-800">
            <p className="text-xs text-emerald-700 font-semibold dark:text-emerald-400">Emails Sent</p>
            <p className="text-2xl font-bold text-emerald-900 mt-2 dark:text-emerald-200">{stats.emailsSent}</p>
            <p className="text-xs text-emerald-600 mt-1 dark:text-emerald-400">messages</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4 dark:from-emerald-950/40 dark:to-emerald-900/20 dark:border-emerald-800">
            <p className="text-xs text-green-700 font-semibold dark:text-emerald-400">Delivered</p>
            <p className="text-2xl font-bold text-green-900 mt-2 dark:text-emerald-200">{stats.emailsDelivered}</p>
            <p className="text-xs text-green-600 mt-1 dark:text-emerald-400">confirmed</p>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-4 dark:from-red-950/40 dark:to-red-900/20 dark:border-red-900">
            <p className="text-xs text-red-700 font-semibold dark:text-red-400">Failed</p>
            <p className="text-2xl font-bold text-red-900 mt-2 dark:text-red-300">{stats.emailsFailed}</p>
            <p className="text-xs text-red-600 mt-1 dark:text-red-400">bounced</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4 dark:from-purple-950/40 dark:to-purple-900/20 dark:border-purple-900">
            <p className="text-xs text-purple-700 font-semibold dark:text-purple-300">Delivery Rate</p>
            <p className="text-2xl font-bold text-purple-900 mt-2 dark:text-purple-200">
              {(stats.deliveryRate * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-purple-600 mt-1 dark:text-purple-400">success rate</p>
          </div>
        </div>
      )}

      {/* Routing Events Table */}
      <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden dark:bg-neutral-900 dark:border-neutral-700">
        <div className="px-6 py-4 bg-zinc-50 border-b border-zinc-200 dark:bg-neutral-800 dark:border-neutral-700">
          <h3 className="font-semibold text-lg dark:text-white">Recent Routing Events</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200 dark:bg-neutral-800 dark:border-neutral-700">
              <tr>
                <th className="px-4 py-3 text-left font-semibold dark:text-white">Petition</th>
                <th className="px-4 py-3 text-left font-semibold dark:text-white">Decision</th>
                <th className="px-4 py-3 text-left font-semibold dark:text-white">Email Status</th>
                <th className="px-4 py-3 text-left font-semibold dark:text-white">Tags</th>
                <th className="px-4 py-3 text-left font-semibold dark:text-white">Routed</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="border-b border-zinc-200 hover:bg-zinc-50 dark:border-neutral-800 dark:hover:bg-neutral-800">
                  <td className="px-4 py-3 font-medium text-blue-600 dark:text-blue-400">
                    {event.petitionId ? `${event.petitionId.slice(0, 8)}...` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 dark:bg-emerald-900 dark:text-emerald-300">
                      {event.decision}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {event.emailDeliveredAt ? (
                      <span className="inline-block px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 dark:bg-emerald-900 dark:text-emerald-300">
                        ✓ Delivered
                      </span>
                    ) : event.emailFailureReason ? (
                      <span className="inline-block px-2 py-1 text-xs rounded-full bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                        ✗ Failed
                      </span>
                    ) : event.emailSentAt ? (
                      <span className="inline-block px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700 dark:bg-amber-950/30 dark:text-amber-400">
                        ⊙ Pending
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-1 text-xs rounded-full bg-zinc-100 text-zinc-700 dark:bg-neutral-700 dark:text-neutral-200">
                        — Not sent
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {event.matchedTags.slice(0, 3).map((tag, i) => (
                        <span
                          key={i}
                          className="inline-block px-2 py-1 text-xs rounded bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                        >
                          {tag}
                        </span>
                      ))}
                      {event.matchedTags.length > 3 && (
                        <span className="text-xs text-zinc-600 dark:text-neutral-400">
                          +{event.matchedTags.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-600 dark:text-neutral-400">
                    {event.emailSentAt
                      ? new Date(event.emailSentAt).toLocaleDateString()
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
