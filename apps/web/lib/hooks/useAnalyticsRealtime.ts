import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore, type AuthState } from '../store';

export interface AnalyticsUpdate {
  type: 'message_count' | 'broadcast_count' | 'message_created' | 'broadcast_sent' | 'metrics_updated';
  timestamp: string;
  data: Record<string, unknown>;
}

interface UseAnalyticsRealtimeOptions {
  types?: AnalyticsUpdate['type'][];
  autoConnect?: boolean;
}

/**
 * Hook to subscribe to real-time analytics updates via WebSocket
 * Automatically handles connection, authentication, and subscription
 */
export function useAnalyticsRealtime(options: UseAnalyticsRealtimeOptions = {}) {
  const { types = ['message_count', 'broadcast_count'], autoConnect = true } = options;
  const token = useAuthStore((s: AuthState) => s.token);
  const [connected, setConnected] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [update, setUpdate] = useState<AnalyticsUpdate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const getApiBase = useCallback(() => {
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${protocol}//${process.env.NEXT_PUBLIC_API_HOST || window.location.host}`;
    }
    return 'http://localhost:4000';
  }, []);

  const connect = useCallback(async () => {
    if (!token || socketRef.current?.connected) {
      return;
    }

    try {
      setError(null);
      const socket = io(`${getApiBase()}/analytics`, {
        auth: {
          token,
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      socket.on('connect', () => {
        console.log('[Analytics] Connected to real-time updates');
        setConnected(true);

        // Send subscription message
        const state = useAuthStore.getState();
        const roles = ['ADMIN']; // Default roles for analytics subscribers
        const userId = state.userEmail || 'anonymous';

        socket.emit('subscribe_analytics', {
          userId,
          types,
          roles,
        });
      });

      socket.on('subscribed', (data) => {
        console.log('[Analytics] Subscribed:', data);
        setSubscribed(true);
      });

      socket.on('analytics_update', (data: AnalyticsUpdate) => {
        console.log('[Analytics] Received update:', data.type);
        setUpdate(data);
      });

      socket.on('disconnect', () => {
        console.log('[Analytics] Disconnected from real-time updates');
        setConnected(false);
        setSubscribed(false);
      });

      socket.on('error', (err: Error) => {
        console.error('[Analytics] WebSocket error:', err);
        setError(err.message);
      });

      socket.on('connect_error', (err: Error) => {
        console.error('[Analytics] Connection error:', err);
        setError(err.message);
      });

      socketRef.current = socket;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect to analytics';
      console.error('[Analytics] Connection failed:', message);
      setError(message);
    }
  }, [token, types, getApiBase]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('unsubscribe_analytics');
      socketRef.current.disconnect();
      socketRef.current = null;
      setConnected(false);
      setSubscribed(false);
    }
  }, []);

  // Auto-connect on mount if enabled and token available
  useEffect(() => {
    if (autoConnect && token && !socketRef.current?.connected) {
      connect();
    }

    return () => {
      // Keep connection alive on unmount for shared hook usage
      // Individual components should call disconnect() if needed
    };
  }, [token, autoConnect, connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Only disconnect if this is the last consumer
      // In practice, you might want a ref counter for multiple subscribers
    };
  }, []);

  return {
    connected,
    subscribed,
    update,
    error,
    connect,
    disconnect,
  };
}

/**
 * Hook to get typed analytics update with filtering
 */
export function useAnalyticsUpdate<T extends AnalyticsUpdate['type']>(
  type: T,
  options: UseAnalyticsRealtimeOptions = {},
) {
  const [typedUpdate, setTypedUpdate] = useState<AnalyticsUpdate | null>(null);
  const { update, ...rest } = useAnalyticsRealtime({
    ...options,
    types: [type, ...(options.types || [])],
  });

  useEffect(() => {
    if (update?.type === type) {
      setTypedUpdate(update);
    }
  }, [update, type]);

  return {
    update: typedUpdate,
    ...rest,
  };
}

/**
 * Hook to aggregate multiple analytics updates
 */
export function useAnalyticsMultiple(
  types: AnalyticsUpdate['type'][],
  options: UseAnalyticsRealtimeOptions = {},
) {
  const [updates, setUpdates] = useState<Record<AnalyticsUpdate['type'], AnalyticsUpdate | null>>({
    message_count: null,
    broadcast_count: null,
    message_created: null,
    broadcast_sent: null,
    metrics_updated: null,
  });

  const { update, ...rest } = useAnalyticsRealtime({
    ...options,
    types,
  });

  useEffect(() => {
    if (update) {
      setUpdates((prev) => ({
        ...prev,
        [update.type]: update,
      }));
    }
  }, [update]);

  return {
    updates,
    ...rest,
  };
}
