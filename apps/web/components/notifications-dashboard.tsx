'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type NotificationType =
  | 'signature'
  | 'comment'
  | 'milestone'
  | 'system'
  | 'achievement'
  | 'donation';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  icon?: string;
  metadata?: {
    petitionId?: string;
    userId?: string;
    data?: Record<string, any>;
  };
}

interface NotificationsDashboardProps {
  notifications: Notification[];
  onMarkAsRead?: (notificationId: string) => Promise<void>;
  onDismiss?: (notificationId: string) => Promise<void>;
  onClearAll?: () => Promise<void>;
  onActionClick?: (notification: Notification) => void;
  isLoading?: boolean;
}

const notificationColors: Record<NotificationType, { bg: string; border: string; icon: string }> = {
  signature: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-900',
    icon: '✓',
  },
  comment: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-900',
    icon: '💬',
  },
  milestone: {
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    border: 'border-purple-200 dark:border-purple-900',
    icon: '🎯',
  },
  achievement: {
    bg: 'bg-yellow-50 dark:bg-yellow-950/30',
    border: 'border-yellow-200 dark:border-yellow-900',
    icon: '🏆',
  },
  donation: {
    bg: 'bg-pink-50 dark:bg-pink-950/30',
    border: 'border-pink-200 dark:border-pink-900',
    icon: '💝',
  },
  system: {
    bg: 'bg-zinc-50 dark:bg-zinc-900',
    border: 'border-zinc-200 dark:border-zinc-800',
    icon: '⚙️',
  },
};

const typeLabels: Record<NotificationType, string> = {
  signature: 'New Signature',
  comment: 'New Comment',
  milestone: 'Milestone Reached',
  achievement: 'Achievement Unlocked',
  donation: 'New Donation',
  system: 'System Update',
};

export function NotificationsDashboard({
  notifications,
  onMarkAsRead,
  onDismiss,
  onClearAll,
  onActionClick,
  isLoading = false,
}: NotificationsDashboardProps) {
  const [filterType, setFilterType] = useState<NotificationType | 'all'>('all');
  const [displayedNotifications, setDisplayedNotifications] = useState(notifications);

  const unreadCount = displayedNotifications.filter(n => !n.read).length;
  const filteredNotifications =
    filterType === 'all'
      ? displayedNotifications
      : displayedNotifications.filter(n => n.type === filterType);

  const handleMarkAsRead = async (notification: Notification) => {
    if (!notification.read && onMarkAsRead) {
      try {
        await onMarkAsRead(notification.id);
        setDisplayedNotifications(prev =>
          prev.map(n => (n.id === notification.id ? { ...n, read: true } : n))
        );
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }
  };

  const handleDismiss = async (notificationId: string) => {
    if (onDismiss) {
      try {
        await onDismiss(notificationId);
        setDisplayedNotifications(prev => prev.filter(n => n.id !== notificationId));
      } catch (error) {
        console.error('Failed to dismiss notification:', error);
      }
    }
  };

  const handleClearAll = async () => {
    if (onClearAll) {
      try {
        await onClearAll();
        setDisplayedNotifications([]);
      } catch (error) {
        console.error('Failed to clear all:', error);
      }
    }
  };

  const filterOptions: Array<{ value: NotificationType | 'all'; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'signature', label: 'Signatures' },
    { value: 'comment', label: 'Comments' },
    { value: 'milestone', label: 'Milestones' },
    { value: 'achievement', label: 'Achievements' },
    { value: 'donation', label: 'Donations' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="w-full space-y-6"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            Notifications
          </h2>
          {unreadCount > 0 && (
            <motion.p
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-sm text-emerald-600 dark:text-emerald-400 mt-1"
            >
              {unreadCount} unread
            </motion.p>
          )}
        </div>

        {displayedNotifications.length > 0 && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClearAll}
            className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            Clear All
          </motion.button>
        )}
      </motion.div>

      {/* Filter Tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="flex gap-2 overflow-x-auto pb-2"
      >
        {filterOptions.map((option) => (
          <motion.button
            key={option.value}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilterType(option.value)}
            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
              filterType === option.value
                ? 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-lg'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            {option.label}
          </motion.button>
        ))}
      </motion.div>

      {/* Notifications List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        {isLoading ? (
          <motion.div className="text-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="h-8 w-8 border-4 border-emerald-200 dark:border-emerald-800 border-t-emerald-600 dark:border-t-emerald-400 rounded-full mx-auto"
            />
          </motion.div>
        ) : filteredNotifications.length > 0 ? (
          <AnimatePresence>
            {filteredNotifications.map((notification, index) => {
              const colors = notificationColors[notification.type];
              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    handleMarkAsRead(notification);
                    if (onActionClick) {
                      onActionClick(notification);
                    }
                  }}
                  className={`
                    rounded-lg border-2 p-4 cursor-pointer transition-all
                    ${colors.bg} ${colors.border}
                    ${!notification.read ? 'ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-zinc-950' : ''}
                    hover:shadow-md
                  `}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <motion.div
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: index * 0.05 + 0.1 }}
                      className="text-2xl flex-shrink-0"
                    >
                      {notification.icon || notificationColors[notification.type].icon}
                    </motion.div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {notification.title}
                        </h3>
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-xs font-medium text-zinc-500 dark:text-zinc-500 whitespace-nowrap"
                        >
                          {notification.timestamp.toLocaleDateString()}
                        </motion.span>
                      </div>

                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 + 0.05 }}
                        className="text-sm text-zinc-700 dark:text-zinc-300 mb-3"
                      >
                        {notification.message}
                      </motion.p>

                      {/* Type Badge & Action */}
                      <div className="flex items-center justify-between">
                        <span className="inline-block px-2 py-1 bg-white/50 dark:bg-black/30 rounded text-xs font-medium text-zinc-700 dark:text-zinc-300">
                          {typeLabels[notification.type]}
                        </span>

                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDismiss(notification.id);
                          }}
                          className="text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </motion.button>
                      </div>
                    </div>

                    {/* Unread Indicator */}
                    {!notification.read && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex-shrink-0 h-3 w-3 rounded-full bg-emerald-500 dark:bg-emerald-400"
                      />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center py-16"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-4xl mb-4"
            >
              ✨
            </motion.div>
            <p className="text-zinc-500 dark:text-zinc-400">
              {filterType === 'all'
                ? 'No notifications yet. Stay tuned!'
                : `No ${filterOptions.find(o => o.value === filterType)?.label.toLowerCase()} notifications.`}
            </p>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
