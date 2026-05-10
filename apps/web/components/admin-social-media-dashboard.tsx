'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '../lib/api';
import { useAuthStore } from '../lib/store';

interface FacebookHealth {
  status: 'healthy' | 'degraded' | 'error';
  configured: Record<string, boolean>;
  pixelId: string;
  error?: string;
}

interface WhatsAppHealth {
  status: 'healthy' | 'degraded' | 'error';
  configured: Record<string, boolean>;
  phoneNumberId: string;
  error?: string;
}

interface GrowthMetrics {
  totalReferrals: number;
  convertedReferrals: number;
  conversionRate: string;
  fraudBlockedReferrals: number;
  trendingPetitions: Array<{ id: string; title: string }>;
  period: string;
}

interface PixelStats {
  totalEvents: number;
  uniqueEvents: number;
  eventBreakdown: Record<string, number>;
  period: string;
}

interface CampaignStats {
  statusBreakdown: Record<string, number>;
  topPetitions: number;
  totalCampaigns: number;
}

interface SocialMediaDashboard {
  facebook: FacebookHealth;
  whatsapp: WhatsAppHealth;
  metrics: {
    growth: GrowthMetrics;
    pixelEvents: PixelStats;
  };
  lastUpdated: string;
}

export function AdminSocialMediaDashboard() {
  const token = useAuthStore((s) => s.token);
  const [data, setData] = useState<SocialMediaDashboard | null>(null);
  const [campaignStats, setCampaignStats] = useState<CampaignStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'facebook' | 'whatsapp'>('overview');

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [dashboard, campaigns] = await Promise.all([
          apiGet<SocialMediaDashboard>('/admin/social-media/dashboard', token),
          apiGet<CampaignStats>('/admin/social-media/whatsapp/campaign-stats', token),
        ]);
        setData(dashboard);
        setCampaignStats(campaigns);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load social media data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [token]);

  if (loading) {
    return <div className="text-center py-8 text-zinc-600">Loading social media metrics...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <p className="font-semibold">Error loading data</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (!data) {
    return <div className="text-center py-8 text-zinc-600">No data available</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-zinc-200">
        {(['overview', 'facebook', 'whatsapp'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 font-medium border-b-2 transition-colors capitalize ${
              activeTab === tab
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-zinc-600 hover:text-zinc-900'
            }`}
          >
            {tab === 'facebook' ? 'Facebook Pixel' : tab === 'whatsapp' ? 'WhatsApp Growth' : 'Overview'}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Status Cards */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className={`rounded-lg border-2 p-4 ${getStatusColor(data.facebook.status)}`}>
              <h3 className="font-semibold flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook Integration
              </h3>
              <div className="mt-3 space-y-2 text-sm">
                <p>Status: <span className="font-semibold uppercase">{data.facebook.status}</span></p>
                <p>Pixel ID: <code className="text-xs bg-black/10 px-2 py-1 rounded">{data.facebook.pixelId}</code></p>
                <div className="mt-2 pt-2 border-t border-current/20">
                  <p className="text-xs opacity-75">Configuration:</p>
                  <ul className="text-xs mt-1 space-y-1">
                    {Object.entries(data.facebook.configured).map(([key, value]) => (
                      <li key={key} className="flex items-center gap-2">
                        <span className={`inline-block w-2 h-2 rounded-full ${value ? 'bg-current' : 'opacity-30'}`}></span>
                        {key}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className={`rounded-lg border-2 p-4 ${getStatusColor(data.whatsapp.status)}`}>
              <h3 className="font-semibold flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-4.929 1.242c-1.51.881-2.779 2.368-3.536 4.112-.76 1.744-.972 3.71-.603 5.61.369 1.9 1.266 3.618 2.596 4.979 1.33 1.361 3.011 2.218 4.896 2.48 1.885.262 3.828-.105 5.478-1.063 1.65-.958 2.94-2.412 3.664-4.127.724-1.715.857-3.625.38-5.409-.476-1.784-1.457-3.345-2.833-4.433a9.868 9.868 0 00-4.113-1.991zm0-2.382a12.25 12.25 0 016.1 1.537c1.88 1.089 3.449 2.733 4.5 4.74 1.05 2.007 1.257 4.347.691 6.513-.566 2.166-1.806 4.113-3.568 5.49-1.762 1.377-3.948 2.087-6.217 2.007-2.27-.08-4.405-.92-6.082-2.373-1.676-1.453-2.84-3.378-3.341-5.467a11.26 11.26 0 01.787-7.272c.95-1.993 2.449-3.681 4.257-4.821a12.25 12.25 0 016.1-1.537z" />
                </svg>
                WhatsApp Growth
              </h3>
              <div className="mt-3 space-y-2 text-sm">
                <p>Status: <span className="font-semibold uppercase">{data.whatsapp.status}</span></p>
                <p>Phone ID: <code className="text-xs bg-black/10 px-2 py-1 rounded">{data.whatsapp.phoneNumberId}</code></p>
                <div className="mt-2 pt-2 border-t border-current/20">
                  <p className="text-xs opacity-75">Configuration:</p>
                  <ul className="text-xs mt-1 space-y-1">
                    {Object.entries(data.whatsapp.configured).map(([key, value]) => (
                      <li key={key} className="flex items-center gap-2">
                        <span className={`inline-block w-2 h-2 rounded-full ${value ? 'bg-current' : 'opacity-30'}`}></span>
                        {key}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
              <p className="text-sm text-blue-600 font-semibold">Total Referrals</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">{data.metrics.growth.totalReferrals}</p>
            </div>
            <div className="rounded-lg bg-green-50 border border-green-200 p-4">
              <p className="text-sm text-green-600 font-semibold">Conversion Rate</p>
              <p className="text-3xl font-bold text-green-900 mt-2">{data.metrics.growth.conversionRate}</p>
            </div>
            <div className="rounded-lg bg-purple-50 border border-purple-200 p-4">
              <p className="text-sm text-purple-600 font-semibold">Pixel Events</p>
              <p className="text-3xl font-bold text-purple-900 mt-2">{data.metrics.pixelEvents.totalEvents}</p>
            </div>
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <p className="text-sm text-red-600 font-semibold">Fraud Blocked</p>
              <p className="text-3xl font-bold text-red-900 mt-2">{data.metrics.growth.fraudBlockedReferrals}</p>
            </div>
          </div>
        </div>
      )}

      {/* Facebook Tab */}
      {activeTab === 'facebook' && (
        <div className="space-y-6">
          <div className="rounded-lg border border-zinc-200 bg-white p-6">
            <h3 className="text-xl font-semibold mb-4">Pixel Event Breakdown</h3>
            <div className="space-y-2">
              {Object.entries(data.metrics.pixelEvents.eventBreakdown).map(([event, count]) => (
                <div key={event} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">{event}</span>
                  <span className="text-lg font-bold text-emerald-600">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <p className="text-sm text-zinc-600">Total Events</p>
              <p className="text-3xl font-bold text-zinc-900 mt-2">{data.metrics.pixelEvents.totalEvents}</p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <p className="text-sm text-zinc-600">Unique Event Types</p>
              <p className="text-3xl font-bold text-zinc-900 mt-2">{data.metrics.pixelEvents.uniqueEvents}</p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <p className="text-sm text-zinc-600">Period</p>
              <p className="text-lg font-bold text-zinc-900 mt-2">{data.metrics.pixelEvents.period}</p>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Tab */}
      {activeTab === 'whatsapp' && (
        <div className="space-y-6">
          {/* Growth Metrics */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <p className="text-sm text-zinc-600 font-semibold">Total Referrals</p>
              <p className="text-3xl font-bold text-zinc-900 mt-2">{data.metrics.growth.totalReferrals}</p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <p className="text-sm text-zinc-600 font-semibold">Converted</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{data.metrics.growth.convertedReferrals}</p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <p className="text-sm text-zinc-600 font-semibold">Conversion Rate</p>
              <p className="text-3xl font-bold text-emerald-600 mt-2">{data.metrics.growth.conversionRate}</p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <p className="text-sm text-zinc-600 font-semibold">Fraud Blocked</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{data.metrics.growth.fraudBlockedReferrals}</p>
            </div>
          </div>

          {/* Campaign Stats */}
          {campaignStats && (
            <div className="rounded-lg border border-zinc-200 bg-white p-6">
              <h3 className="text-xl font-semibold mb-4">Campaign Statistics</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600 font-semibold">Total Campaigns</p>
                  <p className="text-4xl font-bold text-blue-900 mt-2">{campaignStats.totalCampaigns}</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-600 font-semibold">Top Petitions</p>
                  <p className="text-4xl font-bold text-purple-900 mt-2">{campaignStats.topPetitions}</p>
                </div>
                <div className="text-center p-4 bg-indigo-50 rounded-lg">
                  <p className="text-sm text-indigo-600 font-semibold">Status Breakdown</p>
                  <div className="mt-2 space-y-1 text-sm">
                    {Object.entries(campaignStats.statusBreakdown).map(([status, count]) => (
                      <p key={status} className="text-indigo-900 font-medium">
                        {status}: <span className="font-bold">{count}</span>
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Trending Petitions */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6">
            <h3 className="text-xl font-semibold mb-4">Trending Petitions</h3>
            <div className="space-y-2">
              {data.metrics.growth.trendingPetitions.map((petition, idx) => (
                <div key={petition.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-lg font-bold text-emerald-600">#{idx + 1}</span>
                  <span className="font-medium text-gray-700">{petition.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Last Updated */}
      <div className="text-right text-xs text-zinc-500">
        Last updated: {new Date(data.lastUpdated).toLocaleTimeString()}
      </div>
    </div>
  );
}
