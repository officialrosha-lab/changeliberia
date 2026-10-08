'use client';

import { useEffect, useRef } from 'react';

/**
 * Registers sw.js globally, once per app load. Registration used to live
 * only inside PushNotificationToggle (/settings), so a visitor who never
 * opened Settings never got a service worker at all — silently disabling
 * both push notifications and the offline fallback for most visitors.
 */
export function ServiceWorkerRegistration() {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* best-effort */
    });
  }, []);

  return null;
}
