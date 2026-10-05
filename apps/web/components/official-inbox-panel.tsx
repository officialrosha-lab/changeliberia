'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '../lib/api';
import { useAuthStore } from '../lib/store';

interface InboxItem {
  type: 'petition' | 'message';
  id: string;
  timestamp: string;
  stage?: string;
  petition?: { id: string; title: string; summary: string; county: string | null; signaturesCount: number };
  isRead?: boolean;
  sender?: { id: string; fullName: string };
  content?: string;
}

export function OfficialInboxPanel() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    void (async () => {
      try {
        const result = await apiGet<{ data: InboxItem[] }>('/officials/me/inbox');
        if (!cancelled) setItems(result.data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  if (loading) return <p className="text-sm text-zinc-500 dark:text-neutral-400">Loading inbox…</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white">Government Inbox</h2>
      {items.length === 0 && <p className="text-sm text-zinc-500 dark:text-neutral-400">Your inbox is empty.</p>}
      {items.map((item) => (
        <div key={`${item.type}-${item.id}`} className="rounded-2xl border border-zinc-200 p-4 dark:border-neutral-700">
          {item.type === 'petition' && item.petition ? (
            <>
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300">
                Petition · {item.stage?.replaceAll('_', ' ')}
              </span>
              <p className="mt-2 font-semibold text-zinc-900 dark:text-white break-words">{item.petition.title}</p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-neutral-400 break-words">{item.petition.summary}</p>
            </>
          ) : (
            <>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-[0.2em] ${item.isRead ? 'bg-zinc-100 text-zinc-600 dark:bg-neutral-800 dark:text-neutral-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'}`}>
                Message{item.isRead ? '' : ' · unread'}
              </span>
              <p className="mt-2 font-semibold text-zinc-900 dark:text-white">{item.sender?.fullName ?? 'Unknown sender'}</p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-neutral-400 break-words">{item.content}</p>
            </>
          )}
          <p className="mt-2 text-xs text-zinc-400 dark:text-neutral-500">{new Date(item.timestamp).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}
