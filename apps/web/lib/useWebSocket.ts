'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseWebSocketOptions {
  autoConnect?: boolean;
  url?: string;
}

interface PetitionUpdate {
  id: string;
  signaturesCount: number;
  todaySignatures: number;
}

interface PulseMapData {
  hotspots: Array<{
    name: string;
    latitude: number;
    longitude: number;
    intensity: number;
    petitions: number;
  }>;
}

/**
 * Hook to connect to WebSocket server and listen for real-time updates
 */
export function useWebSocket(options: UseWebSocketOptions = {}) {
  const socketRef = useRef<Socket | null>(null);
  const url = options.url || 'http://localhost:3001';
  const autoConnect = options.autoConnect !== false;

  useEffect(() => {
    if (!autoConnect) return;

    // Connect to WebSocket server
    const socket = io(`${url}/petitions`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('WebSocket connected:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    socketRef.current = socket;

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [url, autoConnect]);

  const subscribeToPetition = useCallback((petitionId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('subscribe_petition', { petitionId });
    }
  }, []);

  const getTrending = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('get_trending');
    }
  }, []);

  const getPulseMap = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('get_pulse_map');
    }
  }, []);

  const onSignatureUpdate = useCallback(
    (callback: (data: PetitionUpdate) => void) => {
      if (socketRef.current) {
        socketRef.current.on('signature_update', callback);
        return () => {
          socketRef.current?.off('signature_update', callback);
        };
      }
      return () => {};
    },
    [],
  );

  const onNewSignature = useCallback(
    (callback: (data: any) => void) => {
      if (socketRef.current) {
        socketRef.current.on('new_signature', callback);
        return () => {
          socketRef.current?.off('new_signature', callback);
        };
      }
      return () => {};
    },
    [],
  );

  const onPulseMapData = useCallback(
    (callback: (data: PulseMapData) => void) => {
      if (socketRef.current) {
        socketRef.current.on('pulse_map_data', callback);
        return () => {
          socketRef.current?.off('pulse_map_data', callback);
        };
      }
      return () => {};
    },
    [],
  );

  const onTrendingPetitions = useCallback(
    (callback: (data: any) => void) => {
      if (socketRef.current) {
        socketRef.current.on('trending_petitions', callback);
        return () => {
          socketRef.current?.off('trending_petitions', callback);
        };
      }
      return () => {};
    },
    [],
  );

  const onPetitionUpdate = useCallback(
    (callback: (data: any) => void) => {
      if (socketRef.current) {
        socketRef.current.on('petition_update', callback);
        return () => {
          socketRef.current?.off('petition_update', callback);
        };
      }
      return () => {};
    },
    [],
  );

  return {
    subscribeToPetition,
    getTrending,
    getPulseMap,
    onSignatureUpdate,
    onNewSignature,
    onPulseMapData,
    onTrendingPetitions,
    onPetitionUpdate,
    isConnected: socketRef.current?.connected ?? false,
  };
}
