'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiGet, apiPatch } from '../../lib/api';
import { useAuthStore } from '../../lib/store';

export function TransparencyConfigPanel() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    apiGet<{ enabled: boolean }>('/admin/monetization/transparency-settings')
      .then((data) => {
        if (!cancelled) setEnabled(data.enabled);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load setting');
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  async function toggle() {
    if (!isAuthenticated || enabled === null) return;
    try {
      setSaving(true);
      await apiPatch('/admin/monetization/transparency-settings', { enabled: !enabled });
      setEnabled(!enabled);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save setting');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl space-y-4">
      <h3 className="text-lg font-semibold dark:text-white">Public transparency center</h3>
      <p className="text-sm text-zinc-500 dark:text-neutral-400">
        Controls whether <code>/transparency</code> shows the platform&apos;s aggregate revenue and count figures to
        the public. No per-user data is ever shown there, regardless of this setting.
      </p>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      {enabled === null ? (
        <p className="text-zinc-500 dark:text-neutral-400">Loading…</p>
      ) : (
        <div className="flex items-center gap-4 rounded-lg border border-zinc-200 p-4 dark:border-neutral-700">
          <span className="font-medium dark:text-neutral-100">
            {enabled ? 'Public transparency page is live' : 'Public transparency page is hidden'}
          </span>
          <button
            disabled={saving}
            onClick={() => void toggle()}
            className={`rounded-lg px-4 py-2 font-medium text-white transition-colors disabled:opacity-50 ${
              enabled ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {enabled ? 'Hide it' : 'Publish it'}
          </button>
        </div>
      )}

      <Link href="/transparency" target="_blank" className="inline-block text-emerald-600 underline dark:text-emerald-400">
        Preview the public page &rarr;
      </Link>
    </div>
  );
}
