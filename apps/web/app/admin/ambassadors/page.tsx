'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '../../../lib/store';
import { apiGet } from '../../../lib/api';
import { AdminAmbassadorsPanel } from '../../../components/admin/admin-ambassadors-panel';

export default function AdminAmbassadorsPage() {
  const { token } = useAuthStore();
  const [ambassadors, setAmbassadors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const fetchAmbassadors = async () => {
      try {
        const data = await apiGet<any[]>('/ambassadors/admin', token);
        setAmbassadors(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAmbassadors();
  }, [token]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Ambassador Applications</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-neutral-400">
          Review and manage Voice for Change ambassador applications.
        </p>
      </div>

      {loading && <p className="text-zinc-600">Loading...</p>}
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-950/20"><p className="text-sm text-red-700 dark:text-red-300">{error}</p></div>}
      
      {!loading && !error && <AdminAmbassadorsPanel initialApplications={ambassadors} />}
    </div>
  );
}
