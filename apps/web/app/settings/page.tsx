import { Suspense } from 'react';
import Link from 'next/link';
import { ProfileSettings } from '../../components/dashboard/profile-settings';
import { PushNotificationToggle } from '../../components/push-notification-toggle';

export const metadata = { title: 'Account Settings — Change Liberia' };

export default function SettingsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/dashboard"
          className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-neutral-400 dark:hover:text-white"
        >
          ← Dashboard
        </Link>
        <span className="text-zinc-300 dark:text-neutral-600">/</span>
        <span className="text-sm font-medium text-zinc-900 dark:text-white">Settings</span>
      </div>
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-white">Account Settings</h1>
      <Suspense fallback={<div className="py-8 text-center text-sm text-zinc-500">Loading…</div>}>
        <ProfileSettings />
      </Suspense>

      <div className="mt-6">
        <PushNotificationToggle />
      </div>
    </main>
  );
}
