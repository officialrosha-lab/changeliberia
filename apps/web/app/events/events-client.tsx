'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { apiGet, apiPost } from '../../lib/api';
import { useAuthStore } from '../../lib/store';
import { SiteFooter } from '../../components/site-footer';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

interface EventItem {
  id: string;
  key: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  location: string | null;
  priceAmount: string | null;
  currency: string;
  capacity: number | null;
}

interface EventRegistration {
  id: string;
  eventId: string;
  status: 'REGISTERED' | 'CANCELLED' | 'ATTENDED';
  purchaseStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
  event: EventItem;
}

function formatDateRange(startsAt: string, endsAt: string): string {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const dateOpts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
  const timeOpts: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
  const sameDay = start.toDateString() === end.toDateString();
  if (sameDay) {
    return `${start.toLocaleDateString('en-LR', dateOpts)} · ${start.toLocaleTimeString('en-LR', timeOpts)}–${end.toLocaleTimeString('en-LR', timeOpts)}`;
  }
  return `${start.toLocaleDateString('en-LR', dateOpts)} – ${end.toLocaleDateString('en-LR', dateOpts)}`;
}

function formatPrice(event: EventItem): string {
  if (event.priceAmount === null) return 'Free';
  const amount = Number(event.priceAmount);
  const formatted = Number.isInteger(amount) ? amount.toString() : amount.toFixed(2);
  return `${event.currency} $${formatted}`;
}

export function EventsClient() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hydrated = useAuthStore((s) => s.hydrated);
  const searchParams = useSearchParams();
  const checkoutResult = searchParams.get('checkout');

  const [events, setEvents] = useState<EventItem[]>([]);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [eventsData, registrationsData] = await Promise.all([
        apiGet<EventItem[]>('/events'),
        isAuthenticated ? apiGet<EventRegistration[]>('/events/me') : Promise.resolve([]),
      ]);
      setEvents(eventsData);
      setRegistrations(registrationsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!hydrated) return;
    void load();
  }, [hydrated, load]);

  const registrationByEventId = new Map(registrations.map((r) => [r.eventId, r]));

  async function handleRegister(event: EventItem) {
    if (!isAuthenticated) return;
    setError(null);
    setPendingKey(event.key);
    try {
      const origin = window.location.origin;
      const isPaid = event.priceAmount !== null;
      const res = await apiPost<{ checkoutUrl?: string; registrationId?: string }>(
        `/events/${event.key}/register`,
        isPaid
          ? { successUrl: `${origin}/events?checkout=success`, cancelUrl: `${origin}/events?checkout=cancelled` }
          : {},
      );
      if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
        return;
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register');
    } finally {
      setPendingKey(null);
    }
  }

  async function handleCancel(event: EventItem) {
    if (!isAuthenticated) return;
    setError(null);
    setPendingKey(event.key);
    try {
      await apiPost(`/events/${event.key}/cancel`, {});
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel registration');
    } finally {
      setPendingKey(null);
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
              Events
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-neutral-300">
              Workshops, briefings, and convenings — some free, some ticketed.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-4xl px-4 py-12">
          {checkoutResult === 'success' && (
            <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
              Thanks! Your payment is processing — your registration will confirm once it&apos;s complete.
            </div>
          )}
          {checkoutResult === 'cancelled' && (
            <div className="mb-6 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
              Checkout was cancelled — no charge was made.
            </div>
          )}
          {error && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
              {error}
            </div>
          )}

          {loading ? (
            <p className="text-center text-sm text-zinc-500 dark:text-neutral-400">Loading…</p>
          ) : events.length === 0 ? (
            <p className="text-center text-sm text-zinc-500 dark:text-neutral-400">
              No upcoming events right now — check back soon.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {events.map((event) => {
                const registration = registrationByEventId.get(event.id);
                const isRegistered = registration && registration.status === 'REGISTERED';
                const busy = pendingKey === event.key;
                return (
                  <Card key={event.id} rounded="2xl">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle>{event.title}</CardTitle>
                        <Badge>{formatPrice(event)}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm font-medium text-zinc-500 dark:text-neutral-400">
                        {formatDateRange(event.startsAt, event.endsAt)}
                      </p>
                      {event.location && (
                        <p className="text-sm text-zinc-600 dark:text-neutral-400">📍 {event.location}</p>
                      )}
                      {event.description && (
                        <p className="text-sm text-zinc-600 dark:text-neutral-400">{event.description}</p>
                      )}

                      {isRegistered ? (
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                            ✓ You&apos;re registered
                          </span>
                          <Button
                            variant="secondary"
                            size="sm"
                            isLoading={busy}
                            loadingText="Cancelling…"
                            onClick={() => void handleCancel(event)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : registration?.purchaseStatus === 'PENDING' ? (
                        <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                          Payment processing…
                        </p>
                      ) : !isAuthenticated ? (
                        <Link
                          href={`/auth/login?next=${encodeURIComponent('/events')}`}
                          className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400"
                        >
                          Log in to register
                        </Link>
                      ) : (
                        <Button
                          isLoading={busy}
                          loadingText={event.priceAmount !== null ? 'Starting checkout…' : 'Registering…'}
                          disabled={pendingKey !== null && !busy}
                          onClick={() => void handleRegister(event)}
                        >
                          Register
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
