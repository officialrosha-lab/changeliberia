'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';

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

interface Subscription {
  id: string;
  userId: string;
  stripeSubscriptionId: string;
  plan: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelledAt: string | null;
  user?: {
    fullName: string;
    email: string;
  };
}

export function AdminStripeSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch('/api/v1/admin/stripe/subscriptions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch subscriptions');
      const result = await response.json();
      setSubscriptions(result.subscriptions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (subscriptionId: string) => {
    if (!confirm('Cancel this subscription?')) return;

    setCancelling(subscriptionId);
    try {
      const response = await fetch(
        `/api/v1/admin/stripe/subscriptions/${subscriptionId}/cancel`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to cancel subscription');
      await fetchSubscriptions();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error cancelling subscription');
    } finally {
      setCancelling(null);
    }
  };

  const getStatusColor = (status: string, cancelled: boolean) => {
    if (cancelled) return 'bg-red-100 text-red-800';
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
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
      <CardHeader>
        <CardTitle>Subscriptions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr>
                <th className="text-left py-2 px-2">User</th>
                <th className="text-left py-2 px-2">Plan</th>
                <th className="text-left py-2 px-2">Status</th>
                <th className="text-left py-2 px-2">Period End</th>
                <th className="text-left py-2 px-2">Action</th>
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
                      <Skeleton className="h-4 w-16" />
                    </td>
                  </tr>
                ))
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-gray-500">
                    No subscriptions found
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => (
                  <tr key={sub.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-2">
                      <div>
                        <div className="font-medium">{sub.user?.fullName || 'Unknown'}</div>
                        <div className="text-xs text-gray-500">{sub.user?.email}</div>
                      </div>
                    </td>
                    <td className="py-2 px-2 font-medium">{sub.plan}</td>
                    <td className="py-2 px-2">
                      <Badge className={getStatusColor(sub.status, !!sub.cancelledAt)}>
                        {sub.cancelledAt ? 'Cancelled' : sub.status}
                      </Badge>
                    </td>
                    <td className="py-2 px-2 text-xs text-gray-500">
                      {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-2">
                      {!sub.cancelledAt && (
                        <button
                          onClick={() => handleCancel(sub.id)}
                          disabled={cancelling === sub.id}
                          className="text-red-600 hover:text-red-800 disabled:opacity-50 inline-flex items-center gap-1"
                        >
                          <X className="h-4 w-4" />
                          {cancelling === sub.id ? 'Cancelling...' : 'Cancel'}
                        </button>
                      )}
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
