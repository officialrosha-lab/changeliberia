'use client';

import { useEffect, useRef, useCallback } from 'react';
import { subscribeToChannel } from './supabase-realtime';

interface UseWebSocketOptions {
  /** When provided, also subscribes to that petition's `signature_update` channel. */
  petitionId?: string;
}

interface SignatureUpdate {
  petitionId: string;
  signaturesCount: number;
  todaySignatures: number;
}

interface NewSignature {
  petitionId: string;
  county?: string;
  latitude?: number;
  longitude?: number;
  timestamp: string;
  signerName?: string;
  anonymous?: boolean;
}

/**
 * Real-time petition updates via Supabase Realtime broadcast — replaces the
 * old Socket.IO connection to the API's `/petitions` namespace (removed
 * along with the persistent server that hosted it; see
 * apps/api/src/events/petitions.gateway.ts).
 */
export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { petitionId } = options;
  const signatureUpdateListeners = useRef(new Set<(data: SignatureUpdate) => void>());
  const newSignatureListeners = useRef(new Set<(data: NewSignature) => void>());

  useEffect(() => {
    const unsubscribe = subscribeToChannel('petitions:global', {
      new_signature: (payload: NewSignature) => {
        newSignatureListeners.current.forEach((cb) => cb(payload));
      },
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!petitionId) return undefined;
    const unsubscribe = subscribeToChannel(`petition:${petitionId}`, {
      signature_update: (payload: SignatureUpdate) => {
        signatureUpdateListeners.current.forEach((cb) => cb(payload));
      },
    });
    return unsubscribe;
  }, [petitionId]);

  const onSignatureUpdate = useCallback((callback: (data: SignatureUpdate) => void) => {
    signatureUpdateListeners.current.add(callback);
    return () => {
      signatureUpdateListeners.current.delete(callback);
    };
  }, []);

  const onNewSignature = useCallback((callback: (data: NewSignature) => void) => {
    newSignatureListeners.current.add(callback);
    return () => {
      newSignatureListeners.current.delete(callback);
    };
  }, []);

  return {
    onSignatureUpdate,
    onNewSignature,
  };
}
