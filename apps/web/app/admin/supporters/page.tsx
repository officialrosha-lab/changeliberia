'use client';

import { useAuthStore } from '../../../lib/store';
import { AdminSupportersPanel } from '../../../components/admin/admin-supporters-panel';

export default function AdminSupportersPage() {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Supporters</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-neutral-400">
          Everyone who&apos;s joined the movement and the contact details they left — use this to send newsletters, updates, and outreach.
        </p>
      </div>

      {isAuthenticated ? (
        <AdminSupportersPanel />
      ) : (
        <p className="text-zinc-600 dark:text-neutral-400">Sign in with an admin account to continue.</p>
      )}
    </div>
  );
}
