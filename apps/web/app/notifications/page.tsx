'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { NotificationItem } from '../../components/notification-item';
import { Breadcrumb } from '../../components/breadcrumb';
import { SkeletonLoader } from '../../components/skeleton-loader';
import { useToast } from '../../lib/toast-context';
import { apiGet, apiPatch } from '../../lib/api';
import { useAuthStore } from '../../lib/store';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  status: 'UNREAD' | 'READ' | 'ARCHIVED';
  createdAt: string;
  metadata?: string;
}

const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'UNREAD', label: 'Unread' },
  { value: 'READ', label: 'Read' },
  { value: 'ARCHIVED', label: 'Archived' },
];

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const { show: showToast } = useToast();
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s.hydrated);

  const PAGE_SIZE = 20;

  // Fetch notifications
  useEffect(() => {
    if (!hydrated) return;
    if (!token) {
      setIsLoading(false);
      return;
    }
    const fetchNotifications = async () => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams({
          limit: PAGE_SIZE.toString(),
          offset: (page * PAGE_SIZE).toString(),
        });

        if (filter !== 'all' && filter !== 'ARCHIVED') {
          params.append('status', filter);
        }

        const data = await apiGet<{
          notifications: Notification[];
          total: number;
        }>(`/notifications?${params.toString()}`, token);

        if (data) {
          setNotifications(data.notifications);
          setTotal(data.total);
        }
      } catch (error) {
        showToast('Failed to load notifications', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, [filter, page, token, hydrated]);

  const handleMarkAsRead = async (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, status: 'READ' as const } : n,
      ),
    );
    if (token) {
      try {
        await apiPatch(`/notifications/${notificationId}/read`, {}, token);
      } catch {
        showToast('Failed to update notification', 'error');
      }
    }
  };

  const handleArchive = async (notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    if (token) {
      try {
        await apiPatch(`/notifications/${notificationId}/archive`, {}, token);
      } catch {
        showToast('Failed to archive notification', 'error');
      }
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Notifications', current: true },
          ]}
        />

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 mb-8"
        >
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-2">
            Notifications
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Stay updated on petitions, signatures, and more
          </p>
        </motion.div>

        {/* Filters */}
        <div className="mb-6 flex gap-2 flex-wrap">
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                setFilter(option.value);
                setPage(0);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === option.value
                  ? 'bg-emerald-600 text-white dark:bg-emerald-500'
                  : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 hover:bg-zinc-200 dark:hover:bg-zinc-800'
              } focus:outline-none focus:ring-2 focus:ring-emerald-500`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        {isLoading ? (
          <SkeletonLoader variant="list-item" count={5} className="space-y-3" />
        ) : notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              No notifications yet
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-2">
              Check back later for updates
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {notifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <NotificationItem
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onArchive={handleArchive}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Previous
            </button>

            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Page {page + 1} of {totalPages}
            </span>

            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page === totalPages - 1}
              className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default NotificationsPage;
