'use client';

import { useEffect, useState } from 'react';
import { apiGet } from './api';

interface SystemSettings {
  donationsEnabled: boolean;
  marketplaceEnabled: boolean;
}

const TTL_MS = 60_000;
const DEFAULT_SETTINGS: SystemSettings = { donationsEnabled: true, marketplaceEnabled: false };

let cached: { value: SystemSettings; expiresAt: number } | null = null;
let inFlight: Promise<SystemSettings> | null = null;

/**
 * Header and MobileMenuOverlay both need /settings/system on mount. Without
 * sharing a request, every page load fires it twice. A module-level
 * singleton (in-flight promise + short TTL cache) collapses that to one
 * network call regardless of how many components ask for it at once.
 */
function fetchSystemSettings(): Promise<SystemSettings> {
  if (cached && cached.expiresAt > Date.now()) {
    return Promise.resolve(cached.value);
  }
  if (inFlight) return inFlight;

  inFlight = apiGet<SystemSettings>('/settings/system')
    .then((value) => {
      cached = { value, expiresAt: Date.now() + TTL_MS };
      return value;
    })
    .catch(() => DEFAULT_SETTINGS)
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

export function useSystemSettings(enabled = true): SystemSettings {
  const [settings, setSettings] = useState<SystemSettings>(() => cached?.value ?? DEFAULT_SETTINGS);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void fetchSystemSettings().then((value) => {
      if (!cancelled) setSettings(value);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return settings;
}
