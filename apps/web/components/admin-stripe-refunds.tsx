'use client';

import { useEffect, useState, useCallback } from 'react';
import { AlertCircle, Plus } from 'lucide-react';
import { apiGet, apiPost } from '../lib/api';
import { useAuthStore } from '../lib/store';

// UI Components (inline)
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-lg border border-zinc-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>
);

const CardTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>
);

const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 pt-0 ${className}`}>{children}</div>
);

const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse rounded-md bg-gradient-to-r from-zinc-200 to-zinc-100 dark:from-neutral-700 dark:to-neutral-800 ${className}`} />
);

const Badge = ({ children, className = '', variant = 'default' }: { children: React.ReactNode; className?: string; variant?: 'default' | 'outline' }) => {
  const baseStyles = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold';
  const variantStyles = variant === 'outline' ? 'border border-zinc-200 bg-transparent text-zinc-900 dark:border-neutral-700' : 'bg-zinc-200 text-zinc-900 dark:bg-neutral-700';
  return <span className={`${baseStyles} ${variantStyles} ${className}`}>{children}</span>;
};

interface Refund {
  id: string;
  paymentId: string;
  amount: number;
  currency: string;
  reason: string;
  status: string;
  createdAt: string;
  payment?: {
    user?: {
      fullName: string;
      email: string;
    };
  };
}

export function AdminStripeRefunds() {
  const token = useAuthStore((s) => s.token);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ paymentId: '', amount: '', reason: '' });
  const [creating, setCreating] = useState(false);

  const fetchRefunds = useCallback(async () => {
    if (!token) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }

    try {
      const result = await apiGet<{ refunds: Refund[] }>('/admin/stripe/refunds', token);
      setRefunds(result.refunds || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchRefunds();
  }, [fetchRefunds]);

  const handleCreateRefund = async () => {
    if (!formData.paymentId || !formData.amount || !formData.reason) {
      alert('Please fill all fields');
      return;
    }
    if (!token) {
      alert('Not authenticated');
      return;
    }

    setCreating(true);
    try {
      await apiPost(
        '/admin/stripe/refunds',
        {
          paymentId: formData.paymentId,
          amount: parseFloat(formData.amount),
          reason: formData.reason,
        },
        token
      );
      await fetchRefunds();
      setFormData({ paymentId: '', amount: '', reason: '' });
      setShowForm(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error creating refund');
    } finally {
      setCreating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (error) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="flex items-center gap-2 pt-6">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-800">{error}</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Refunds</CardTitle>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          New Refund
        </button>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <div className="border rounded p-4 space-y-3 bg-gray-50">
            <input
              type="text"
              placeholder="Payment ID"
              value={formData.paymentId}
              onChange={(e) => setFormData({ ...formData, paymentId: e.target.value })}
              className="w-full border rounded px-2 py-1 text-sm"
            />
            <input
              type="number"
              placeholder="Amount"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full border rounded px-2 py-1 text-sm"
            />
            <input
              type="text"
              placeholder="Reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full border rounded px-2 py-1 text-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreateRefund}
                disabled={creating}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr>
                <th className="text-left py-2 px-2">User</th>
                <th className="text-left py-2 px-2">Amount</th>
                <th className="text-left py-2 px-2">Reason</th>
                <th className="text-left py-2 px-2">Status</th>
                <th className="text-left py-2 px-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-2 px-2">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="py-2 px-2">
                      <Skeleton className="h-4 w-16" />
                    </td>
                    <td className="py-2 px-2">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="py-2 px-2">
                      <Skeleton className="h-4 w-16" />
                    </td>
                    <td className="py-2 px-2">
                      <Skeleton className="h-4 w-24" />
                    </td>
                  </tr>
                ))
              ) : refunds.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-gray-500">
                    No refunds found
                  </td>
                </tr>
              ) : (
                refunds.map((refund) => (
                  <tr key={refund.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-2">
                      <div>
                        <div className="font-medium">
                          {refund.payment?.user?.fullName || 'Unknown'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {refund.payment?.user?.email}
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-2 font-medium">
                      {refund.currency} {refund.amount.toFixed(2)}
                    </td>
                    <td className="py-2 px-2 text-xs">{refund.reason}</td>
                    <td className="py-2 px-2">
                      <Badge className={getStatusColor(refund.status)}>
                        {refund.status}
                      </Badge>
                    </td>
                    <td className="py-2 px-2 text-xs text-gray-500">
                      {new Date(refund.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
