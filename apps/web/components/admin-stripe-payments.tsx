'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Filter } from 'lucide-react';

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

interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: string;
  stripePaymentIntentId: string;
  createdAt: string;
  user?: {
    fullName: string;
    email: string;
  };
}

export function AdminStripePayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState('7');

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await fetch(
          `/api/v1/api/admin/stripe/payments?days=${dateFilter}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );

        if (!response.ok) throw new Error('Failed to fetch payments');
        const result = await response.json();
        setPayments(result.payments || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [dateFilter]);

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
        <CardTitle>Payments</CardTitle>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="text-sm border rounded px-2 py-1"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr>
                <th className="text-left py-2 px-2">User</th>
                <th className="text-left py-2 px-2">Amount</th>
                <th className="text-left py-2 px-2">Status</th>
                <th className="text-left py-2 px-2">Date</th>
                <th className="text-left py-2 px-2">ID</th>
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
                      <Skeleton className="h-4 w-16" />
                    </td>
                    <td className="py-2 px-2">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="py-2 px-2">
                      <Skeleton className="h-4 w-20" />
                    </td>
                  </tr>
                ))
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-gray-500">
                    No payments found
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-2">
                      <div>
                        <div className="font-medium">{payment.user?.fullName || 'Unknown'}</div>
                        <div className="text-xs text-gray-500">{payment.user?.email}</div>
                      </div>
                    </td>
                    <td className="py-2 px-2 font-medium">
                      {payment.currency} {payment.amount.toFixed(2)}
                    </td>
                    <td className="py-2 px-2">
                      <Badge className={getStatusColor(payment.status)}>
                        {payment.status}
                      </Badge>
                    </td>
                    <td className="py-2 px-2 text-xs text-gray-500">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-2 text-xs font-mono">
                      {payment.stripePaymentIntentId.slice(0, 12)}...
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
