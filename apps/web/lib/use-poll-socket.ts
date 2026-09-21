'use client';

import { useCallback } from 'react';
import { subscribeToChannel } from './supabase-realtime';

type PollUpdate = {
  pollId: string;
  totalVotes: number;
  options: Array<{ id: string; voteCount: number }>;
};

interface UsePollSocketOptions {
  pollId: string;
}

/**
 * Real-time poll vote updates via Supabase Realtime broadcast on the
 * `poll:{id}` channel — replaces the Socket.IO connection to the API's
 * `/polls` namespace (removed along with the persistent server that hosted
 * it; see apps/api/src/polls/polls.gateway.ts).
 */
export function usePollSocket({ pollId }: UsePollSocketOptions) {
  const onPollUpdate = useCallback(
    (callback: (update: PollUpdate) => void) => {
      if (!pollId) return () => {};
      return subscribeToChannel(`poll:${pollId}`, {
        pollUpdated: callback,
      });
    },
    [pollId],
  );

  return { onPollUpdate };
}
