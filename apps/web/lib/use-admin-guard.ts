'use client';

import { useEffect, useState } from 'react';
import { apiGet } from './api';
import { useAuthStore } from './store';

export type AdminGuardPhase = 'loading' | 'denied' | 'ok';

interface Me {
  role: string;
}

/**
 * The "is this user an Admin" check every admin page needs on mount,
 * factored out of admin-page-client.tsx and admin/directory/page.tsx (the
 * first two places it was duplicated) so a third admin surface
 * (admin/monetization) doesn't copy it a third time.
 *
 * Waits for the auth store to hydrate before deciding anything (a
 * server-rendered first paint can't know the token yet), then resolves to
 * 'denied' with no token, or checks GET /users/me and resolves to 'ok'
 * only for role === 'ADMIN'. Any request failure (network, 401, ...)
 * resolves to 'denied' — never lets a broken check fall open to 'ok'.
 */
export function useAdminGuard(): { phase: AdminGuardPhase; token: string | null } {
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s.hydrated);
  const [asyncPhase, setAsyncPhase] = useState<AdminGuardPhase>('loading');
  const phase: AdminGuardPhase = !hydrated ? 'loading' : !token ? 'denied' : asyncPhase;

  useEffect(() => {
    if (!hydrated || !token) return;
    let cancelled = false;
    apiGet<Me>('/users/me', token)
      .then((me) => {
        if (cancelled) return;
        setAsyncPhase(me.role === 'ADMIN' ? 'ok' : 'denied');
      })
      .catch(() => {
        if (!cancelled) setAsyncPhase('denied');
      });
    return () => {
      cancelled = true;
    };
  }, [token, hydrated]);

  return { phase, token };
}
