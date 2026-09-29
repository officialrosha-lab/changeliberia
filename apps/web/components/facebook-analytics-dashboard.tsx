'use client';

import { useEffect, useState } from 'react';

type Analytics = {
  totalShares: number;
  clicks: number;
  conversions: number;
  conversionRate: number;
  reachEstimate: number;
  topSharers: Array<{
    userId: string;
    shareCount: number;
    conversionCount: number;
  }>;
};

type PixelAnalytics = {
  totalEvents: number;
  totalConversions: number;
  totalConversionValue: number;
};

type Props = {
  petitionId: string;
  isOwner?: boolean;
};

export function FacebookAnalyticsDashboard({ petitionId, isOwner = false }: Props) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [pixelAnalytics, setPixelAnalytics] = useState<PixelAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Fetch Facebook share analytics
        const fbRes = await fetch(`/api/facebook/analytics/${petitionId}`, {
          headers: isOwner ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {},
        });

        if (fbRes.ok) {
          const { data } = await fbRes.json();
          setAnalytics(data);
        }

        // Fetch pixel analytics
        const pixelRes = await fetch(`/api/facebook/pixel-report?petitionId=${petitionId}`);
        if (pixelRes.ok) {
          const { data } = await pixelRes.json();
          setPixelAnalytics(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [petitionId, isOwner]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-24 bg-zinc-200 dark:bg-neutral-800 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (error && !analytics) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
        Failed to load analytics
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-6 text-center dark:border-neutral-700 dark:bg-neutral-900">
        <p className="text-sm text-zinc-600 dark:text-neutral-300">No analytics data available yet</p>
        <p className="text-xs text-zinc-500 mt-1 dark:text-neutral-400">Start sharing to see your viral metrics!</p>
      </div>
    );
  }

  const StatCard = ({ 
    label, 
    value, 
    icon, 
    subtext,
    color = 'blue'
  }: {
    label: string;
    value: string | number;
    icon: string;
    subtext?: string;
    color?: string;
  }) => {
    const colorClasses = {
      blue: 'bg-blue-50 border-blue-200 dark:bg-blue-900/40 dark:border-blue-800',
      green: 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800',
      purple: 'bg-purple-50 border-purple-200 dark:bg-purple-950/30 dark:border-purple-800',
      orange: 'bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800',
    };

    return (
      <div className={`rounded-lg border-2 p-4 ${colorClasses[color as keyof typeof colorClasses]}`}>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{icon}</span>
          <div>
            <p className="text-xs font-semibold text-zinc-600 dark:text-neutral-300">{label}</p>
            <p className="text-2xl font-bold text-zinc-900 mt-0.5 dark:text-white">{value}</p>
            {subtext && <p className="text-xs text-zinc-600 mt-0.5 dark:text-neutral-400">{subtext}</p>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div>
        <h3 className="font-semibold text-sm mb-3">Share Performance</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="Total Shares"
            value={analytics.totalShares}
            icon="📤"
            color="blue"
          />
          <StatCard
            label="Clicks"
            value={analytics.clicks}
            icon="👆"
            subtext={`${Math.round((analytics.clicks / Math.max(analytics.totalShares, 1)) * 100)}% CTR`}
            color="green"
          />
          <StatCard
            label="Conversions"
            value={analytics.conversions}
            icon="✓"
            subtext={`${Math.round(analytics.conversionRate)}% rate`}
            color="purple"
          />
          <StatCard
            label="Reach"
            value={Math.round(analytics.reachEstimate)}
            icon="🌐"
            subtext="estimated"
            color="orange"
          />
        </div>
      </div>

      {/* Pixel Data */}
      {pixelAnalytics && (
        <div>
          <h3 className="font-semibold text-sm mb-3">Pixel Tracking</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard
              label="Tracked Events"
              value={pixelAnalytics.totalEvents}
              icon="📊"
              color="blue"
            />
            <StatCard
              label="Pixel Conversions"
              value={pixelAnalytics.totalConversions}
              icon="💰"
              color="green"
            />
            <StatCard
              label="Conversion Value"
              value={Math.round(pixelAnalytics.totalConversionValue)}
              icon="📈"
              subtext="Trust Points"
              color="purple"
            />
          </div>
        </div>
      )}

      {/* Top Sharers */}
      {analytics.topSharers && analytics.topSharers.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm mb-3">Top Sharers</h3>
          <div className="space-y-2">
            {analytics.topSharers.slice(0, 5).map((sharer, idx) => (
              <div
                key={idx}
                className="rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 p-3 flex items-center justify-between dark:from-blue-950/30 dark:to-purple-950/30 dark:border-blue-800"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">#{idx + 1}</span>
                  <div>
                    <p className="font-semibold text-sm text-zinc-900 dark:text-white">
                      {isOwner ? sharer.userId : `User ${idx + 1}`}
                    </p>
                    <p className="text-xs text-zinc-600 dark:text-neutral-400">
                      {sharer.shareCount} share{sharer.shareCount !== 1 ? 's' : ''}, {sharer.conversionCount} conversion{sharer.conversionCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <span className="text-2xl">
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/40">
        <p className="font-semibold text-sm text-blue-900 dark:text-blue-200">💡 Insights</p>
        <ul className="mt-2 space-y-1 text-xs text-blue-800 dark:text-blue-300">
          {analytics.conversionRate > 15 && (
            <li>✓ Your petition has a strong conversion rate! Keep sharing.</li>
          )}
          {analytics.totalShares > 50 && (
            <li>✓ You&apos;re a share expert! You&apos;ve reached viral status.</li>
          )}
          {Math.round((analytics.clicks / Math.max(analytics.totalShares, 1)) * 100) > 20 && (
            <li>✓ High engagement! Your shares are getting noticed.</li>
          )}
          {analytics.reachEstimate > 1000 && (
            <li>✓ Massive reach! Your network is actively engaged.</li>
          )}
          {analytics.totalShares === 0 && (
            <li>👉 Start sharing to build viral momentum and reach more people.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
