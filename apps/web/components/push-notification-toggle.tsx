'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../lib/api';
import { useAuthStore } from '../lib/store';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function PushNotificationToggle() {
  const token = useAuthStore((s) => s.token);
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setSupported(isSupported);
    if (!isSupported) return;

    navigator.serviceWorker.register('/sw.js').catch(() => {/* best-effort */});
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscribed(!!sub))
      .catch(() => {/* best-effort */});
  }, []);

  async function enable() {
    setBusy(true);
    setError(null);
    try {
      if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          setError('Notification permission was not granted.');
          return;
        }
      }

      const { publicKey } = await apiGet<{ publicKey: string | null }>('/push/vapid-public-key');
      if (!publicKey) {
        setError('Push notifications are not configured on the server yet.');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });

      await apiPost('/push/subscribe', subscription.toJSON(), token ?? undefined);
      setSubscribed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enable notifications');
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setError(null);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await apiPost('/push/unsubscribe', { endpoint: subscription.endpoint }, token ?? undefined);
        await subscription.unsubscribe();
      }
      setSubscribed(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disable notifications');
    } finally {
      setBusy(false);
    }
  }

  if (!supported) return null;

  return (
    <div className="rounded-2xl border border-zinc-200 p-4 dark:border-neutral-700">
      <p className="text-sm font-semibold text-zinc-900 dark:text-neutral-50">Browser notifications</p>
      <p className="mt-1 text-xs text-zinc-500 dark:text-neutral-400">
        Get notified in your browser about petition milestones and government responses.
      </p>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      <button
        type="button"
        disabled={busy}
        onClick={() => void (subscribed ? disable() : enable())}
        className={`mt-3 rounded-full px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${
          subscribed
            ? 'border border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-neutral-600 dark:text-neutral-300'
            : 'bg-emerald-600 text-white hover:bg-emerald-700'
        }`}
      >
        {busy ? 'Working…' : subscribed ? 'Disable notifications' : 'Enable notifications'}
      </button>
    </div>
  );
}
