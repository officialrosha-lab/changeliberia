'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiGet, apiPost } from '../../lib/api';
import { useAuthStore } from '../../lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';

interface MyOrganization {
  id: string;
  name: string;
  slug: string;
  myRole: 'OWNER' | 'ADMIN' | 'MEMBER';
  createdAt: string;
}

const ROLE_LABEL: Record<MyOrganization['myRole'], string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  MEMBER: 'Member',
};

export function OrganizationsClient() {
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s.hydrated);
  const router = useRouter();

  const [organizations, setOrganizations] = useState<MyOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!token) {
      router.replace('/auth/login?next=%2Forganizations');
    }
  }, [hydrated, token, router]);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await apiGet<MyOrganization[]>('/organizations/me', token);
      setOrganizations(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load organizations');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate() {
    if (!token || !name.trim()) return;
    setError(null);
    setCreating(true);
    try {
      const org = await apiPost<{ id: string }>('/organizations', { name: name.trim() }, token);
      router.push(`/organizations/${org.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create organization');
      setCreating(false);
    }
  }

  if (!hydrated || !token) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16 text-center text-sm text-zinc-500 dark:text-neutral-400">
        Loading…
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/dashboard"
          className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-neutral-400 dark:hover:text-white"
        >
          ← Dashboard
        </Link>
        <span className="text-zinc-300 dark:text-neutral-600">/</span>
        <span className="text-sm font-medium text-zinc-900 dark:text-white">Organizations</span>
      </div>

      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Organizations</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-600 dark:text-neutral-400">
        A shared workspace for an NGO, CSO, or any team coordinating campaigns together on Change
        Liberia — invite teammates, and optionally upgrade for more seats and advanced tools.
      </p>

      <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
        Free for teams up to 5 members. A paid workspace plan only adds more seats and optional
        tools — it never changes what your organization or its petitions can do for free.
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-neutral-400">
          My organizations
        </h2>
        <Button size="sm" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Cancel' : 'New organization'}
        </Button>
      </div>

      {showCreate && (
        <Card rounded="2xl" className="mt-4">
          <CardContent className="space-y-3 pt-6">
            <label htmlFor="org-name" className="text-sm font-medium text-zinc-700 dark:text-neutral-300">
              Organization name
            </label>
            <Input
              id="org-name"
              placeholder="e.g. Liberia Youth Advocacy Network"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleCreate();
              }}
            />
            <Button isLoading={creating} loadingText="Creating…" disabled={!name.trim()} onClick={() => void handleCreate()}>
              Create organization
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="mt-6 py-8 text-center text-sm text-zinc-500 dark:text-neutral-400">Loading…</div>
      ) : organizations.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-zinc-300 px-6 py-10 text-center text-sm text-zinc-500 dark:border-neutral-700 dark:text-neutral-400">
          You&apos;re not part of any organization yet. Create one to start collaborating with your
          team.
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {organizations.map((org) => (
            <Link key={org.id} href={`/organizations/${org.id}`}>
              <Card rounded="2xl" className="h-full transition hover:border-emerald-300 dark:hover:border-emerald-800">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle>{org.name}</CardTitle>
                    <Badge>{ROLE_LABEL[org.myRole]}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-zinc-500 dark:text-neutral-400">/{org.slug}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
