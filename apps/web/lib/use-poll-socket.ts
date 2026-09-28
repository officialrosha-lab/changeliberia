'use client';

import { useEffect, useMemo, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';

type PollUpdate = {
  pollId: string;
  totalVotes: number;
  options: Array<{ id: string; voteCount: number }>;
};

interface UsePollSocketOptions {
  pollId: string;
  url?: string;
}

export function usePollSocket({ pollId, url }: UsePollSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const namespaceUrl = useMemo(() => {
    const base = url || process.env.NEXT_PUBLIC_API_URL || '';
    if (!base) {
      return '/polls';
    }

    try {
      const origin = new URL(base, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4000').origin;
      return `${origin}/polls`;
    } catch {
      return '/polls';
    }
  }, [url]);

  useEffect(() => {
    const socket = io(namespaceUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      if (pollId) {
        socket.emit('subscribe_poll', { pollId });
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    return () => {
      if (socketRef.current) {
        if (pollId) {
          socketRef.current.emit('unsubscribe_poll', { pollId });
        }
        socketRef.current.disconnect();
      }
    };
  }, [namespaceUrl, pollId]);

  const onPollUpdate = useCallback(
    (callback: (update: PollUpdate) => void) => {
      if (!socketRef.current) return () => {};
      socketRef.current.on('pollUpdated', callback);
      return () => {
        socketRef.current?.off('pollUpdated', callback);
      };
    },
    [],
  );

  const onConnected = useCallback((callback: () => void) => {
    if (!socketRef.current) return () => {};
    socketRef.current.on('connect', callback);
    return () => {
      socketRef.current?.off('connect', callback);
    };
  }, []);

  return {
    onPollUpdate,
    onConnected,
    isConnected,
  };
}
