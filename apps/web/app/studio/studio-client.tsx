'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiGet, apiPost } from '../../lib/api';
import { useAuthStore } from '../../lib/store';
import { SiteFooter } from '../../components/site-footer';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input, Textarea } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';

type ServiceRequestStatus =
  | 'SUBMITTED'
  | 'SCOPING'
  | 'QUOTED'
  | 'IN_PROGRESS'
  | 'DELIVERED'
  | 'CLOSED'
  | 'DECLINED';

interface ServiceRequest {
  id: string;
  title: string;
  description: string;
  status: ServiceRequestStatus;
  quotedAmount: string | null;
  currency: string;
  createdAt: string;
}

const STATUS_LABEL: Record<ServiceRequestStatus, string> = {
  SUBMITTED: 'Submitted',
  SCOPING: 'Scoping',
  QUOTED: 'Quoted',
  IN_PROGRESS: 'In progress',
  DELIVERED: 'Delivered',
  CLOSED: 'Closed',
  DECLINED: 'Declined',
};

export function StudioClient() {
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s.hydrated);

  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await apiGet<ServiceRequest[]>('/service-requests/me', token);
      setRequests(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load your requests');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!hydrated || !token) return;
    void load();
  }, [hydrated, token, load]);

  async function handleSubmit() {
    if (!token || !title.trim() || !description.trim()) return;
    setError(null);
    setSubmitting(true);
    try {
      await apiPost('/service-requests', { title: title.trim(), description: description.trim() }, token);
      setTitle('');
      setDescription('');
      setSubmitted(true);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <main className="min-h-screen bg-white dark:bg-neutral-950">
        <section className="border-b border-zinc-200 bg-gradient-to-br from-emerald-50 to-white px-4 py-16 dark:border-neutral-800 dark:from-emerald-950/20 dark:to-neutral-900 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <Link href="/marketplace" className="text-xs font-semibold uppercase tracking-widest text-emerald-600 hover:underline dark:text-emerald-400">
              ← Marketplace
            </Link>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl">
              Change Liberia Studio
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-neutral-300">
              Request professional services — campaign strategy, data work, or custom civic tooling. We&apos;ll
              scope it, send a quote, and invoice you directly — no online checkout for this one.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-2xl px-4 py-12">
          {!token ? (
            <Card rounded="2xl" className="p-8 text-center">
              <p className="text-sm text-zinc-600 dark:text-neutral-400">Log in to request Studio services.</p>
              <Link
                href={`/auth/login?next=${encodeURIComponent('/studio')}`}
                className="mt-4 inline-flex items-center justify-center rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400"
              >
                Log in
              </Link>
            </Card>
          ) : (
            <>
              {error && (
                <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
                  {error}
                </div>
              )}
              {submitted && (
                <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
                  Request submitted — we&apos;ll follow up once we&apos;ve scoped it.
                </div>
              )}

              <Card rounded="2xl">
                <CardHeader>
                  <CardTitle>Request services</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    placeholder={'Title (e.g. "Signature drive strategy for District 10")'}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                  <Textarea
                    placeholder="Describe what you need help with"
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  <Button
                    isLoading={submitting}
                    loadingText="Submitting…"
                    disabled={!title.trim() || !description.trim()}
                    onClick={() => void handleSubmit()}
                  >
                    Submit request
                  </Button>
                </CardContent>
              </Card>

              <div className="mt-10">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-zinc-400 dark:text-neutral-500">
                  My requests
                </h2>
                {loading ? (
                  <p className="text-sm text-zinc-500 dark:text-neutral-400">Loading…</p>
                ) : requests.length === 0 ? (
                  <p className="text-sm text-zinc-500 dark:text-neutral-400">No requests yet.</p>
                ) : (
                  <div className="space-y-3">
                    {requests.map((req) => (
                      <Card key={req.id} rounded="2xl" className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-zinc-900 dark:text-white">{req.title}</p>
                            <p className="mt-1 line-clamp-2 text-sm text-zinc-500 dark:text-neutral-400">
                              {req.description}
                            </p>
                            {req.quotedAmount && (
                              <p className="mt-2 text-sm font-semibold text-zinc-900 dark:text-white">
                                Quoted: {req.currency} ${Number(req.quotedAmount).toFixed(2)}
                              </p>
                            )}
                          </div>
                          <Badge>{STATUS_LABEL[req.status]}</Badge>
                        </div>
                        {req.status === 'QUOTED' && (
                          <Link
                            href="/invoices"
                            className="mt-3 inline-block text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
                          >
                            View invoice →
                          </Link>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
