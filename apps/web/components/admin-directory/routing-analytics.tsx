'use client';

import { useEffect, useState } from 'react';
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
  petitionId: string;
  institutionId: string;
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

  useEffect(() => {
    if (!token) return;
    loadAnalytics();
  }, [token, days]);

  async function loadAnalytics() {
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
  }

  if (loading) {
    return <div className="text-center py-8">Loading analytics...</div>;
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
                : 'bg-zinc-200 text-zinc-900 hover:bg-zinc-300'
            }`}
          >
            Last {d} days
          </button>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
            <p className="text-xs text-blue-700 font-semibold">Total Routed</p>
            <p className="text-2xl font-bold text-blue-900 mt-2">{stats.totalRouted}</p>
            <p className="text-xs text-blue-600 mt-1">petitions</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-lg p-4">
            <p className="text-xs text-emerald-700 font-semibold">Emails Sent</p>
            <p className="text-2xl font-bold text-emerald-900 mt-2">{stats.emailsSent}</p>
            <p className="text-xs text-emerald-600 mt-1">messages</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
            <p className="text-xs text-green-700 font-semibold">Delivered</p>
            <p className="text-2xl font-bold text-green-900 mt-2">{stats.emailsDelivered}</p>
            <p className="text-xs text-green-600 mt-1">confirmed</p>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-4">
            <p className="text-xs text-red-700 font-semibold">Failed</p>
            <p className="text-2xl font-bold text-red-900 mt-2">{stats.emailsFailed}</p>
            <p className="text-xs text-red-600 mt-1">bounced</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
            <p className="text-xs text-purple-700 font-semibold">Delivery Rate</p>
            <p className="text-2xl font-bold text-purple-900 mt-2">
              {(stats.deliveryRate * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-purple-600 mt-1">success rate</p>
          </div>
        </div>
      )}

      {/* Routing Events Table */}
      <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
        <div className="px-6 py-4 bg-zinc-50 border-b border-zinc-200">
          <h3 className="font-semibold text-lg">Recent Routing Events</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Petition</th>
                <th className="px-4 py-3 text-left font-semibold">Decision</th>
                <th className="px-4 py-3 text-left font-semibold">Email Status</th>
                <th className="px-4 py-3 text-left font-semibold">Tags</th>
                <th className="px-4 py-3 text-left font-semibold">Routed</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="border-b border-zinc-200 hover:bg-zinc-50">
                  <td className="px-4 py-3 font-medium text-blue-600">
                    {event.petitionId.slice(0, 8)}...
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                      {event.decision}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {event.emailDeliveredAt ? (
                      <span className="inline-block px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                        ✓ Delivered
                      </span>
                    ) : event.emailFailureReason ? (
                      <span className="inline-block px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">
                        ✗ Failed
                      </span>
                    ) : event.emailSentAt ? (
                      <span className="inline-block px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">
                        ⊙ Pending
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-1 text-xs rounded-full bg-zinc-100 text-zinc-700">
                        — Not sent
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {event.matchedTags.slice(0, 3).map((tag, i) => (
                        <span
                          key={i}
                          className="inline-block px-2 py-1 text-xs rounded bg-blue-100 text-blue-700"
                        >
                          {tag}
                        </span>
                      ))}
                      {event.matchedTags.length > 3 && (
                        <span className="text-xs text-zinc-600">
                          +{event.matchedTags.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-600">
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
