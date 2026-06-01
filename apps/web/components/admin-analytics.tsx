'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { apiGet } from '../lib/api';
import { useAuthStore } from '../lib/store';
import { useAnalyticsMultiple } from '../lib/hooks/useAnalyticsRealtime';
import { AnalyticsNotificationBadge, AnalyticsLiveUpdateFeed } from './analytics-realtime';

type Period = 'day' | 'week' | 'month';

interface MessageMetrics {
  totalMessages: number;
  avgMessagesPerDay: number;
  messagesLastDay: number;
  messagesLastWeek: number;
  messagesLastMonth: number;
}

interface MessageVolumeByDate {
  date: string;
  sent: number;
  received: number;
  total: number;
}

interface MessageByCategoryMetrics {
  category: string;
  count: number;
  percentage: number;
}

interface MessageThreadMetrics {
  totalThreads: number;
  avgReplyCount: number;
  threadsWithReplies: number;
  avgThreadDepth: number;
}

interface MessageAnalyticsResponse {
  period: Period;
  metrics: MessageMetrics;
  volumeByDate: MessageVolumeByDate[];
  byCategory: MessageByCategoryMetrics[];
  threadMetrics: MessageThreadMetrics;
  topSenders: Array<{ userId: string; userEmail: string; count: number }>;
  topReceivers: Array<{ userId: string; userEmail: string; count: number }>;
}

interface BroadcastMetrics {
  totalBroadcasts: number;
  totalRecipients: number;
  avgRecipientsPerBroadcast: number;
  broadcastsLastDay: number;
  broadcastsLastWeek: number;
  broadcastsLastMonth: number;
}

interface BroadcastVolumeByDate {
  date: string;
  count: number;
  totalRecipients: number;
}

interface BroadcastByCategoryMetrics {
  category: string;
  count: number;
  percentage: number;
  totalRecipients: number;
}

interface BroadcastDeliveryMetrics {
  totalBroadcasts: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  deliveryRate: number;
}

interface BroadcastAnalyticsResponse {
  period: Period;
  metrics: BroadcastMetrics;
  volumeByDate: BroadcastVolumeByDate[];
  byCategory: BroadcastByCategoryMetrics[];
  deliveryMetrics: BroadcastDeliveryMetrics;
  topCategories: Array<{ category: string; count: number }>;
  recentBroadcasts: Array<{
    id: string;
    title: string;
    category: string;
    recipientCount: number;
    createdAt: string;
  }>;
}

const CHART_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

export function GlobalAnalytics() {
  const token = useAuthStore((s) => s.token);
  const [period, setPeriod] = useState<Period>('week');
  const [messageAnalytics, setMessageAnalytics] = useState<MessageAnalyticsResponse | null>(null);
  const [broadcastAnalytics, setBroadcastAnalytics] = useState<BroadcastAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'messages' | 'broadcasts'>('messages');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Real-time analytics updates
  const { updates, connected } = useAnalyticsMultiple([
    'message_created',
    'broadcast_sent',
    'message_count',
    'broadcast_count',
  ]);

  useEffect(() => {
    if (!token) return;

    const loadAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);

        const [msgData, bcData] = await Promise.all([
          apiGet<MessageAnalyticsResponse>(`/analytics/messages?period=${period}`, token),
          apiGet<BroadcastAnalyticsResponse>(`/analytics/broadcasts?period=${period}`, token),
        ]);

        setMessageAnalytics(msgData);
        setBroadcastAnalytics(bcData);
        setLastRefresh(new Date());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    void loadAnalytics();
  }, [token, period]);

  // Auto-refresh analytics when real-time updates arrive
  useEffect(() => {
    if (!token || !connected) return;

    // Trigger refresh if message or broadcast updates arrive
    const hasUpdate =
      updates.message_created ||
      updates.broadcast_sent ||
      updates.message_count ||
      updates.broadcast_count;

    if (hasUpdate) {
      // Debounce refresh to avoid too frequent reloads (max once per 2 seconds)
      const timer = setTimeout(async () => {
        try {
          const [msgData, bcData] = await Promise.all([
            apiGet<MessageAnalyticsResponse>(`/analytics/messages?period=${period}`, token),
            apiGet<BroadcastAnalyticsResponse>(`/analytics/broadcasts?period=${period}`, token),
          ]);

          setMessageAnalytics(msgData);
          setBroadcastAnalytics(bcData);
          setLastRefresh(new Date());
        } catch (err) {
          console.error('Failed to refresh analytics:', err);
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [updates, token, period, connected]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-zinc-600 dark:text-neutral-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 dark:bg-red-950 dark:border-red-800">
          <p className="text-red-800 dark:text-red-200">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Real-time status and notifications */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              connected ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'
            }`}
          />
          <span className="text-sm text-zinc-600 dark:text-neutral-400">
            {connected ? 'Live updates enabled' : 'Updating...'}
          </span>
          {lastRefresh && (
            <span className="text-xs text-zinc-500 dark:text-neutral-500">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Live update feed */}
      <AnalyticsLiveUpdateFeed />

      {/* Real-time notification badge */}
      <AnalyticsNotificationBadge />

      {/* Period Selector */}
      <div className="flex gap-2">
        {(['day', 'week', 'month'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              period === p
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
            }`}
          >
            {p === 'day' ? 'Last 24h' : p === 'week' ? 'Last 7 days' : 'Last 30 days'}
          </button>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-4 border-b border-zinc-200 dark:border-neutral-800">
        {(['messages', 'broadcasts'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-emerald-600 text-emerald-600 dark:border-emerald-500 dark:text-emerald-400'
                : 'border-transparent text-zinc-600 hover:text-zinc-900 dark:text-neutral-400 dark:hover:text-neutral-50'
            }`}
          >
            {tab === 'messages' ? 'Messages' : 'Broadcasts'}
          </button>
        ))}
      </div>

      {/* Messages Analytics */}
      {activeTab === 'messages' && messageAnalytics && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-sm text-zinc-600 dark:text-neutral-400">Total Messages</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-neutral-50">
                {messageAnalytics.metrics.totalMessages.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-sm text-zinc-600 dark:text-neutral-400">Avg Per Day</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-neutral-50">
                {messageAnalytics.metrics.avgMessagesPerDay}
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-sm text-zinc-600 dark:text-neutral-400">Last {period === 'day' ? '24h' : period === 'week' ? '7d' : '30d'}</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-neutral-50">
                {(period === 'day' ? messageAnalytics.metrics.messagesLastDay : period === 'week' ? messageAnalytics.metrics.messagesLastWeek : messageAnalytics.metrics.messagesLastMonth).toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-sm text-zinc-600 dark:text-neutral-400">Total Threads</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-neutral-50">
                {messageAnalytics.threadMetrics.totalThreads}
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-sm text-zinc-600 dark:text-neutral-400">Avg Thread Depth</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-neutral-50">
                {messageAnalytics.threadMetrics.avgThreadDepth}
              </p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Volume by Date */}
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-neutral-50 mb-4">Message Volume</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={messageAnalytics.volumeByDate}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="total" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* By Category */}
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-neutral-50 mb-4">Messages by Category</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={messageAnalytics.byCategory}
                    dataKey="count"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                  >
                    {messageAnalytics.byCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Senders and Receivers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-neutral-50 mb-4">Top Senders</h3>
              <div className="space-y-3">
                {messageAnalytics.topSenders.map((sender) => (
                  <div key={sender.userId} className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg dark:bg-neutral-800">
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-neutral-50">{sender.userEmail}</p>
                    </div>
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{sender.count}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-neutral-50 mb-4">Top Receivers</h3>
              <div className="space-y-3">
                {messageAnalytics.topReceivers.map((receiver) => (
                  <div key={receiver.userId} className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg dark:bg-neutral-800">
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-neutral-50">{receiver.userEmail}</p>
                    </div>
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{receiver.count}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Thread Metrics */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-neutral-50 mb-4">Thread Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-zinc-600 dark:text-neutral-400">Total Threads</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-neutral-50">
                  {messageAnalytics.threadMetrics.totalThreads}
                </p>
              </div>
              <div>
                <p className="text-sm text-zinc-600 dark:text-neutral-400">Avg Replies</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-neutral-50">
                  {messageAnalytics.threadMetrics.avgReplyCount}
                </p>
              </div>
              <div>
                <p className="text-sm text-zinc-600 dark:text-neutral-400">With Replies</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-neutral-50">
                  {messageAnalytics.threadMetrics.threadsWithReplies}
                </p>
              </div>
              <div>
                <p className="text-sm text-zinc-600 dark:text-neutral-400">Avg Depth</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-neutral-50">
                  {messageAnalytics.threadMetrics.avgThreadDepth}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Broadcasts Analytics */}
      {activeTab === 'broadcasts' && broadcastAnalytics && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-sm text-zinc-600 dark:text-neutral-400">Total Broadcasts</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-neutral-50">
                {broadcastAnalytics.metrics.totalBroadcasts}
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-sm text-zinc-600 dark:text-neutral-400">Total Recipients</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-neutral-50">
                {broadcastAnalytics.metrics.totalRecipients.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-sm text-zinc-600 dark:text-neutral-400">Avg Recipients</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-neutral-50">
                {broadcastAnalytics.metrics.avgRecipientsPerBroadcast.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-sm text-zinc-600 dark:text-neutral-400">Delivery Rate</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-neutral-50">
                {broadcastAnalytics.deliveryMetrics.deliveryRate}%
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-sm text-zinc-600 dark:text-neutral-400">Successful Sends</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-neutral-50">
                {broadcastAnalytics.deliveryMetrics.successfulDeliveries}
              </p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Volume by Date */}
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-neutral-50 mb-4">Broadcast Volume</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={broadcastAnalytics.volumeByDate}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#10b981" name="Broadcasts" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* By Category */}
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-neutral-50 mb-4">Broadcasts by Category</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={broadcastAnalytics.byCategory}
                    dataKey="count"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                  >
                    {broadcastAnalytics.byCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Delivery Metrics */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-neutral-50 mb-4">Delivery Performance</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-zinc-600 dark:text-neutral-400">Total Broadcasts</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-neutral-50">
                  {broadcastAnalytics.deliveryMetrics.totalBroadcasts}
                </p>
              </div>
              <div>
                <p className="text-sm text-zinc-600 dark:text-neutral-400">Successful</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {broadcastAnalytics.deliveryMetrics.successfulDeliveries}
                </p>
              </div>
              <div>
                <p className="text-sm text-zinc-600 dark:text-neutral-400">Failed</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {broadcastAnalytics.deliveryMetrics.failedDeliveries}
                </p>
              </div>
              <div>
                <p className="text-sm text-zinc-600 dark:text-neutral-400">Success Rate</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-neutral-50">
                  {broadcastAnalytics.deliveryMetrics.deliveryRate}%
                </p>
              </div>
            </div>
          </div>

          {/* Recent Broadcasts */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-neutral-50 mb-4">Recent Broadcasts</h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {broadcastAnalytics.recentBroadcasts.map((broadcast) => (
                <div
                  key={broadcast.id}
                  className="p-3 border border-zinc-100 rounded-lg dark:border-neutral-800"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-neutral-50">{broadcast.title}</p>
                      <p className="text-xs text-zinc-500 dark:text-neutral-500">
                        {broadcast.category} • {new Date(broadcast.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium whitespace-nowrap dark:bg-emerald-900 dark:text-emerald-200">
                      {broadcast.recipientCount} recipients
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
