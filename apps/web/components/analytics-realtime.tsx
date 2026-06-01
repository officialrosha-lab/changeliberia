'use client';

import { useEffect, useState } from 'react';
import { useAnalyticsMultiple } from '../lib/hooks/useAnalyticsRealtime';

interface AnalyticsNotificationBadgeProps {
  showLastUpdate?: boolean;
  autoHideDelay?: number;
}

/**
 * Component that displays real-time analytics update notifications
 * Shows badge with update count and last update timestamp
 */
export function AnalyticsNotificationBadge({
  showLastUpdate = true,
  autoHideDelay = 5000,
}: AnalyticsNotificationBadgeProps) {
  const { updates, connected } = useAnalyticsMultiple([
    'message_created',
    'broadcast_sent',
    'message_count',
    'broadcast_count',
  ]);

  const [updateCount, setUpdateCount] = useState(0);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasUpdate = Object.values(updates).some((u) => u !== null);
    if (hasUpdate) {
      setUpdateCount((c) => c + 1);
      setLastUpdateTime(new Date());
      setIsVisible(true);

      // Auto-hide notification
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [updates, autoHideDelay]);

  if (!connected) {
    return null;
  }

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
      <div className="rounded-lg bg-emerald-500 text-white px-4 py-3 shadow-lg flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-200 rounded-full animate-pulse" />
          <span className="font-medium text-sm">Analytics Updated</span>
        </div>
        {showLastUpdate && lastUpdateTime && (
          <span className="text-xs text-emerald-100">
            {lastUpdateTime.toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Component that shows detailed real-time metrics summary
 */
export function AnalyticsRealtimeSummary() {
  const { updates, connected } = useAnalyticsMultiple([
    'message_count',
    'broadcast_count',
  ]);

  if (!connected) {
    return null;
  }

  const messageCount = updates.message_count?.data as {
    totalMessages?: number;
    messagesLastHour?: number;
  } | null;
  const broadcastCount = updates.broadcast_count?.data as {
    totalBroadcasts?: number;
    broadcastsLastHour?: number;
  } | null;

  return (
    <div className="flex gap-4">
      {messageCount && (
        <div className="px-3 py-2 bg-blue-50 rounded-lg border border-blue-200 dark:bg-blue-950 dark:border-blue-800">
          <p className="text-xs text-blue-600 dark:text-blue-300">Messages (Last Hour)</p>
          <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
            {messageCount.messagesLastHour || 0}
          </p>
        </div>
      )}
      {broadcastCount && (
        <div className="px-3 py-2 bg-purple-50 rounded-lg border border-purple-200 dark:bg-purple-950 dark:border-purple-800">
          <p className="text-xs text-purple-600 dark:text-purple-300">Broadcasts (Last Hour)</p>
          <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
            {broadcastCount.broadcastsLastHour || 0}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Component that shows live update feed
 */
interface RecentUpdate {
  id: string;
  type: string;
  message: string;
  timestamp: Date;
}

export function AnalyticsLiveUpdateFeed() {
  const { updates, connected } = useAnalyticsMultiple([
    'message_created',
    'broadcast_sent',
  ]);

  const [feed, setFeed] = useState<RecentUpdate[]>([]);

  useEffect(() => {
    if (updates.message_created) {
      const data = updates.message_created.data as {
        subject?: string;
        senderEmail?: string;
      };
      const newUpdate: RecentUpdate = {
        id: `msg-${Date.now()}`,
        type: 'message',
        message: `New message: ${data.subject || 'Untitled'}`,
        timestamp: new Date(),
      };
      setFeed((prev) => [newUpdate, ...prev.slice(0, 9)]);
    }
  }, [updates.message_created]);

  useEffect(() => {
    if (updates.broadcast_sent) {
      const data = updates.broadcast_sent.data as {
        title?: string;
        recipientCount?: number;
      };
      const newUpdate: RecentUpdate = {
        id: `bc-${Date.now()}`,
        type: 'broadcast',
        message: `Broadcast sent: ${data.title || 'Untitled'} (${data.recipientCount || 0} recipients)`,
        timestamp: new Date(),
      };
      setFeed((prev) => [newUpdate, ...prev.slice(0, 9)]);
    }
  }, [updates.broadcast_sent]);

  if (!connected || feed.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <h3 className="text-sm font-semibold text-zinc-900 mb-3 dark:text-neutral-50">Live Updates</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {feed.map((item) => (
          <div
            key={item.id}
            className="text-xs p-2 bg-zinc-50 rounded dark:bg-neutral-800 flex items-start justify-between"
          >
            <div>
              <span
                className={`inline-block px-2 py-0.5 rounded text-white text-xs font-medium mr-2 ${
                  item.type === 'message' ? 'bg-blue-500' : 'bg-purple-500'
                }`}
              >
                {item.type === 'message' ? 'MSG' : 'BC'}
              </span>
              <span className="text-zinc-700 dark:text-neutral-300">{item.message}</span>
            </div>
            <span className="text-zinc-500 dark:text-neutral-500 whitespace-nowrap ml-2">
              {item.timestamp.toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
