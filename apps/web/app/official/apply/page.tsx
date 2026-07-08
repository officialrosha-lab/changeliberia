'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiGet, apiPost } from '../../../lib/api';
import { useAuthStore } from '../../../lib/store';

// Individual offices only — the backend DTO rejects org-level categories
// (MINISTRY/AGENCY); those are claimed from the directory instead.
const CATEGORIES = [
  ['SENATOR', 'Senator'],
  ['REPRESENTATIVE', 'Representative'],
  ['MAYOR', 'City Mayor'],
  ['SUPERINTENDENT', 'Superintendent'],
  ['COMMISSIONER', 'Commissioner'],
  ['DISTRICT_COMMISSIONER', 'District Commissioner'],
  ['EXECUTIVE_OFFICE', 'National Executive Office'],
] as const;

interface ClaimableInstitution {
  id: string;
  name: string;
  category: string;
  type: string;
  county: string | null;
  district: string | null;
  city: string | null;
  officialEmail: string;
  verified: boolean;
}

export default function OfficialApplyPage() {
  const token = useAuthStore((s) => s.token);
  const [mode, setMode] = useState<'create' | 'claim'>('create');
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

  // Claim mode state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ClaimableInstitution[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState<ClaimableInstitution | null>(null);
  const [claimForm, setClaimForm] = useState({
    phone: '',
    politicalParty: '',
    bio: '',
    verificationDocUrl: '',
  });

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateClaim<K extends keyof typeof claimForm>(key: K, value: (typeof claimForm)[K]) {
    setClaimForm((f) => ({ ...f, [key]: value }));
  }

  // Debounced directory search for claim mode
  useEffect(() => {
    if (mode !== 'claim' || !token || selected) return;
    const term = searchQuery.trim();
    if (term.length < 2) {
      setSearchResults([]);
      setSearched(false);
      return;
    }
    const handle = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await apiGet<ClaimableInstitution[]>(
          `/officials/claimable?search=${encodeURIComponent(term)}`,
          token,
        );
        setSearchResults(results);
        setSearched(true);
      } catch {
        setSearchResults([]);
        setSearched(true);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(handle);
  }, [searchQuery, mode, token, selected]);

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

  async function handleClaimSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !selected) return;
    setSubmitting(true);
    setError(null);
    try {
      // Omit empty strings so optional directory data (e.g. phone) isn't clobbered
      const body: Record<string, string> = { institutionId: selected.id };
      for (const [key, value] of Object.entries(claimForm)) {
        if (value.trim()) body[key] = value.trim();
      }
      await apiPost('/officials/claim', body, token);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Claim failed');
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

  const inputClass =
    'mt-1 w-full rounded-2xl border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200';

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-extrabold text-zinc-900">Apply for an Official Account</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Verified officials get a dashboard to view constituency petitions and civic pulse activity,
        and to respond publicly and transparently. All applications are manually reviewed.
      </p>

      {/* Mode toggle */}
      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => {
            setMode('create');
            setError(null);
          }}
          className={`rounded-2xl border p-3 text-left text-sm transition ${
            mode === 'create'
              ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200'
              : 'border-zinc-300 hover:border-emerald-300'
          }`}
        >
          <span className="block font-semibold text-zinc-900">Create new office</span>
          <span className="mt-0.5 block text-xs text-zinc-500">
            For elected/appointed officials — Senator, Representative, Mayor, Superintendent…
          </span>
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('claim');
            setError(null);
          }}
          className={`rounded-2xl border p-3 text-left text-sm transition ${
            mode === 'claim'
              ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200'
              : 'border-zinc-300 hover:border-emerald-300'
          }`}
        >
          <span className="block font-semibold text-zinc-900">Claim existing institution</span>
          <span className="mt-0.5 block text-xs text-zinc-500">
            For ministries, agencies, and offices already listed in the public directory
          </span>
        </button>
      </div>

      {mode === 'create' ? (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700">Office / title</label>
            <input
              required
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="e.g. Senator, Montserrado County"
              className={inputClass}
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
            <p className="mt-1 text-xs text-zinc-400">
              Representing a ministry or agency? Use &quot;Claim existing institution&quot; above.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-zinc-700">County</label>
              <input
                value={form.county}
                onChange={(e) => update('county', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700">District (if applicable)</label>
              <input
                value={form.district}
                onChange={(e) => update('district', e.target.value)}
                className={inputClass}
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
              className={inputClass}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-zinc-700">Political party (optional)</label>
              <input
                value={form.politicalParty}
                onChange={(e) => update('politicalParty', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700">Office phone</label>
              <input
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">Bio</label>
            <textarea
              rows={4}
              value={form.bio}
              onChange={(e) => update('bio', e.target.value)}
              className={inputClass}
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
              className={inputClass}
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
      ) : (
        <form onSubmit={handleClaimSubmit} className="mt-8 space-y-4">
          {!selected ? (
            <>
              <div>
                <label className="block text-sm font-medium text-zinc-700">
                  Search the public directory
                </label>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. Ministry of Health"
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-zinc-400">
                  Type at least 2 characters to search unclaimed institutions.
                </p>
              </div>

              {searching && <p className="text-sm text-zinc-500">Searching…</p>}

              {!searching && searched && searchResults.length === 0 && (
                <p className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
                  No matching unclaimed institutions. If your office isn&apos;t listed, switch to
                  &quot;Create new office&quot; instead.
                </p>
              )}

              <div className="space-y-2">
                {searchResults.map((inst) => (
                  <button
                    key={inst.id}
                    type="button"
                    onClick={() => setSelected(inst)}
                    className="w-full rounded-2xl border border-zinc-300 p-3 text-left text-sm transition hover:border-emerald-400 hover:bg-emerald-50"
                  >
                    <span className="block font-semibold text-zinc-900">{inst.name}</span>
                    <span className="mt-0.5 block text-xs text-zinc-500">
                      {inst.category.replaceAll('_', ' ')}
                      {inst.county ? ` · ${inst.county}` : ''}
                      {inst.district ? ` · District ${inst.district}` : ''}
                      {inst.city ? ` · ${inst.city}` : ''}
                      {' · '}
                      {inst.officialEmail}
                      {inst.verified ? ' · In directory' : ''}
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-emerald-900">{selected.name}</p>
                    <p className="mt-0.5 text-xs text-emerald-700">
                      {selected.category.replaceAll('_', ' ')}
                      {selected.county ? ` · ${selected.county}` : ''}
                      {selected.district ? ` · District ${selected.district}` : ''}
                      {' · '}
                      {selected.officialEmail}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="shrink-0 text-xs font-semibold text-emerald-700 underline"
                  >
                    Change selection
                  </button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-zinc-700">Office phone (optional)</label>
                  <input
                    value={claimForm.phone}
                    onChange={(e) => updateClaim('phone', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700">Political party (optional)</label>
                  <input
                    value={claimForm.politicalParty}
                    onChange={(e) => updateClaim('politicalParty', e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700">Bio</label>
                <textarea
                  rows={4}
                  value={claimForm.bio}
                  onChange={(e) => updateClaim('bio', e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700">
                  Appointment / authorization verification document URL
                </label>
                <input
                  value={claimForm.verificationDocUrl}
                  onChange={(e) => updateClaim('verificationDocUrl', e.target.value)}
                  placeholder="Link to an appointment letter or authorization to represent this institution"
                  className={inputClass}
                />
              </div>

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Submitting…' : 'Submit claim for review'}
              </button>
            </>
          )}
        </form>
      )}
    </main>
  );
}
