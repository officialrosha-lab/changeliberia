'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  status: 'UNREAD' | 'READ' | 'ARCHIVED';
  createdAt: string;
  metadata?: string | null;
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onArchive: (id: string) => void;
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onArchive,
}: NotificationItemProps) {
  const isUnread = notification.status === 'UNREAD';
  const metadata = notification.metadata ? JSON.parse(notification.metadata) : {};

  const getIconColor = () => {
    switch (notification.type) {
      case 'SIGNATURE_RECEIVED':
        return 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400';
      case 'PETITION_APPROVED':
        return 'bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400';
      case 'PETITION_REJECTED':
        return 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400';
      case 'DONATION_RECEIVED':
        return 'bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400';
      default:
        return 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400';
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'SIGNATURE_RECEIVED':
        return '✓'; // Checkmark
      case 'PETITION_APPROVED':
        return '🎉'; // Celebration
      case 'PETITION_REJECTED':
        return '⚠️'; // Warning
      case 'DONATION_RECEIVED':
        return '💝'; // Gift
      case 'COMMENT_REPLY':
        return '💬'; // Chat
      default:
        return 'ℹ️'; // Info
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className={`flex gap-3 p-3 rounded-lg transition-colors ${
        isUnread
          ? 'bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-900'
          : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800'
      }`}
    >
      {/* Icon */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-lg ${getIconColor()}`}>
        {getIcon()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate">
          {notification.title}
        </h4>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 mt-1">
          {notification.message}
        </p>
        <time className="text-xs text-zinc-500 dark:text-zinc-500 mt-2 block">
          {new Date(notification.createdAt).toLocaleDateString()}
        </time>
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 flex gap-1">
        {isUnread && (
          <button
            onClick={() => onMarkAsRead(notification.id)}
            className="p-1.5 hover:bg-white dark:hover:bg-zinc-800 rounded transition focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500"
            title="Mark as read"
          >
            <svg className="h-4 w-4 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        )}
        <button
          onClick={() => onArchive(notification.id)}
          className="p-1.5 hover:bg-white dark:hover:bg-zinc-800 rounded transition focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500"
          title="Archive"
        >
          <svg className="h-4 w-4 text-zinc-400 dark:text-zinc-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4V5h12v10z" />
          </svg>
        </button>
      </div>
    </motion.div>
  );
}
