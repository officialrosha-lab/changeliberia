'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NotificationItem } from './notification-item';
import { useToast } from '../lib/toast-context';
import { useNotificationSocket } from '../lib/use-notification-socket';
import { apiGet, apiPatch, apiPost } from '../lib/api';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  status: 'UNREAD' | 'READ' | 'ARCHIVED';
  createdAt: string;
  metadata?: string;
}

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { show: showToast } = useToast();
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const data = await apiGet<{
        notifications: Notification[];
        total: number;
      }>('/notifications?limit=10&unreadOnly=false');

      if (data) {
        setNotifications(data.notifications);
        // Calculate unread count
        const unread = data.notifications.filter((n) => n.status === 'UNREAD').length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const data = await apiGet<{ unreadCount: number }>('/notifications/unread-count');
      if (data) {
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  // Handle new notification via WebSocket
  const handleNewNotification = (notification: any) => {
    console.log('[NotificationDropdown] New notification received:', notification.type);
    setNotifications((prev) => [notification, ...prev].slice(0, 10));
    setUnreadCount((prev) => prev + 1);
    
    // Show toast for critical notifications
    if (['PETITION_APPROVED', 'PETITION_REJECTED', 'SIGNATURE_RECEIVED'].includes(notification.type)) {
      showToast(notification.title, 'info');
    }
  };

  // Handle notification read via WebSocket
  const handleNotificationRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, status: 'READ' as const } : n,
      ),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  // Handle all notifications read via WebSocket
  const handleAllNotificationsRead = () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, status: 'READ' as const })),
    );
    setUnreadCount(0);
  };

  // Handle notification archived via WebSocket
  const handleNotificationArchived = (notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  };

  // Set up WebSocket connection
  const { isConnected } = useNotificationSocket({
    onNewNotification: handleNewNotification,
    onNotificationRead: handleNotificationRead,
    onAllNotificationsRead: handleAllNotificationsRead,
    onNotificationArchived: handleNotificationArchived,
  });

  // Mark notification as read
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await apiPatch(`/notifications/${notificationId}/read`, {});
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, status: 'READ' as const } : n,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      showToast('Failed to update notification', 'error');
    }
  };

  // Archive notification
  const handleArchive = async (notificationId: string) => {
    try {
      await apiPatch(`/notifications/${notificationId}/archive`, {});
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      showToast('Notification archived', 'info');
    } catch (error) {
      showToast('Failed to archive notification', 'error');
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await apiPost('/notifications/mark-all-read', {});
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, status: 'READ' as const })),
      );
      setUnreadCount(0);
      showToast('All marked as read', 'success');
    } catch (error) {
      showToast('Failed to mark all as read', 'error');
    }
  };

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Fetch unread count on mount and set up polling as fallback
  useEffect(() => {
    fetchUnreadCount();
    
    // Set up polling every 30 seconds as fallback when WebSocket not connected
    pollingIntervalRef.current = setInterval(() => {
      if (!isConnected) {
        console.log('[NotificationDropdown] WebSocket not connected, using polling fallback');
        fetchUnreadCount();
      }
    }, 30000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [isConnected]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-emerald-500"
        aria-label="Notifications"
      >
        <svg
          className="h-6 w-6 text-zinc-600 dark:text-zinc-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-96 bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-800 z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline transition focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500 rounded px-2 py-1"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center text-zinc-600 dark:text-zinc-400">
                  <div className="inline-block animate-spin">⏳</div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-zinc-600 dark:text-zinc-400">
                  <p>No notifications</p>
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  {notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={handleMarkAsRead}
                      onArchive={handleArchive}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 text-center">
                <a
                  href="/notifications"
                  className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline transition focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500 rounded px-2 py-1 inline-block"
                >
                  View all notifications
                </a>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
