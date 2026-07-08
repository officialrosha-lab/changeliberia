'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from './store';
import { apiGet, getApiBase } from './api';

interface NotificationEvent {
  id: string;
  type: string;
  title: string;
  message: string;
  status: 'UNREAD' | 'READ' | 'ARCHIVED';
  createdAt: string;
  metadata?: any;
}

interface UseNotificationSocketProps {
  onNewNotification?: (notification: NotificationEvent) => void;
  onNotificationRead?: (notificationId: string) => void;
  onAllNotificationsRead?: () => void;
  onNotificationArchived?: (notificationId: string) => void;
}

/**
 * The notifications gateway is a Socket.IO namespace on the API server
 * (apps/api/src/events/notifications.gateway.ts). Rooms are keyed by the
 * DB user id, so we resolve it once via /users/me before subscribing.
 */
function getSocketOrigin(): string {
  try {
    return new URL(
      getApiBase(),
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4000',
    ).origin;
  } catch {
    return 'http://localhost:4000';
  }
}

/**
 * Hook for real-time notification updates via Socket.IO.
 * Automatically connects/disconnects based on authentication status.
 */
export function useNotificationSocket({
  onNewNotification,
  onNotificationRead,
  onAllNotificationsRead,
  onNotificationArchived,
}: UseNotificationSocketProps) {
  const token = useAuthStore((s) => s.token);
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Keep latest callbacks in a ref so socket listeners never go stale
  // without needing to reconnect on every render.
  const callbacksRef = useRef({
    onNewNotification,
    onNotificationRead,
    onAllNotificationsRead,
    onNotificationArchived,
  });
  callbacksRef.current = {
    onNewNotification,
    onNotificationRead,
    onAllNotificationsRead,
    onNotificationArchived,
  };

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (!token) {
      disconnect();
      return;
    }

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

      const socket = io(`${getSocketOrigin()}/notifications`, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000,
        reconnectionAttempts: 5,
      });

      socket.on('connect', () => {
        setIsConnected(true);
        socket.emit('subscribe_notifications', { userId });
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
      });

      socket.on('subscribed', (data: { userId: string }) => {
        console.log('[NotificationSocket] Subscribed for user:', data.userId);
      });

      socket.on('new_notification', (data: NotificationEvent) => {
        callbacksRef.current.onNewNotification?.(data);
      });

      socket.on('notification_read', (data: { notificationId: string }) => {
        callbacksRef.current.onNotificationRead?.(data.notificationId);
      });

      socket.on('all_notifications_read', () => {
        callbacksRef.current.onAllNotificationsRead?.();
      });

      socket.on('notification_archived', (data: { notificationId: string }) => {
        callbacksRef.current.onNotificationArchived?.(data.notificationId);
      });

      socket.on('error', (data: { message?: string }) => {
        console.error('[NotificationSocket] Server error:', data?.message);
      });

      socketRef.current = socket;
    };

    void connect();

    return () => {
      cancelled = true;
      disconnect();
    };
  }, [token, disconnect]);

  return {
    isConnected,
    disconnect,
    reconnect: () => {
      socketRef.current?.connect();
    },
  };
}
