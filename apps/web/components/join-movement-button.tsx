'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { apiGet, apiPost } from '../lib/api';

const SESSION_KEY = 'cl_session_id';
const JOINED_KEY = 'cl_supporter_joined';

function getOrCreateSessionId(): string {
  let sid = localStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

type Phase = 'idle' | 'modal' | 'capture' | 'done';

export function JoinMovementButton() {
  const [count, setCount] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  // Only portal after hydration — createPortal needs document to exist
  const [mounted, setMounted] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
    if (localStorage.getItem(JOINED_KEY) === 'true') setPhase('done');
    void apiGet<{ count: number }>('/supporters/count')
      .then((d) => setCount(d.count))
      .catch(() => null);
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current); };
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 3500);
  }

  async function handleJoin() {
    setLoading(true);
    try {
      const sessionId = getOrCreateSessionId();
      const res = await apiPost<{ count: number; alreadyJoined: boolean }>(
        '/supporters/join',
        { sessionId, source: 'navbar' },
      );
      localStorage.setItem(JOINED_KEY, 'true');
      setCount(res.count);
      setPhase('capture');
      showToast("You're part of the movement 🇱🇷");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveContact() {
    if (!email && !phone) { setPhase('done'); return; }
    setSaving(true);
    try {
      const sessionId = getOrCreateSessionId();
      await apiPost('/supporters/update-contact', {
        sessionId,
        ...(email ? { email } : {}),
        ...(phone ? { phone } : {}),
      });
    } catch {
      // non-blocking
    } finally {
      setSaving(false);
      setPhase('done');
    }
  }

  const overlayClick = (cb: () => void) => (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) cb();
  };

  // Overlays portaled to document.body so they escape the header's
  // backdrop-blur stacking context and always cover the full viewport.
  const portals = mounted ? createPortal(
    <>
      {/* Toast */}
      {toast && (
        <div
          aria-live="polite"
          className="fixed bottom-24 left-1/2 z-[9999] -translate-x-1/2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-xl dark:bg-emerald-500 md:bottom-6"
        >
          {toast}
        </div>
      )}

      {/* Join modal */}
      {phase === 'modal' && (
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={overlayClick(() => setPhase('idle'))}
        >
          <div className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-2xl dark:bg-neutral-900">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl dark:bg-emerald-950">
                🇱🇷
              </div>
              <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white">
                Stand with Change Liberia
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-neutral-400">
                By joining, you show solidarity with our mission to turn citizen voices into real action and accountability.
              </p>
              {count !== null && (
                <p className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {count.toLocaleString()} people already standing with us
                </p>
              )}
            </div>
            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleJoin}
                disabled={loading}
                className="w-full rounded-2xl bg-emerald-600 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60 dark:bg-emerald-500 dark:hover:bg-emerald-400"
              >
                {loading ? 'Joining…' : 'Join Now'}
              </button>
              <button
                type="button"
                onClick={() => setPhase('idle')}
                className="w-full rounded-2xl py-2.5 text-sm font-medium text-zinc-400 transition hover:text-zinc-600 dark:text-neutral-500 dark:hover:text-neutral-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Soft capture */}
      {phase === 'capture' && (
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={overlayClick(() => setPhase('done'))}
        >
          <div className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-2xl dark:bg-neutral-900">
            <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-xl dark:bg-emerald-950">
              ✅
            </div>
            <h2 className="mt-3 text-lg font-extrabold text-zinc-900 dark:text-white">
              Stay updated?
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-neutral-400">
              Get updates on petitions and impact. Completely optional.
            </p>
            <div className="mt-4 space-y-3">
              <input
                type="email"
                placeholder="Email (optional)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-500 dark:focus:ring-emerald-900"
              />
              <input
                type="tel"
                placeholder="WhatsApp / Phone (optional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-500 dark:focus:ring-emerald-900"
              />
            </div>
            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleSaveContact}
                disabled={saving}
                className="w-full rounded-2xl bg-emerald-600 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60 dark:bg-emerald-500 dark:hover:bg-emerald-400"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => setPhase('done')}
                className="w-full rounded-2xl py-2.5 text-sm font-medium text-zinc-400 transition hover:text-zinc-600 dark:text-neutral-500 dark:hover:text-neutral-300"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body,
  ) : null;

  return (
    <>
      {/* Inline button — stays in the header DOM */}
      {phase === 'done' ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
          ✓ Joined
          {count !== null && (
            <span className="text-emerald-500 dark:text-emerald-400">
              · {count.toLocaleString()}
            </span>
          )}
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setPhase('modal')}
          className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/80"
        >
          <span>+ Join 🇱🇷</span>
          {count !== null && (
            <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400">
              {count.toLocaleString()}
            </span>
          )}
        </button>
      )}

      {/* Portaled overlays — outside the header DOM tree */}
      {portals}
    </>
  );
}
