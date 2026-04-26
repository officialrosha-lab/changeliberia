'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from './store';

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
 * Hook for real-time notification updates via WebSocket
 * Automatically connects/disconnects based on authentication status
 * Gracefully handles connection failures and reconnects with exponential backoff
 */
export function useNotificationSocket({
  onNewNotification,
  onNotificationRead,
  onAllNotificationsRead,
  onNotificationArchived,
}: UseNotificationSocketProps) {
  const { token, userEmail } = useAuthStore();
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttemptsRef = useRef(5);
  const baseReconnectDelayRef = useRef(1000); // 1 second

  const connect = useCallback(() => {
    if (!token || !userEmail) {
      console.log('[WebSocket] No authentication token or email, skipping connection');
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/notifications`;

      console.log('[WebSocket] Connecting to:', wsUrl);
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[WebSocket] Connected');
        reconnectAttemptsRef.current = 0;

        // Subscribe to notifications after connection
        // For now, we use email as user identifier (will be replaced with actual userId from response)
        ws.send(
          JSON.stringify({
            event: 'subscribe_notifications',
            data: { userId: userEmail || token },
          }),
        );
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('[WebSocket] Message received:', message.event);

          switch (message.event) {
            case 'new_notification':
              onNewNotification?.(message.data);
              break;
            case 'notification_read':
              onNotificationRead?.(message.data.notificationId);
              break;
            case 'all_notifications_read':
              onAllNotificationsRead?.();
              break;
            case 'notification_archived':
              onNotificationArchived?.(message.data.notificationId);
              break;
            case 'subscribed':
              console.log('[WebSocket] Successfully subscribed for user:', message.data.userId);
              break;
            case 'error':
              console.error('[WebSocket] Server error:', message.data.message);
              break;
          }
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
      };

      ws.onclose = () => {
        console.log('[WebSocket] Closed');
        socketRef.current = null;

        // Attempt reconnection with exponential backoff
        if (reconnectAttemptsRef.current < maxReconnectAttemptsRef.current) {
          const delay = baseReconnectDelayRef.current * Math.pow(2, reconnectAttemptsRef.current);
          console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1})`);
          reconnectAttemptsRef.current++;

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          console.log('[WebSocket] Max reconnection attempts reached, falling back to polling');
        }
      };

      socketRef.current = ws;
    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
    }
  }, [token, userEmail, onNewNotification, onNotificationRead, onAllNotificationsRead, onNotificationArchived]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Connect on mount/user change
  useEffect(() => {
    if (token && userEmail) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [token, userEmail, connect, disconnect]);

  return {
    isConnected: socketRef.current?.readyState === WebSocket.OPEN,
    disconnect,
    reconnect: () => {
      disconnect();
      reconnectAttemptsRef.current = 0;
      connect();
    },
  };
}
