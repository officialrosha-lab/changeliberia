'use client';

import { useEffect, useState } from 'react';
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
  const token = useAuthStore((s) => s.token);
  const [stats, setStats] = useState<ModeratorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    if (!token) return;
    loadStats();
  }, [token, period]);

  async function loadStats() {
    try {
      setLoading(true);
      const data = await apiGet<ModeratorStats>(
        `/moderator/stats?days=${period}`,
        token!
      );
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading stats...</div>;
  }

  if (!stats) {
    return <div className="text-center py-8 text-zinc-600">No stats available</div>;
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
                : 'bg-zinc-200 text-zinc-900 hover:bg-zinc-300'
            }`}
          >
            {p === 7 ? 'Week' : p === 30 ? 'Month' : '3 Months'}
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-lg p-6">
          <p className="text-sm text-emerald-700 font-semibold">Petitions Reviewed</p>
          <p className="text-3xl font-bold text-emerald-900 mt-2">{stats.petitionsReviewed}</p>
          <p className="text-xs text-emerald-600 mt-1">
            Avg {stats.averageReviewTime} min per petition
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
          <p className="text-sm text-blue-700 font-semibold">Approval Rate</p>
          <p className="text-3xl font-bold text-blue-900 mt-2">
            {(stats.approvalRate * 100).toFixed(1)}%
          </p>
          <p className="text-xs text-blue-600 mt-1">
            {stats.petitionsApproved} approved
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6">
          <p className="text-sm text-purple-700 font-semibold">Rejections</p>
          <p className="text-3xl font-bold text-purple-900 mt-2">{stats.petitionsRejected}</p>
          <p className="text-xs text-purple-600 mt-1">
            {((stats.petitionsRejected / stats.petitionsReviewed) * 100).toFixed(1)}% of reviewed
          </p>
        </div>
      </div>

      {/* Fraud Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <p className="text-sm text-orange-700 font-semibold">Fraud Flags Reviewed</p>
          <p className="text-2xl font-bold text-orange-900 mt-2">{stats.flagsReviewed}</p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-sm text-red-700 font-semibold">Flags Resolved</p>
          <p className="text-2xl font-bold text-red-900 mt-2">{stats.fraudFlagsResolved}</p>
          <p className="text-xs text-red-600 mt-1">
            {stats.flagsReviewed > 0
              ? ((stats.fraudFlagsResolved / stats.flagsReviewed) * 100).toFixed(1)
              : 0}
            % resolution rate
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white border border-zinc-200 rounded-lg p-6">
        <h3 className="font-semibold text-lg mb-4">Performance Summary</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center pb-3 border-b border-zinc-200">
            <span className="text-zinc-600">Total Petitions Processed</span>
            <span className="font-semibold">{stats.petitionsApproved + stats.petitionsRejected}</span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-zinc-200">
            <span className="text-zinc-600">Average Review Time</span>
            <span className="font-semibold">{stats.averageReviewTime} minutes</span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-zinc-200">
            <span className="text-zinc-600">Fraud Cases Handled</span>
            <span className="font-semibold">{stats.flagsReviewed}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-600">Cases Successfully Resolved</span>
            <span className="font-semibold text-green-600">{stats.fraudFlagsResolved}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
