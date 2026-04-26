'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '../../lib/api';
import { useAuthStore } from '../../lib/store';

interface PlatformStats {
  totalUsers: number;
  totalPetitions: number;
  totalSignatures: number;
  approvalRate: number;
  avgSignaturesPerPetition: number;
  petitionsThisMonth: number;
  signaturesThisMonth: number;
}

interface DailyMetric {
  date: string;
  petitions: number;
  signatures: number;
  users: number;
}

interface CategoryStats {
  category: string;
  petitions: number;
  signatures: number;
}

interface FraudStats {
  flaggedAccounts: number;
  flaggedSignatures: number;
  blockedIPs: number;
  suspiciousActivity: number;
}

export function GlobalAnalytics() {
  const token = useAuthStore((s) => s.token);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [daily, setDaily] = useState<DailyMetric[]>([]);
  const [categories, setCategories] = useState<CategoryStats[]>([]);
  const [fraud, setFraud] = useState<FraudStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    if (!token) return;
    loadAnalytics();
  }, [token, period]);

  async function loadAnalytics() {
    try {
      setLoading(true);
      const [s, d, c, f] = await Promise.all([
        apiGet<PlatformStats>(`/analytics/platform-stats?days=${period}`, token!),
        apiGet<DailyMetric[]>(`/analytics/daily-metrics?days=${period}`, token!),
        apiGet<CategoryStats[]>(`/analytics/category-stats?days=${period}`, token!),
        apiGet<FraudStats>(`/analytics/fraud-stats?days=${period}`, token!),
      ]);
      setStats(s);
      setDaily(d);
      setCategories(c);
      setFraud(f);
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
      {/* Period Selector */}
      <div className="flex gap-2">
        {[7, 30, 90, 365].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              period === p
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-200 text-zinc-900 hover:bg-zinc-300'
            }`}
          >
            {p === 365 ? 'Year' : `${p}d`}
          </button>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Main Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
            <p className="text-sm text-blue-700 font-semibold">Total Users</p>
            <p className="text-3xl font-bold text-blue-900 mt-2">{stats.totalUsers}</p>
            <p className="text-xs text-blue-600 mt-1">
              {stats.totalUsers > 0 ? `+${stats.totalUsers}` : 'No users'}
            </p>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-lg p-6">
            <p className="text-sm text-emerald-700 font-semibold">Total Petitions</p>
            <p className="text-3xl font-bold text-emerald-900 mt-2">{stats.totalPetitions}</p>
            <p className="text-xs text-emerald-600 mt-1">
              {stats.petitionsThisMonth} this month
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6">
            <p className="text-sm text-purple-700 font-semibold">Total Signatures</p>
            <p className="text-3xl font-bold text-purple-900 mt-2">{stats.totalSignatures}</p>
            <p className="text-xs text-purple-600 mt-1">
              {stats.signaturesThisMonth} this month
            </p>
          </div>
        </div>
      )}

      {/* Secondary Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-zinc-200 rounded-lg p-4">
            <p className="text-sm text-zinc-600 font-semibold">Approval Rate</p>
            <p className="text-2xl font-bold mt-2">
              {(stats.approvalRate * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-zinc-500 mt-1">of pending petitions</p>
          </div>

          <div className="bg-white border border-zinc-200 rounded-lg p-4">
            <p className="text-sm text-zinc-600 font-semibold">Avg Signatures</p>
            <p className="text-2xl font-bold mt-2">
              {stats.avgSignaturesPerPetition.toFixed(0)}
            </p>
            <p className="text-xs text-zinc-500 mt-1">per petition</p>
          </div>

          <div className="bg-white border border-zinc-200 rounded-lg p-4">
            <p className="text-sm text-zinc-600 font-semibold">Growth</p>
            <p className="text-2xl font-bold text-emerald-600 mt-2">↑ {period}d</p>
            <p className="text-xs text-zinc-500 mt-1">trending up</p>
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      {categories && categories.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-lg p-6">
          <h3 className="font-semibold text-lg mb-4">Top Categories</h3>
          <div className="space-y-3">
            {categories.slice(0, 10).map((cat, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="flex-1">
                  <p className="font-medium">{cat.category}</p>
                  <p className="text-xs text-zinc-600">
                    {cat.petitions} petitions • {cat.signatures} signatures
                  </p>
                </div>
                <div className="text-right">
                  <div className="w-24 h-2 bg-zinc-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500"
                      style={{
                        width: `${(cat.petitions / Math.max(...categories.map((c) => c.petitions))) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fraud Stats */}
      {fraud && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="font-semibold text-lg text-red-900 mb-4">Security & Fraud Detection</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded border border-red-200">
              <p className="text-sm text-red-700 font-semibold">Flagged Accounts</p>
              <p className="text-2xl font-bold text-red-900 mt-2">{fraud.flaggedAccounts}</p>
            </div>

            <div className="bg-white p-4 rounded border border-red-200">
              <p className="text-sm text-red-700 font-semibold">Flagged Signatures</p>
              <p className="text-2xl font-bold text-red-900 mt-2">{fraud.flaggedSignatures}</p>
            </div>

            <div className="bg-white p-4 rounded border border-red-200">
              <p className="text-sm text-red-700 font-semibold">Blocked IPs</p>
              <p className="text-2xl font-bold text-red-900 mt-2">{fraud.blockedIPs}</p>
            </div>

            <div className="bg-white p-4 rounded border border-red-200">
              <p className="text-sm text-red-700 font-semibold">Suspicious Activity</p>
              <p className="text-2xl font-bold text-red-900 mt-2">{fraud.suspiciousActivity}</p>
            </div>
          </div>
        </div>
      )}

      {/* Daily Trends */}
      {daily && daily.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-lg p-6">
          <h3 className="font-semibold text-lg mb-4">Daily Activity</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Date</th>
                  <th className="px-4 py-2 text-right font-semibold">Petitions</th>
                  <th className="px-4 py-2 text-right font-semibold">Signatures</th>
                  <th className="px-4 py-2 text-right font-semibold">New Users</th>
                </tr>
              </thead>
              <tbody>
                {daily.slice(-14).map((d) => (
                  <tr key={d.date} className="border-b border-zinc-200 hover:bg-zinc-50">
                    <td className="px-4 py-2">{new Date(d.date).toLocaleDateString()}</td>
                    <td className="px-4 py-2 text-right font-medium">{d.petitions}</td>
                    <td className="px-4 py-2 text-right font-medium">{d.signatures}</td>
                    <td className="px-4 py-2 text-right font-medium">{d.users}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
