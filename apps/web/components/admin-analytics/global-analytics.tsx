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
    return <div className="text-center py-8 text-zinc-500 dark:text-neutral-400">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex gap-2">
        {[7, 30, 90, 365].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              period === p
                ? 'bg-emerald-600 dark:bg-emerald-500 text-white'
                : 'bg-zinc-100 dark:bg-neutral-800 text-zinc-700 dark:text-neutral-300 hover:bg-zinc-200 dark:hover:bg-neutral-700'
            }`}
          >
            {p === 365 ? 'Year' : `${p}d`}
          </button>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Main Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
            <p className="text-sm text-blue-700 dark:text-blue-300 font-semibold">Total Users</p>
            <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-2">{stats.totalUsers.toLocaleString()}</p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">all time</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/40 dark:to-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6">
            <p className="text-sm text-emerald-700 dark:text-emerald-300 font-semibold">Total Petitions</p>
            <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-100 mt-2">{stats.totalPetitions.toLocaleString()}</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
              +{stats.petitionsThisMonth} in last {period}d
            </p>
          </div>

          <div className="bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-950/40 dark:to-violet-900/30 border border-violet-200 dark:border-violet-800 rounded-2xl p-6">
            <p className="text-sm text-violet-700 dark:text-violet-300 font-semibold">Total Signatures</p>
            <p className="text-3xl font-bold text-violet-900 dark:text-violet-100 mt-2">{stats.totalSignatures.toLocaleString()}</p>
            <p className="text-xs text-violet-600 dark:text-violet-400 mt-1">
              +{stats.signaturesThisMonth} in last {period}d
            </p>
          </div>
        </div>
      )}

      {/* Secondary Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-neutral-900 border border-zinc-200 dark:border-neutral-700 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-neutral-400">Approval Rate</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-neutral-50 mt-2">
              {(stats.approvalRate * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-zinc-400 dark:text-neutral-500 mt-1">of petitions approved</p>
          </div>

          <div className="bg-white dark:bg-neutral-900 border border-zinc-200 dark:border-neutral-700 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-neutral-400">Avg Signatures</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-neutral-50 mt-2">
              {stats.avgSignaturesPerPetition.toFixed(0)}
            </p>
            <p className="text-xs text-zinc-400 dark:text-neutral-500 mt-1">per petition</p>
          </div>

          <div className="bg-white dark:bg-neutral-900 border border-zinc-200 dark:border-neutral-700 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-neutral-400">Period</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">Last {period}d</p>
            <p className="text-xs text-zinc-400 dark:text-neutral-500 mt-1">selected window</p>
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      {categories && categories.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 border border-zinc-200 dark:border-neutral-700 rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-base text-zinc-900 dark:text-neutral-50 mb-4">Top Categories</h3>
          <div className="space-y-3">
            {categories.slice(0, 10).map((cat, i) => (
              <div key={i} className="flex justify-between items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-zinc-800 dark:text-neutral-200 text-sm truncate">{cat.category}</p>
                  <p className="text-xs text-zinc-500 dark:text-neutral-400">
                    {cat.petitions} petitions · {cat.signatures.toLocaleString()} signatures
                  </p>
                </div>
                <div className="w-24 h-2 bg-zinc-100 dark:bg-neutral-700 rounded-full overflow-hidden shrink-0">
                  <div
                    className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full"
                    style={{
                      width: `${(cat.petitions / Math.max(...categories.map((c) => c.petitions), 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fraud Stats */}
      {fraud && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-2xl p-6">
          <h3 className="font-semibold text-base text-red-900 dark:text-red-300 mb-4">Security &amp; Fraud Detection</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Flagged Accounts', value: fraud.flaggedAccounts },
              { label: 'Flagged Signatures', value: fraud.flaggedSignatures },
              { label: 'Blocked IPs', value: fraud.blockedIPs },
              { label: 'Suspicious Activity', value: fraud.suspiciousActivity },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-red-200 dark:border-red-800">
                <p className="text-xs font-semibold text-red-700 dark:text-red-400">{label}</p>
                <p className="text-2xl font-bold text-red-900 dark:text-red-200 mt-1">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Trends */}
      {daily && daily.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 border border-zinc-200 dark:border-neutral-700 rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-base text-zinc-900 dark:text-neutral-50 mb-4">Daily Activity</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 dark:bg-neutral-800/50 border-b border-zinc-200 dark:border-neutral-700">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-neutral-400">Date</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-neutral-400">Petitions</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-neutral-400">Signatures</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-neutral-400">New Users</th>
                </tr>
              </thead>
              <tbody>
                {daily.slice(-14).map((d) => (
                  <tr key={d.date} className="border-b border-zinc-100 dark:border-neutral-800 hover:bg-zinc-50 dark:hover:bg-neutral-800/60 transition-colors">
                    <td className="px-4 py-2 text-zinc-700 dark:text-neutral-300">{new Date(d.date).toLocaleDateString()}</td>
                    <td className="px-4 py-2 text-right font-medium text-zinc-900 dark:text-neutral-50">{d.petitions}</td>
                    <td className="px-4 py-2 text-right font-medium text-zinc-900 dark:text-neutral-50">{d.signatures}</td>
                    <td className="px-4 py-2 text-right font-medium text-zinc-900 dark:text-neutral-50">{d.users}</td>
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
