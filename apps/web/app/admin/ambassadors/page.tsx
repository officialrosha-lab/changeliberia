import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { AdminAmbassadorsPanel } from '@/components/admin/admin-ambassadors-panel';

export const metadata: Metadata = {
  title: 'Manage Ambassadors | Admin',
};

async function getAmbassadors(token: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/ambassadors/admin`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ambassadors: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching ambassadors:', error);
    return [];
  }
}

export default async function AdminAmbassadorsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value || '';

  const ambassadors = await getAmbassadors(token);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Ambassador Applications</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-neutral-400">
          Review and manage Voice for Change ambassador applications.
        </p>
      </div>

      <AdminAmbassadorsPanel initialApplications={ambassadors} />
    </div>
  );
}
