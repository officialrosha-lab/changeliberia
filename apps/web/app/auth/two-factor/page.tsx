import Link from 'next/link';

export const metadata = { title: 'Two-Factor Authentication — Change Liberia' };

export default function TwoFactorPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <div className="mb-6">
        <Link href="/settings" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-neutral-400 dark:hover:text-white">
          ← Settings
        </Link>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/40">
          <svg className="h-6 w-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
          </svg>
        </div>

        <h1 className="mt-4 text-xl font-bold text-zinc-900 dark:text-white">Two-Factor Authentication</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-neutral-300">
          Two-factor authentication adds an extra layer of security to your account by requiring a second verification step when you sign in.
        </p>

        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/30">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Coming soon</p>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
            We are working on TOTP authenticator app support (Google Authenticator, Authy). This will be available in a future update.
          </p>
        </div>

        <p className="mt-5 text-sm text-zinc-500 dark:text-neutral-400">
          In the meantime, your account is protected by your password and phone verification.
        </p>

        <Link
          href="/settings"
          className="mt-6 inline-flex rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
        >
          Back to Settings
        </Link>
      </div>
    </main>
  );
}
