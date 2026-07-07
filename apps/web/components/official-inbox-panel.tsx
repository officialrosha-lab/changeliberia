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
  const token = useAuthStore((s) => s.token);
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void (async () => {
      try {
        const result = await apiGet<{ data: InboxItem[] }>('/officials/me/inbox', token);
        if (!cancelled) setItems(result.data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) return <p className="text-sm text-zinc-500">Loading inbox…</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-extrabold text-zinc-900">Government Inbox</h2>
      {items.length === 0 && <p className="text-sm text-zinc-500">Your inbox is empty.</p>}
      {items.map((item) => (
        <div key={`${item.type}-${item.id}`} className="rounded-2xl border border-zinc-200 p-4">
          {item.type === 'petition' && item.petition ? (
            <>
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-800">
                Petition · {item.stage?.replaceAll('_', ' ')}
              </span>
              <p className="mt-2 font-semibold text-zinc-900 break-words">{item.petition.title}</p>
              <p className="mt-1 text-sm text-zinc-500 break-words">{item.petition.summary}</p>
            </>
          ) : (
            <>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-[0.2em] ${item.isRead ? 'bg-zinc-100 text-zinc-600' : 'bg-blue-100 text-blue-800'}`}>
                Message{item.isRead ? '' : ' · unread'}
              </span>
              <p className="mt-2 font-semibold text-zinc-900">{item.sender?.fullName ?? 'Unknown sender'}</p>
              <p className="mt-1 text-sm text-zinc-500 break-words">{item.content}</p>
            </>
          )}
          <p className="mt-2 text-xs text-zinc-400">{new Date(item.timestamp).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}
