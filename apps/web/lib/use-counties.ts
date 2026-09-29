'use client';

import { useEffect, useState } from 'react';
import { apiGet } from './api';

export interface CountyOption {
  id: string;
  name: string;
  code: string;
}

// Canonical Title Case fallback, used only if the geography API is
// unreachable — keeps petition/poll/ambassador creation forms working even
// during a backend hiccup. Source of truth is the API (backed by the
// County table); this list must stay in sync with prisma/seed-geography.ts.
const FALLBACK_COUNTIES: CountyOption[] = [
  'Bomi', 'Bong', 'Gbarpolu', 'Grand Bassa', 'Grand Cape Mount',
  'Grand Gedeh', 'Grand Kru', 'Lofa', 'Margibi', 'Maryland',
  'Montserrado', 'Nimba', 'River Cess', 'River Gee', 'Sinoe',
].map((name) => ({ id: name, name, code: name }));

let cachedCounties: CountyOption[] | null = null;

/**
 * Fetches Liberia's canonical county list from the geography API
 * (GET /geography/counties), replacing the several independent hardcoded
 * county arrays previously duplicated across create-form.tsx,
 * poll-submission-form.tsx, admin-poll-creation-panel.tsx, and
 * ambassador-application-form.tsx (two of which were missing Grand Gedeh
 * and River Cess). Falls back to a static list if the request fails.
 */
export function useCounties(): { counties: CountyOption[]; loading: boolean } {
  const [counties, setCounties] = useState<CountyOption[]>(
    cachedCounties ?? FALLBACK_COUNTIES,
  );
  const [loading, setLoading] = useState(!cachedCounties);

  useEffect(() => {
    if (cachedCounties) return;
    let cancelled = false;
    apiGet<CountyOption[]>('/geography/counties')
      .then((data) => {
        if (cancelled || !data?.length) return;
        cachedCounties = data;
        setCounties(data);
      })
      .catch(() => {
        // keep the static fallback already in state
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { counties, loading };
}
