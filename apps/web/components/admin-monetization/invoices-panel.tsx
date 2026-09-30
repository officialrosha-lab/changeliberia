'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiGet, apiPost } from '../../lib/api';
import { useAuthStore } from '../../lib/store';

interface Invoice {
  id: string;
  number: string;
  status: 'DRAFT' | 'ISSUED' | 'PAID' | 'VOID';
  userId: string | null;
  organizationId: string | null;
  institutionId: string | null;
  serviceRequestId: string | null;
  currency: string;
  totalAmount: string;
  issuedAt: string | null;
  dueAt: string | null;
  paidAt: string | null;
  createdAt: string;
}

const STATUS_STYLES: Record<Invoice['status'], string> = {
  DRAFT: 'bg-zinc-100 text-zinc-600 dark:bg-neutral-800 dark:text-neutral-400',
  ISSUED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  PAID: 'bg-green-100 text-green-700 dark:bg-emerald-900 dark:text-emerald-300',
  VOID: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
};

function billedTo(invoice: Invoice): string {
  if (invoice.organizationId) return `Organization ${invoice.organizationId}`;
  if (invoice.institutionId) return `Institution ${invoice.institutionId}`;
  if (invoice.userId) return `User ${invoice.userId}`;
  return '—';
}

export function InvoicesPanel() {
  const token = useAuthStore((s) => s.token);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await apiGet<Invoice[]>('/admin/invoices', token);
      setInvoices(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function runAction(id: string, action: 'issue' | 'mark-paid' | 'void') {
    if (!token) return;
    try {
      setBusyId(id);
      await apiPost(`/admin/invoices/${id}/${action}`, {}, token);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action.replace('-', ' ')} invoice`);
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return <div className="py-8 text-center dark:text-neutral-300">Loading invoices…</div>;
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-neutral-700 dark:bg-neutral-800">
            <tr>
              <th className="px-4 py-3 text-left font-semibold dark:text-white">Number</th>
              <th className="px-4 py-3 text-left font-semibold dark:text-white">Billed to</th>
              <th className="px-4 py-3 text-left font-semibold dark:text-white">Amount</th>
              <th className="px-4 py-3 text-left font-semibold dark:text-white">Status</th>
              <th className="px-4 py-3 text-left font-semibold dark:text-white">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="border-b border-zinc-200 dark:border-neutral-800">
                <td className="px-4 py-3 font-medium dark:text-neutral-100">{invoice.number}</td>
                <td className="px-4 py-3 text-zinc-600 dark:text-neutral-300">{billedTo(invoice)}</td>
                <td className="px-4 py-3 dark:text-neutral-300">
                  {invoice.currency} {invoice.totalAmount}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2 py-1 text-xs ${STATUS_STYLES[invoice.status]}`}>
                    {invoice.status}
                  </span>
                </td>
                <td className="space-x-3 px-4 py-3">
                  {invoice.status === 'DRAFT' && (
                    <button
                      disabled={busyId === invoice.id}
                      onClick={() => void runAction(invoice.id, 'issue')}
                      className="font-medium text-emerald-600 hover:underline disabled:opacity-50 dark:text-emerald-400"
                    >
                      Issue
                    </button>
                  )}
                  {invoice.status === 'ISSUED' && (
                    <>
                      <button
                        disabled={busyId === invoice.id}
                        onClick={() => void runAction(invoice.id, 'mark-paid')}
                        className="font-medium text-emerald-600 hover:underline disabled:opacity-50 dark:text-emerald-400"
                      >
                        Mark paid
                      </button>
                      <button
                        disabled={busyId === invoice.id}
                        onClick={() => void runAction(invoice.id, 'void')}
                        className="font-medium text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
                      >
                        Void
                      </button>
                    </>
                  )}
                  {(invoice.status === 'PAID' || invoice.status === 'VOID') && (
                    <span className="text-zinc-400 dark:text-neutral-500">No actions</span>
                  )}
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-500 dark:text-neutral-400">
                  No invoices yet. Studio service requests draft one automatically once quoted.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
