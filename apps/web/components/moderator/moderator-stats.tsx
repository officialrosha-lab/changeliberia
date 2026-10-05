'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiGet } from '../../lib/api';
import { useAuthStore } from '../../lib/store';

interface ModeratorStats {
  petitionsReviewed: number;
  petitionsApproved: number;
  petitionsRejected: number;
  averageReviewTime: number;
  approvalRate: number;
  flagsReviewed: number;
  fraudFlagsResolved: number;
}

export function ModeratorStats() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [stats, setStats] = useState<ModeratorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState(30);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiGet<ModeratorStats>(
        `/moderator/stats?days=${period}`,
      );
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadStats();
  }, [isAuthenticated, period, loadStats]);

  if (loading) {
    return <div className="text-center py-8">Loading stats...</div>;
  }

  if (!stats) {
    return <div className="text-center py-8 text-zinc-600 dark:text-neutral-300">No stats available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex gap-2">
        {[7, 30, 90].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              period === p
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-200 text-zinc-900 hover:bg-zinc-300 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700'
            }`}
          >
            {p === 7 ? 'Week' : p === 30 ? 'Month' : '3 Months'}
          </button>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg dark:bg-red-950 dark:border-red-900 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-lg p-6 dark:from-emerald-950/30 dark:to-emerald-950/30 dark:border-emerald-800">
          <p className="text-sm text-emerald-700 font-semibold dark:text-emerald-400">Petitions Reviewed</p>
          <p className="text-3xl font-bold text-emerald-900 mt-2 dark:text-emerald-200">{stats.petitionsReviewed}</p>
          <p className="text-xs text-emerald-600 mt-1 dark:text-emerald-400">
            Avg {stats.averageReviewTime} min per petition
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6 dark:from-blue-950/30 dark:to-blue-950/30 dark:border-blue-900">
          <p className="text-sm text-blue-700 font-semibold dark:text-blue-400">Approval Rate</p>
          <p className="text-3xl font-bold text-blue-900 mt-2 dark:text-blue-200">
            {(stats.approvalRate * 100).toFixed(1)}%
          </p>
          <p className="text-xs text-blue-600 mt-1 dark:text-blue-400">
            {stats.petitionsApproved} approved
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6 dark:from-purple-950/30 dark:to-purple-950/30 dark:border-purple-900">
          <p className="text-sm text-purple-700 font-semibold dark:text-purple-400">Rejections</p>
          <p className="text-3xl font-bold text-purple-900 mt-2 dark:text-purple-200">{stats.petitionsRejected}</p>
          <p className="text-xs text-purple-600 mt-1 dark:text-purple-400">
            {((stats.petitionsRejected / stats.petitionsReviewed) * 100).toFixed(1)}% of reviewed
          </p>
        </div>
      </div>

      {/* Fraud Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 dark:bg-orange-950/30 dark:border-orange-900">
          <p className="text-sm text-orange-700 font-semibold dark:text-orange-400">Fraud Flags Reviewed</p>
          <p className="text-2xl font-bold text-orange-900 mt-2 dark:text-orange-200">{stats.flagsReviewed}</p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6 dark:bg-red-950 dark:border-red-900">
          <p className="text-sm text-red-700 font-semibold dark:text-red-400">Flags Resolved</p>
          <p className="text-2xl font-bold text-red-900 mt-2 dark:text-red-200">{stats.fraudFlagsResolved}</p>
          <p className="text-xs text-red-600 mt-1 dark:text-red-400">
            {stats.flagsReviewed > 0
              ? ((stats.fraudFlagsResolved / stats.flagsReviewed) * 100).toFixed(1)
              : 0}
            % resolution rate
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white border border-zinc-200 rounded-lg p-6 dark:bg-neutral-900 dark:border-neutral-700">
        <h3 className="font-semibold text-lg mb-4">Performance Summary</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center pb-3 border-b border-zinc-200 dark:border-neutral-700">
            <span className="text-zinc-600 dark:text-neutral-300">Total Petitions Processed</span>
            <span className="font-semibold">{stats.petitionsApproved + stats.petitionsRejected}</span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-zinc-200 dark:border-neutral-700">
            <span className="text-zinc-600 dark:text-neutral-300">Average Review Time</span>
            <span className="font-semibold">{stats.averageReviewTime} minutes</span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-zinc-200 dark:border-neutral-700">
            <span className="text-zinc-600 dark:text-neutral-300">Fraud Cases Handled</span>
            <span className="font-semibold">{stats.flagsReviewed}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-600 dark:text-neutral-300">Cases Successfully Resolved</span>
            <span className="font-semibold text-green-600 dark:text-green-400">{stats.fraudFlagsResolved}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
