'use client';

import { useState } from 'react';
import Link from 'next/link';
import { apiPost } from '../../../lib/api';
import { useAuthStore } from '../../../lib/store';

const CATEGORIES = [
  ['SENATOR', 'Senator'],
  ['REPRESENTATIVE', 'Representative'],
  ['MAYOR', 'City Mayor'],
  ['SUPERINTENDENT', 'Superintendent'],
  ['COMMISSIONER', 'Commissioner'],
  ['DISTRICT_COMMISSIONER', 'District Commissioner'],
  ['EXECUTIVE_OFFICE', 'National Executive Office'],
  ['MINISTRY', 'Ministry'],
  ['AGENCY', 'Government Agency'],
] as const;

export default function OfficialApplyPage() {
  const token = useAuthStore((s) => s.token);
  const [form, setForm] = useState({
    name: '',
    category: 'SENATOR',
    officialEmail: '',
    county: '',
    district: '',
    politicalParty: '',
    phone: '',
    bio: '',
    verificationDocUrl: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      setError('You must sign in to apply for an official account.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await apiPost('/officials/apply', form, token);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Application failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-zinc-900">Sign in required</h1>
        <p className="mt-3 text-zinc-600">
          You must{' '}
          <Link href="/auth/login" className="font-semibold text-emerald-700 underline">
            sign in
          </Link>{' '}
          to apply for a Public Officials Portal account.
        </p>
      </main>
    );
  }

  if (success) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8">
          <h1 className="text-2xl font-bold text-emerald-800">Application submitted</h1>
          <p className="mt-3 text-emerald-700">
            Thank you. Your official account application is now pending admin review. You&apos;ll receive
            an email once it has been verified.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-extrabold text-zinc-900">Apply for an Official Account</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Verified officials get a dashboard to view constituency petitions and civic pulse activity,
        and to respond publicly and transparently. All applications are manually reviewed.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700">Office / title</label>
          <input
            required
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="e.g. Senator, Montserrado County"
            className="mt-1 w-full rounded-2xl border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">Category</label>
          <select
            value={form.category}
            onChange={(e) => update('category', e.target.value)}
            className="mt-1 w-full rounded-2xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
          >
            {CATEGORIES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-zinc-700">County</label>
            <input
              value={form.county}
              onChange={(e) => update('county', e.target.value)}
              className="mt-1 w-full rounded-2xl border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">District (if applicable)</label>
            <input
              value={form.district}
              onChange={(e) => update('district', e.target.value)}
              className="mt-1 w-full rounded-2xl border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">Official government email</label>
          <input
            required
            type="email"
            value={form.officialEmail}
            onChange={(e) => update('officialEmail', e.target.value)}
            className="mt-1 w-full rounded-2xl border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-zinc-700">Political party (optional)</label>
            <input
              value={form.politicalParty}
              onChange={(e) => update('politicalParty', e.target.value)}
              className="mt-1 w-full rounded-2xl border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">Office phone</label>
            <input
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
              className="mt-1 w-full rounded-2xl border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">Bio</label>
          <textarea
            rows={4}
            value={form.bio}
            onChange={(e) => update('bio', e.target.value)}
            className="mt-1 w-full rounded-2xl border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">
            Appointment / election verification document URL
          </label>
          <input
            value={form.verificationDocUrl}
            onChange={(e) => update('verificationDocUrl', e.target.value)}
            placeholder="Link to a certificate of election / appointment letter"
            className="mt-1 w-full rounded-2xl border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
          />
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Submitting…' : 'Submit application'}
        </button>
      </form>
    </main>
  );
}
