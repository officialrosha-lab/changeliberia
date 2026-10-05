'use client';

import { useEffect, useState } from 'react';
import { apiDelete, apiGet, apiPost } from '../../lib/api';
import { useAuthStore } from '../../lib/store';

interface Entitlement {
  id: string;
  key: string;
  name: string;
  scope: 'USER' | 'ORGANIZATION' | 'INSTITUTION';
}

interface EntitlementGrant {
  id: string;
  entitlementId: string;
  userId: string | null;
  organizationId: string | null;
  institutionId: string | null;
  source: string;
  sourceId: string | null;
  grantedAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
}

type TargetType = 'userId' | 'institutionId';

function inputClass() {
  return 'px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:placeholder-neutral-500';
}

export function EntitlementsPanel() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [entitlements, setEntitlements] = useState<Entitlement[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [newKey, setNewKey] = useState('');
  const [newName, setNewName] = useState('');
  const [newScope, setNewScope] = useState<Entitlement['scope']>('USER');

  const [targetType, setTargetType] = useState<TargetType>('userId');
  const [targetId, setTargetId] = useState('');
  const [grants, setGrants] = useState<EntitlementGrant[] | null>(null);
  const [grantEntitlementKey, setGrantEntitlementKey] = useState('');
  const [grantSource, setGrantSource] = useState('MANUAL_ADMIN');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    apiGet<Entitlement[]>('/admin/entitlements')
      .then((data) => {
        if (!cancelled) setEntitlements(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load entitlements');
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, reloadKey]);

  async function handleCreateEntitlement() {
    if (!isAuthenticated || !newKey || !newName) return;
    try {
      await apiPost('/admin/entitlements', { key: newKey, name: newName, scope: newScope });
      setNewKey('');
      setNewName('');
      setReloadKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create entitlement');
    }
  }

  async function handleLookupGrants() {
    if (!isAuthenticated || !targetId) return;
    try {
      const data = await apiGet<EntitlementGrant[]>(`/admin/entitlements/${targetType === 'userId' ? 'users' : 'institutions'}/${targetId}/grants`);
      setGrants(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load grants');
    }
  }

  async function handleGrant() {
    if (!isAuthenticated || !targetId || !grantEntitlementKey) return;
    try {
      await apiPost(
        '/admin/entitlements/grants',
        { entitlementKey: grantEntitlementKey, [targetType]: targetId, source: grantSource },
      );
      setGrantEntitlementKey('');
      await handleLookupGrants();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to grant entitlement');
    }
  }

  async function handleRevoke(grantId: string) {
    if (!isAuthenticated) return;
    try {
      await apiDelete(`/admin/entitlements/grants/${grantId}`);
      await handleLookupGrants();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke grant');
    }
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      <section>
        <h3 className="text-lg font-semibold dark:text-white">Entitlement catalog</h3>
        <p className="mt-1 text-sm text-zinc-500 dark:text-neutral-400">
          The optional capabilities a subscription or manual grant can unlock. Never petition/Civic Pulse
          participation — see civic-principle.spec.ts.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {entitlements.map((e) => (
            <div key={e.id} className="rounded-lg border border-zinc-200 p-3 dark:border-neutral-700">
              <p className="font-mono text-xs text-zinc-500 dark:text-neutral-400">{e.key}</p>
              <p className="font-medium dark:text-neutral-100">{e.name}</p>
              <span className="mt-1 inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-neutral-800 dark:text-neutral-400">
                {e.scope}
              </span>
            </div>
          ))}
          {entitlements.length === 0 && (
            <p className="col-span-full text-sm text-zinc-500 dark:text-neutral-400">No entitlements defined yet.</p>
          )}
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
          <input placeholder="Key (e.g. ENTITLEMENT_PETITION_BOOST)" value={newKey} onChange={(e) => setNewKey(e.target.value)} className={inputClass()} />
          <input placeholder="Display name" value={newName} onChange={(e) => setNewName(e.target.value)} className={inputClass()} />
          <select value={newScope} onChange={(e) => setNewScope(e.target.value as Entitlement['scope'])} className={inputClass()}>
            <option value="USER">User</option>
            <option value="ORGANIZATION">Organization</option>
            <option value="INSTITUTION">Institution</option>
          </select>
          <button
            onClick={() => void handleCreateEntitlement()}
            className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white transition-colors hover:bg-emerald-700"
          >
            Add entitlement
          </button>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold dark:text-white">Grants</h3>
        <p className="mt-1 text-sm text-zinc-500 dark:text-neutral-400">
          Look up a user or institution&apos;s manual and subscription-derived entitlement grants.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <select value={targetType} onChange={(e) => setTargetType(e.target.value as TargetType)} className={inputClass()}>
            <option value="userId">User ID</option>
            <option value="institutionId">Institution ID</option>
          </select>
          <input placeholder="Target ID" value={targetId} onChange={(e) => setTargetId(e.target.value)} className={inputClass()} />
          <button
            onClick={() => void handleLookupGrants()}
            className="rounded-lg bg-zinc-800 px-4 py-2 font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-neutral-700 dark:hover:bg-neutral-600"
          >
            Look up
          </button>
        </div>

        {grants && (
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
              <input
                placeholder="Entitlement key"
                value={grantEntitlementKey}
                onChange={(e) => setGrantEntitlementKey(e.target.value)}
                className={inputClass()}
              />
              <input placeholder="Source (default MANUAL_ADMIN)" value={grantSource} onChange={(e) => setGrantSource(e.target.value)} className={inputClass()} />
              <button
                onClick={() => void handleGrant()}
                className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white transition-colors hover:bg-emerald-700"
              >
                Grant to this target
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-neutral-700 dark:bg-neutral-800">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold dark:text-white">Entitlement</th>
                    <th className="px-4 py-3 text-left font-semibold dark:text-white">Source</th>
                    <th className="px-4 py-3 text-left font-semibold dark:text-white">Granted</th>
                    <th className="px-4 py-3 text-left font-semibold dark:text-white">Expires</th>
                    <th className="px-4 py-3 text-left font-semibold dark:text-white">Status</th>
                    <th className="px-4 py-3 text-left font-semibold dark:text-white">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {grants.map((g) => (
                    <tr key={g.id} className="border-b border-zinc-200 dark:border-neutral-800">
                      <td className="px-4 py-3 font-mono text-xs dark:text-neutral-300">{g.entitlementId}</td>
                      <td className="px-4 py-3 dark:text-neutral-300">{g.source}</td>
                      <td className="px-4 py-3 text-zinc-500 dark:text-neutral-400">
                        {new Date(g.grantedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-zinc-500 dark:text-neutral-400">
                        {g.expiresAt ? new Date(g.expiresAt).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-4 py-3">
                        {g.revokedAt ? (
                          <span className="rounded-full bg-red-100 px-2 py-1 text-xs text-red-700 dark:bg-red-950 dark:text-red-400">
                            Revoked
                          </span>
                        ) : (
                          <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700 dark:bg-emerald-900 dark:text-emerald-300">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {!g.revokedAt && (
                          <button
                            onClick={() => void handleRevoke(g.id)}
                            className="font-medium text-red-600 hover:underline dark:text-red-400"
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {grants.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-zinc-500 dark:text-neutral-400">
                        No grants for this target.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
