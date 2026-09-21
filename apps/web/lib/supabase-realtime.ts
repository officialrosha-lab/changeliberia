'use client';

import { createClient, type RealtimeChannel } from '@supabase/supabase-js';

let client: ReturnType<typeof createClient> | undefined;

/**
 * Public (anon-key) Supabase client, used only for Realtime broadcast
 * subscriptions on the client — replaces the Socket.IO connections this app
 * used to open against the API server. No database/storage access happens
 * through this client; all data still goes through the REST API.
 */
function getSupabaseClient() {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set');
    }
    client = createClient(url, anonKey);
  }
  return client;
}

/**
 * Subscribes to a broadcast channel and invokes `onEvent` for each named
 * event. Returns an unsubscribe function.
 */
export function subscribeToChannel(
  channelName: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- callers supply their own payload type per event
  handlers: Record<string, (payload: any) => void>,
): () => void {
  const supabase = getSupabaseClient();
  let channel: RealtimeChannel = supabase.channel(channelName);
  for (const [event, handler] of Object.entries(handlers)) {
    channel = channel.on('broadcast', { event }, ({ payload }) => handler(payload));
  }
  channel.subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
