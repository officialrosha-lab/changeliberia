'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from './store';
import { apiGet } from './api';
import { subscribeToChannel } from './supabase-realtime';

interface NotificationEvent {
  id: string;
  type: string;
  title: string;
  message: string;
  status: 'UNREAD' | 'READ' | 'ARCHIVED';
  createdAt: string;
  metadata?: unknown;
}

interface UseNotificationSocketProps {
  onNewNotification?: (notification: NotificationEvent) => void;
  onNotificationRead?: (notificationId: string) => void;
  onAllNotificationsRead?: () => void;
  onNotificationArchived?: (notificationId: string) => void;
}

/**
 * Hook for real-time notification updates via Supabase Realtime broadcast on
 * the per-user `user:{id}` channel — replaces the Socket.IO connection to
 * the API's `/notifications` namespace (removed along with the persistent
 * server that hosted it; see apps/api/src/events/notifications.gateway.ts).
 * Automatically (un)subscribes based on authentication status.
 */
export function useNotificationSocket({
  onNewNotification,
  onNotificationRead,
  onAllNotificationsRead,
  onNotificationArchived,
}: UseNotificationSocketProps) {
  const token = useAuthStore((s) => s.token);
  const [isConnected, setIsConnected] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Keep latest callbacks in a ref so listeners never go stale without
  // needing to reconnect on every render.
  const callbacksRef = useRef({
    onNewNotification,
    onNotificationRead,
    onAllNotificationsRead,
    onNotificationArchived,
  });
  useEffect(() => {
    callbacksRef.current = {
      onNewNotification,
      onNotificationRead,
      onAllNotificationsRead,
      onNotificationArchived,
    };
  });

  const disconnect = useCallback(() => {
    unsubscribeRef.current?.();
    unsubscribeRef.current = null;
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    const connect = async () => {
      let userId: string | undefined;
      try {
        const me = await apiGet<{ id: string }>('/users/me', token);
        userId = me?.id;
      } catch {
        console.log('[NotificationSocket] Could not resolve user id, skipping connection');
        return;
      }
      if (cancelled || !userId) return;

      unsubscribeRef.current = subscribeToChannel(`user:${userId}`, {
        new_notification: (data: NotificationEvent) => callbacksRef.current.onNewNotification?.(data),
        notification_read: (data: { notificationId: string }) =>
          callbacksRef.current.onNotificationRead?.(data.notificationId),
        all_notifications_read: () => callbacksRef.current.onAllNotificationsRead?.(),
        notification_archived: (data: { notificationId: string }) =>
          callbacksRef.current.onNotificationArchived?.(data.notificationId),
      });
      setIsConnected(true);
    };

    void connect();

    // Cleanup — runs on unmount and whenever `token` changes (including to
    // falsy), so this also covers the "logged out" disconnect case.
    return () => {
      cancelled = true;
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
      setIsConnected(false);
    };
  }, [token]);

  return {
    isConnected,
    disconnect,
    reconnect: () => {
      // Re-run the effect: the caller can re-toggle auth state, or a fresh
      // mount re-subscribes automatically. Kept for API compatibility.
    },
  };
}
