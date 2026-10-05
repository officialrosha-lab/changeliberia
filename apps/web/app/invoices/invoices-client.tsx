'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiGet, apiPost } from '../../lib/api';
import { useAuthStore } from '../../lib/store';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';

type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PAID' | 'VOID';

interface Invoice {
  id: string;
  number: string;
  status: InvoiceStatus;
  totalAmount: string;
  currency: string;
  issuedAt: string | null;
  dueAt: string | null;
  paidAt: string | null;
  notes: string | null;
}

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  DRAFT: 'Draft',
  ISSUED: 'Issued',
  PAID: 'Paid',
  VOID: 'Void',
};

export function InvoicesClient() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hydrated = useAuthStore((s) => s.hydrated);
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkoutResult = searchParams.get('checkout');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const data = await apiGet<Invoice[]>('/invoices/me');
      setInvoices(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) {
      router.replace(`/auth/login?next=${encodeURIComponent('/invoices')}`);
      return;
    }
    void load();
  }, [hydrated, isAuthenticated, router, load]);

  async function handlePay(invoiceId: string) {
    if (!isAuthenticated) return;
    setError(null);
    setPayingId(invoiceId);
    try {
      const origin = window.location.origin;
      const res = await apiPost<{ checkoutUrl: string }>(
        `/invoices/${invoiceId}/pay`,
        {
          successUrl: `${origin}/invoices?checkout=success`,
          cancelUrl: `${origin}/invoices?checkout=cancelled`,
        },
      );
      window.location.assign(res.checkoutUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
      setPayingId(null);
    }
  }

  if (!hydrated || !isAuthenticated) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-zinc-500 dark:text-neutral-400">
        Loading…
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">My invoices</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-neutral-400">
        Invoices for Change Liberia Studio services. Pay an issued invoice online below, or reach
        out to{' '}
        <a
          href="mailto:hello@changeliberia.org"
          className="underline hover:text-emerald-700 dark:hover:text-emerald-400"
        >
          hello@changeliberia.org
        </a>{' '}
        for other payment arrangements.
      </p>

      {checkoutResult === 'success' && (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
          Thanks! Your payment is processing — this invoice will update to Paid once it&apos;s
          confirmed.
        </div>
      )}
      {checkoutResult === 'cancelled' && (
        <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
          Checkout was cancelled — no charge was made.
        </div>
      )}
      {error && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <p className="mt-6 text-sm text-zinc-500 dark:text-neutral-400">Loading…</p>
      ) : invoices.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-zinc-300 px-6 py-10 text-center text-sm text-zinc-500 dark:border-neutral-700 dark:text-neutral-400">
          No invoices yet. Invoices appear here once a{' '}
          <Link href="/studio" className="font-semibold text-emerald-700 hover:underline dark:text-emerald-400">
            Studio service request
          </Link>{' '}
          is quoted.
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {invoices.map((invoice) => (
            <Card key={invoice.id} rounded="2xl" className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-white">{invoice.number}</p>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-neutral-400">
                    {invoice.currency} ${Number(invoice.totalAmount).toFixed(2)}
                  </p>
                  {invoice.dueAt && (
                    <p className="mt-1 text-xs text-zinc-400 dark:text-neutral-500">
                      Due {new Date(invoice.dueAt).toLocaleDateString()}
                    </p>
                  )}
                  {invoice.notes && (
                    <p className="mt-2 text-sm text-zinc-600 dark:text-neutral-400">{invoice.notes}</p>
                  )}
                  {invoice.status === 'ISSUED' && (
                    <Button
                      size="sm"
                      className="mt-3"
                      isLoading={payingId === invoice.id}
                      loadingText="Starting checkout…"
                      disabled={payingId !== null && payingId !== invoice.id}
                      onClick={() => void handlePay(invoice.id)}
                    >
                      Pay now
                    </Button>
                  )}
                </div>
                <Badge>{STATUS_LABEL[invoice.status]}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
