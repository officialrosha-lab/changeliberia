'use client';

import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, Users, AlertCircle } from 'lucide-react';
import { apiGet } from '../lib/api';
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
  <h3 className={`text-sm font-medium text-gray-600 ${className}`}>{children}</h3>
);

const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 pt-0 ${className}`}>{children}</div>
);

const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse rounded-md bg-gradient-to-r from-zinc-200 to-zinc-100 dark:from-neutral-700 dark:to-neutral-800 ${className}`} />
);

interface DashboardData {
  totalRevenue: number;
  activeSubscriptions: number;
  refundCount: number;
  refundRate: number;
  currency: string;
}

export function AdminStripeDashboard() {
  const token = useAuthStore((s) => s.token);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      try {
        const result = await apiGet<DashboardData>('/admin/stripe/dashboard', token);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [token]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

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
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">
                {data?.currency} {(data?.totalRevenue ?? 0).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <DollarSign className="h-8 w-8 text-green-600 opacity-20" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Subscriptions</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-2xl font-bold">{data?.activeSubscriptions ?? 0}</span>
            <Users className="h-8 w-8 text-blue-600 opacity-20" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Refunds</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-2xl font-bold">{data?.refundCount ?? 0}</span>
            <AlertCircle className="h-8 w-8 text-orange-600 opacity-20" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Refund Rate</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-2xl font-bold">{(data?.refundRate ?? 0).toFixed(2)}%</span>
            <TrendingUp className="h-8 w-8 text-purple-600 opacity-20" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
