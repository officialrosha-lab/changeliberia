'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '../lib/api';
import { useAuthStore } from '../lib/store';

interface ActivityLogEntry {
  id: string;
  userId?: string;
  adminId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  description?: string;
  ipAddress?: string;
  status: string;
  errorMessage?: string;
  createdAt: string;
  user?: {
    id: string;
    email?: string;
    fullName: string;
    phone: string;
  };
  admin?: {
    id: string;
    email?: string;
    fullName: string;
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function AdminActivityLog() {
  const token = useAuthStore((s) => s.token);
  const [activeTab, setActiveTab] = useState<'global' | 'user' | 'stats'>('global');
  
  // Global timeline state
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  
  // Filters
  const [filters, setFilters] = useState({
    action: '',
    entityType: '',
    status: '',
    startDate: '',
    endDate: '',
  });
  
  // User search
  const [searchUserId, setSearchUserId] = useState('');
  const [userLogs, setUserLogs] = useState<ActivityLogEntry[]>([]);
  const [userLoading, setUserLoading] = useState(false);
  
  // Stats
  const [stats, setStats] = useState<any>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch global activity logs
  useEffect(() => {
    if (!token || activeTab !== 'global') return;
    
    const fetchLogs = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const query = new URLSearchParams({
          page: pagination.page.toString(),
          limit: pagination.limit.toString(),
          ...(filters.action && { action: filters.action }),
          ...(filters.entityType && { entityType: filters.entityType }),
          ...(filters.status && { status: filters.status }),
          ...(filters.startDate && { startDate: filters.startDate }),
          ...(filters.endDate && { endDate: filters.endDate }),
        });
        
        const result = await apiGet<{
          data: ActivityLogEntry[];
          pagination: PaginationInfo;
        }>(`/admin/activity-logs?${query}`, token);
        
        setLogs(result.data);
        setPagination(result.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load activities');
      } finally {
        setLoading(false);
      }
    };
    
    fetchLogs();
  }, [token, activeTab, pagination.page, filters]);

  // Fetch stats
  useEffect(() => {
    if (!token || activeTab !== 'stats') return;
    
    const fetchStats = async () => {
      try {
        setLoading(true);
        const result = await apiGet<any>('/admin/activity-logs/stats?days=30', token);
        setStats(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stats');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, [token, activeTab]);

  // Search user activities
  const handleUserSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchUserId.trim()) return;
    
    try {
      setUserLoading(true);
      setError(null);
      const result = await apiGet<ActivityLogEntry[]>(
        `/admin/activity-logs/user/${searchUserId}?limit=100`,
        token,
      );
      setUserLogs(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user activities');
    } finally {
      setUserLoading(false);
    }
  };

  // Export as CSV
  const handleExport = async (format: 'csv' | 'json' = 'csv') => {
    try {
      const query = new URLSearchParams({
        format,
        ...(filters.action && { action: filters.action }),
        ...(filters.entityType && { entityType: filters.entityType }),
        ...(filters.status && { status: filters.status }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
      });
      
      window.location.href = `/api/v1/admin/activity-logs/export?${query}&Authorization=Bearer%20${token}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('LOGIN')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    if (action.includes('CREATE') || action.includes('UPDATE')) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    if (action.includes('DELETE') || action.includes('REJECT')) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    if (action.includes('APPROVE')) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
    if (action.includes('FRAUD') || action.includes('FAILED')) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  };

  const getStatusBadge = (status: string) => {
    if (status === 'SUCCESS') {
      return <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">✓ Success</span>;
    }
    return <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">✗ Failed</span>;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-zinc-900 dark:text-white">Activity Log</h2>
        <p className="text-zinc-600 dark:text-zinc-400 mt-1">Monitor all user and admin activities</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-zinc-200 dark:border-neutral-800">
        {(['global', 'user', 'stats'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 font-medium border-b-2 transition-colors capitalize ${
              activeTab === tab
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-zinc-600 hover:text-zinc-900 dark:text-neutral-400 dark:hover:text-neutral-50'
            }`}
          >
            {tab === 'global' ? 'Global Timeline' : tab === 'user' ? 'User Search' : 'Statistics'}
          </button>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          <p className="font-semibold">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Global Timeline Tab */}
      {activeTab === 'global' && (
        <div className="space-y-6">
          {/* Filter Panel */}
          <div className="bg-white dark:bg-neutral-900 border border-zinc-200 dark:border-neutral-800 rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Filters</h3>
            
            <div className="grid gap-4 md:grid-cols-3">
              {/* Action Filter */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-neutral-300 mb-1.5">Action</label>
                <select
                  value={filters.action}
                  onChange={(e) => {
                    setFilters({ ...filters, action: e.target.value });
                    setPagination({ ...pagination, page: 1 });
                  }}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">All Actions</option>
                  <option value="LOGIN">Login</option>
                  <option value="CREATE_PETITION">Create Petition</option>
                  <option value="APPROVE_PETITION">Approve Petition</option>
                  <option value="SIGN_PETITION">Sign Petition</option>
                  <option value="PAYMENT_PROCESSED">Payment Processed</option>
                  <option value="ID_APPROVED">ID Approved</option>
                  <option value="FRAUD_EVENT">Fraud Event</option>
                </select>
              </div>

              {/* Entity Type Filter */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-neutral-300 mb-1.5">Entity Type</label>
                <select
                  value={filters.entityType}
                  onChange={(e) => {
                    setFilters({ ...filters, entityType: e.target.value });
                    setPagination({ ...pagination, page: 1 });
                  }}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">All Types</option>
                  <option value="USER">User</option>
                  <option value="PETITION">Petition</option>
                  <option value="SIGNATURE">Signature</option>
                  <option value="PAYMENT">Payment</option>
                  <option value="ID_DOCUMENT">ID Document</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-neutral-300 mb-1.5">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => {
                    setFilters({ ...filters, status: e.target.value });
                    setPagination({ ...pagination, page: 1 });
                  }}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">All Status</option>
                  <option value="SUCCESS">Success</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-neutral-300 mb-1.5">Start Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => {
                    setFilters({ ...filters, startDate: e.target.value });
                    setPagination({ ...pagination, page: 1 });
                  }}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-neutral-300 mb-1.5">End Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => {
                    setFilters({ ...filters, endDate: e.target.value });
                    setPagination({ ...pagination, page: 1 });
                  }}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Export Button */}
              <div className="flex items-end gap-2">
                <button
                  onClick={() => handleExport('csv')}
                  className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm transition"
                >
                  Export CSV
                </button>
              </div>
            </div>
          </div>

          {/* Activity Logs */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12 text-zinc-600 dark:text-neutral-400">
                Loading activities...
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 text-zinc-600 dark:text-neutral-400">
                No activities found
              </div>
            ) : (
              <>
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-white dark:bg-neutral-900 border border-zinc-200 dark:border-neutral-800 rounded-lg p-4 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getActionColor(log.action)}`}>
                            {log.action}
                          </span>
                          {getStatusBadge(log.status)}
                          <span className="text-xs text-zinc-500 dark:text-neutral-500">{log.entityType}</span>
                        </div>
                        
                        <p className="text-sm text-zinc-900 dark:text-white font-medium mb-1">
                          {log.description || 'No description'}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-zinc-600 dark:text-neutral-400">
                          {log.user && (
                            <span>User: {log.user.fullName} ({log.user.phone})</span>
                          )}
                          {log.admin && (
                            <span>Admin: {log.admin.fullName}</span>
                          )}
                          {log.ipAddress && (
                            <span>IP: {log.ipAddress}</span>
                          )}
                          <span>{formatDate(log.createdAt)}</span>
                        </div>
                        
                        {log.errorMessage && (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                            Error: {log.errorMessage}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Pagination */}
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-zinc-200 dark:border-neutral-800">
                  <span className="text-sm text-zinc-600 dark:text-neutral-400">
                    Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPagination({ ...pagination, page: Math.max(1, pagination.page - 1) })}
                      disabled={pagination.page === 1}
                      className="px-3 py-2 border border-zinc-300 dark:border-neutral-700 rounded-lg text-sm font-medium text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      ← Previous
                    </button>
                    <button
                      onClick={() => setPagination({ ...pagination, page: Math.min(pagination.totalPages, pagination.page + 1) })}
                      disabled={pagination.page === pagination.totalPages}
                      className="px-3 py-2 border border-zinc-300 dark:border-neutral-700 rounded-lg text-sm font-medium text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* User Search Tab */}
      {activeTab === 'user' && (
        <div className="space-y-6">
          <form onSubmit={handleUserSearch} className="bg-white dark:bg-neutral-900 border border-zinc-200 dark:border-neutral-800 rounded-lg p-6">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchUserId}
                onChange={(e) => setSearchUserId(e.target.value)}
                placeholder="Enter user ID or email..."
                className="flex-1 px-3 py-2 border border-zinc-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                disabled={userLoading}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition disabled:opacity-50"
              >
                {userLoading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>

          {userLogs.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Activities for {searchUserId}</h3>
              {userLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-white dark:bg-neutral-900 border border-zinc-200 dark:border-neutral-800 rounded-lg p-4"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                    {getStatusBadge(log.status)}
                  </div>
                  <p className="text-sm text-zinc-900 dark:text-white mb-1">{log.description}</p>
                  <p className="text-xs text-zinc-500 dark:text-neutral-500">{formatDate(log.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Statistics Tab */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-12 text-zinc-600 dark:text-neutral-400">
              Loading statistics...
            </div>
          ) : stats ? (
            <>
              {/* Summary Cards */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold">Total Activities</p>
                  <p className="text-4xl font-bold text-blue-900 dark:text-blue-200 mt-2">{stats.totalActivities}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">{stats.period}</p>
                </div>

                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                  <p className="text-sm text-red-600 dark:text-red-400 font-semibold">Failed Activities</p>
                  <p className="text-4xl font-bold text-red-900 dark:text-red-200 mt-2">{stats.failedActivities}</p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                    ({((stats.failedActivities / stats.totalActivities) * 100).toFixed(1)}%)
                  </p>
                </div>
              </div>

              {/* Activities by Action */}
              <div className="bg-white dark:bg-neutral-900 border border-zinc-200 dark:border-neutral-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Activities by Action</h3>
                <div className="space-y-3">
                  {stats.activitiesByAction.map((item: any) => (
                    <div key={item.action} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-zinc-900 dark:text-white">{item.action}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-32 h-2 bg-zinc-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-600"
                            style={{
                              width: `${(item.count / stats.totalActivities) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-zinc-900 dark:text-white w-12 text-right">
                          {item.count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Users */}
              {stats.topUsers.length > 0 && (
                <div className="bg-white dark:bg-neutral-900 border border-zinc-200 dark:border-neutral-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Top Active Users</h3>
                  <div className="space-y-3">
                    {stats.topUsers.map((user: any, idx: number) => (
                      <div key={user.userId || idx} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-neutral-800 rounded-lg">
                        <span className="text-sm font-medium text-zinc-900 dark:text-white">
                          User ID: {user.userId?.substring(0, 8)}...
                        </span>
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          {user.count} activities
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
