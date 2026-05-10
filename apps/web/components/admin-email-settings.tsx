'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../lib/api';
import { useAuthStore } from '../lib/store';

interface EmailStats {
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  totalFailed: number;
  openRate: number;
  clickRate: number;
  deliveryRate: number;
}

interface QueueStats {
  queued: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

interface DomainStatus {
  domain: string;
  verified: boolean;
  dkimVerified: boolean;
  spfVerified: boolean;
  dmarcVerified: boolean;
  verificationStatus: string;
}

interface HealthStatus {
  status: 'ok' | 'error' | 'warning';
  message: string;
  lastChecked: string;
  apiKey: boolean;
  redisConnected: boolean;
  databaseConnected: boolean;
}

export function AdminEmailSettings() {
  const token = useAuthStore((s) => s.token);
  const [activeTab, setActiveTab] = useState<'configuration' | 'queue' | 'analytics'>('configuration');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [domainStatus, setDomainStatus] = useState<DomainStatus | null>(null);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('7d');

  useEffect(() => {
    if (!token) return;
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [token, dateRange]);

  async function loadData() {
    try {
      setLoading(true);
      const endDate = new Date();
      const startDate = new Date();
      if (dateRange === '7d') startDate.setDate(startDate.getDate() - 7);
      else if (dateRange === '30d') startDate.setDate(startDate.getDate() - 30);
      else startDate.setDate(startDate.getDate() - 90);

      const [s, q, h] = await Promise.all([
        apiGet<EmailStats>(
          `/admin/email/stats?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
          token!
        ),
        apiGet<QueueStats>('/admin/email/queue-stats', token!),
        apiGet<HealthStatus>('/admin/email/health', token!),
      ]);
      setStats(s);
      setQueueStats(q);
      setHealthStatus(h);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load email data');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyDomain(domain: string) {
    if (!token) return;
    try {
      setVerifying(true);
      const result = await apiPost<DomainStatus>('/admin/email/verify-domain', { domain }, token);
      setDomainStatus(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify domain');
    } finally {
      setVerifying(false);
    }
  }

  const tabClasses =
    'px-4 py-2 border-b-2 font-medium text-sm transition-colors cursor-pointer';
  const activeTabClasses = 'border-blue-500 text-blue-600 dark:text-blue-400';
  const inactiveTabClasses =
    'border-transparent text-zinc-600 dark:text-neutral-400 hover:text-zinc-900 dark:hover:text-neutral-300';

  if (loading && !stats && !queueStats) {
    return <div className="text-center py-8 text-zinc-500 dark:text-neutral-400">Loading email settings...</div>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-800 dark:text-red-200">
          {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-0 border-b border-zinc-200 dark:border-neutral-700">
        <button
          onClick={() => setActiveTab('configuration')}
          className={`${tabClasses} ${activeTab === 'configuration' ? activeTabClasses : inactiveTabClasses}`}
        >
          Configuration
        </button>
        <button
          onClick={() => setActiveTab('queue')}
          className={`${tabClasses} ${activeTab === 'queue' ? activeTabClasses : inactiveTabClasses}`}
        >
          Queue Status
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`${tabClasses} ${activeTab === 'analytics' ? activeTabClasses : inactiveTabClasses}`}
        >
          Analytics
        </button>
      </div>

      {/* Configuration Tab */}
      {activeTab === 'configuration' && (
        <div className="space-y-6">
          {/* Health Status */}
          <div className="bg-white dark:bg-neutral-900 rounded-lg border border-zinc-200 dark:border-neutral-700 p-6">
            <h3 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-neutral-100">System Health</h3>
            {healthStatus && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-700 dark:text-neutral-300">Overall Status</span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      healthStatus.status === 'ok'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                        : healthStatus.status === 'warning'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                    }`}
                  >
                    {healthStatus.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-zinc-600 dark:text-neutral-400">{healthStatus.message}</p>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${healthStatus.apiKey ? 'bg-green-500' : 'bg-red-500'}`}
                    ></div>
                    <span className="text-zinc-700 dark:text-neutral-300">API Key</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${healthStatus.redisConnected ? 'bg-green-500' : 'bg-red-500'}`}
                    ></div>
                    <span className="text-zinc-700 dark:text-neutral-300">Redis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${healthStatus.databaseConnected ? 'bg-green-500' : 'bg-red-500'}`}
                    ></div>
                    <span className="text-zinc-700 dark:text-neutral-300">Database</span>
                  </div>
                </div>
                <p className="text-xs text-zinc-500 dark:text-neutral-500">Last checked: {healthStatus.lastChecked}</p>
              </div>
            )}
          </div>

          {/* Domain Verification */}
          <div className="bg-white dark:bg-neutral-900 rounded-lg border border-zinc-200 dark:border-neutral-700 p-6">
            <h3 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-neutral-100">Domain Verification</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Enter domain to verify (e.g., track.changeliberia.org)"
                className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-neutral-600 bg-zinc-50 dark:bg-neutral-800 text-zinc-900 dark:text-neutral-100 placeholder-zinc-500 dark:placeholder-neutral-400"
                defaultValue={domainStatus?.domain || ''}
                id="domainInput"
              />
              <button
                onClick={() => {
                  const input = document.getElementById('domainInput') as HTMLInputElement;
                  if (input?.value) handleVerifyDomain(input.value);
                }}
                disabled={verifying}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg font-medium transition-colors"
              >
                {verifying ? 'Verifying...' : 'Verify Domain'}
              </button>

              {domainStatus && (
                <div className="mt-4 space-y-3 p-4 bg-zinc-50 dark:bg-neutral-800 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-700 dark:text-neutral-300">Domain Verified</span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        domainStatus.verified
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                      }`}
                    >
                      {domainStatus.verified ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-700 dark:text-neutral-300">DKIM</span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        domainStatus.dkimVerified
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                          : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
                      }`}
                    >
                      {domainStatus.dkimVerified ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-700 dark:text-neutral-300">SPF</span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        domainStatus.spfVerified
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                          : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
                      }`}
                    >
                      {domainStatus.spfVerified ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-700 dark:text-neutral-300">DMARC</span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        domainStatus.dmarcVerified
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                          : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
                      }`}
                    >
                      {domainStatus.dmarcVerified ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Queue Status Tab */}
      {activeTab === 'queue' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-lg border border-zinc-200 dark:border-neutral-700 p-6">
            <h3 className="text-lg font-semibold mb-6 text-zinc-900 dark:text-neutral-100">BullMQ Queue Status</h3>
            {queueStats ? (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{queueStats.queued}</div>
                  <div className="text-sm text-zinc-600 dark:text-neutral-400 mt-1">Queued</div>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{queueStats.active}</div>
                  <div className="text-sm text-zinc-600 dark:text-neutral-400 mt-1">Active</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{queueStats.completed}</div>
                  <div className="text-sm text-zinc-600 dark:text-neutral-400 mt-1">Completed</div>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">{queueStats.failed}</div>
                  <div className="text-sm text-zinc-600 dark:text-neutral-400 mt-1">Failed</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{queueStats.delayed}</div>
                  <div className="text-sm text-zinc-600 dark:text-neutral-400 mt-1">Delayed</div>
                </div>
              </div>
            ) : (
              <p className="text-zinc-500 dark:text-neutral-400">Loading queue stats...</p>
            )}
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-lg border border-zinc-200 dark:border-neutral-700 p-6">
            <h3 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-neutral-100">Auto-Refresh</h3>
            <p className="text-sm text-zinc-600 dark:text-neutral-400">
              Queue status automatically updates every 30 seconds. Last refresh: just now
            </p>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Date Range Selector */}
          <div className="flex gap-2">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  dateRange === range
                    ? 'bg-blue-500 text-white'
                    : 'bg-zinc-100 dark:bg-neutral-800 text-zinc-700 dark:text-neutral-300 hover:bg-zinc-200 dark:hover:bg-neutral-700'
                }`}
              >
                Last {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>

          {/* Email Statistics Grid */}
          {stats ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-neutral-900 rounded-lg border border-zinc-200 dark:border-neutral-700 p-4">
                <div className="text-sm text-zinc-600 dark:text-neutral-400">Total Sent</div>
                <div className="text-3xl font-bold text-zinc-900 dark:text-neutral-100 mt-1">{stats.totalSent}</div>
              </div>
              <div className="bg-white dark:bg-neutral-900 rounded-lg border border-zinc-200 dark:border-neutral-700 p-4">
                <div className="text-sm text-zinc-600 dark:text-neutral-400">Delivered</div>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.totalDelivered}</div>
              </div>
              <div className="bg-white dark:bg-neutral-900 rounded-lg border border-zinc-200 dark:border-neutral-700 p-4">
                <div className="text-sm text-zinc-600 dark:text-neutral-400">Delivery Rate</div>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                  {(stats.deliveryRate * 100).toFixed(1)}%
                </div>
              </div>
              <div className="bg-white dark:bg-neutral-900 rounded-lg border border-zinc-200 dark:border-neutral-700 p-4">
                <div className="text-sm text-zinc-600 dark:text-neutral-400">Opened</div>
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-1">{stats.totalOpened}</div>
              </div>
              <div className="bg-white dark:bg-neutral-900 rounded-lg border border-zinc-200 dark:border-neutral-700 p-4">
                <div className="text-sm text-zinc-600 dark:text-neutral-400">Open Rate</div>
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                  {(stats.openRate * 100).toFixed(1)}%
                </div>
              </div>
              <div className="bg-white dark:bg-neutral-900 rounded-lg border border-zinc-200 dark:border-neutral-700 p-4">
                <div className="text-sm text-zinc-600 dark:text-neutral-400">Click Rate</div>
                <div className="text-3xl font-bold text-cyan-600 dark:text-cyan-400 mt-1">
                  {(stats.clickRate * 100).toFixed(1)}%
                </div>
              </div>
              <div className="bg-white dark:bg-neutral-900 rounded-lg border border-zinc-200 dark:border-neutral-700 p-4">
                <div className="text-sm text-zinc-600 dark:text-neutral-400">Clicked</div>
                <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{stats.totalClicked}</div>
              </div>
              <div className="bg-white dark:bg-neutral-900 rounded-lg border border-zinc-200 dark:border-neutral-700 p-4">
                <div className="text-sm text-zinc-600 dark:text-neutral-400">Bounced</div>
                <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{stats.totalBounced}</div>
              </div>
              <div className="bg-white dark:bg-neutral-900 rounded-lg border border-zinc-200 dark:border-neutral-700 p-4">
                <div className="text-sm text-zinc-600 dark:text-neutral-400">Failed</div>
                <div className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">{stats.totalFailed}</div>
              </div>
            </div>
          ) : (
            <p className="text-zinc-500 dark:text-neutral-400">Loading analytics...</p>
          )}

          {/* Summary Stats */}
          <div className="bg-white dark:bg-neutral-900 rounded-lg border border-zinc-200 dark:border-neutral-700 p-6">
            <h3 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-neutral-100">Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-600 dark:text-neutral-400">Success Rate</span>
                <span className="font-medium text-zinc-900 dark:text-neutral-100">
                  {((stats?.deliveryRate || 0) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600 dark:text-neutral-400">Engagement Rate</span>
                <span className="font-medium text-zinc-900 dark:text-neutral-100">
                  {(((stats?.totalOpened || 0) + (stats?.totalClicked || 0)) / (stats?.totalDelivered || 1) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600 dark:text-neutral-400">Problem Rate</span>
                <span className="font-medium text-zinc-900 dark:text-neutral-100">
                  {(((stats?.totalBounced || 0) + (stats?.totalFailed || 0)) / (stats?.totalSent || 1) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
