'use client';

import { useEffect, useRef } from 'react';
import { apiGet } from '../lib/api';
import { useAuthStore, type AuthUser } from '../lib/store';

/**
 * Resolves whether the current browser has a valid session, once per app
 * load. There's no client-readable token to check anymore (it's an
 * httpOnly cookie) — GET /users/me is authenticated via that cookie and
 * either succeeds (we're logged in) or 401s (we're not).
 */
export function AuthSessionBootstrap() {
  const setSession = useAuthStore((s) => s.setSession);
  const setHydrated = useAuthStore((s) => s.setHydrated);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    let cancelled = false;

    void (async () => {
      try {
        const user = await apiGet<AuthUser>('/users/me');
        if (!cancelled) setSession(user);
      } catch {
        if (!cancelled) setSession(null);
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setSession, setHydrated]);

  return null;
}
