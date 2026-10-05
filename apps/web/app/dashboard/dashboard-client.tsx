'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { FormEvent, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { ApiError, apiGet, apiGetBlob, apiPatch, apiPost, apiPostFormData } from '../../lib/api';
import { useAuthStore } from '../../lib/store';

type User = {
  id: string;
  fullName: string;
  trustScore: number;
  verificationStatus: string;
  role: string;
};

type CompletedSteps = {
  geo: boolean;
  device: boolean;
  idDocument: boolean;
};

type MyPetition = {
  id: string;
  title: string;
  summary: string;
  description: string;
  imageUrl?: string | null;
  status: string;
  signaturesCount: number;
  goal: number;
};

type GovernmentStatus = {
  petitionId: string;
  submitted: boolean;
  status: string;
  submittedAt?: string;
  updatedAt?: string;
};

function formatStatus(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

export function DashboardClient() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hydrated = useAuthStore((s) => s.hydrated);
  const setSession = useAuthStore((s) => s.setSession);
  const router = useRouter();
  const [loadError, setLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [petitions, setPetitions] = useState<MyPetition[]>([]);
  const [message, setMessage] = useState('');
  const [governmentStatuses, setGovernmentStatuses] = useState<Record<string, GovernmentStatus>>({});
  const [completed, setCompleted] = useState<CompletedSteps>({ geo: false, device: false, idDocument: false });
  const [verifying, setVerifying] = useState<string | null>(null);
  const [idType, setIdType] = useState('passport');
  const [idUrl, setIdUrl] = useState('');
  const [idFile, setIdFile] = useState<File | null>(null);
  const [idSubmitting, setIdSubmitting] = useState(false);
const [shareOpenId, setShareOpenId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [updatePetitionId, setUpdatePetitionId] = useState<string | null>(null);
  const [updateTitle, setUpdateTitle] = useState('');
  const [updateBody, setUpdateBody] = useState('');
  const [updateSubmitting, setUpdateSubmitting] = useState(false);
  const [editPetitionId, setEditPetitionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<{ petitionId: string; message: string } | null>(null);

  useEffect(() => {
    // Wait for the initial session check (AuthSessionBootstrap) to resolve
    // before deciding anything — isAuthenticated still reads its false
    // default during that brief window, and redirecting on it would bounce
    // a genuinely logged-in user straight back out on a page load/refresh.
    if (!hydrated) return;
    if (!isAuthenticated) { router.replace('/'); return; }
  }, [hydrated, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    void (async () => {
      try {
        const [me, mine, steps] = await Promise.all([
          apiGet<User>('/users/me'),
          apiGet<MyPetition[]>('/users/me/petitions'),
          apiGet<CompletedSteps>('/verification/completed'),
        ]);
        if (!cancelled) {
          setUser(me);
          setPetitions(mine);
          setCompleted(steps);
          setLoadError(false);
        }
      } catch (err) {
        if (cancelled) return;
        // Only a real 401 means the session is actually gone — anything
        // else (a network blip, a 500, a timeout) is transient and
        // shouldn't sign the user out and bounce them to the homepage.
        if (err instanceof ApiError && err.status === 401) {
          setSession(null);
          setMessage('Session expired. Sign in again.');
        } else {
          setLoadError(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, setSession, retryKey]);

  useEffect(() => {
    if (!isAuthenticated || petitions.length === 0) return;
    let cancelled = false;

    void (async () => {
      const govResults = await Promise.allSettled(
        petitions.map((p) => apiGet<GovernmentStatus>(`/government/status/${p.id}`)),
      );

      if (cancelled) return;

      const statusMap: Record<string, GovernmentStatus> = {};
      govResults.forEach((result, index) => {
        if (result.status === 'fulfilled') statusMap[petitions[index].id] = result.value;
      });
      setGovernmentStatuses(statusMap);
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, petitions]);

  async function copyLink(url: string) {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function refreshTrust() {
    if (!isAuthenticated) return;
    const [me, steps] = await Promise.all([
      apiGet<User>('/users/me'),
      apiGet<CompletedSteps>('/verification/completed'),
    ]);
    setUser(me);
    setCompleted(steps);
  }

  async function runGeoVerification() {
    if (!isAuthenticated || verifying) return;
    setVerifying('geo');
    setMessage('');
    try {
      const result = await apiPost<{ verificationStatus: string }>('/verification/geo', {});
      await refreshTrust();
      const isLiberia = result?.verificationStatus === 'VERIFIED_LIBERIAN' || result?.verificationStatus === 'HIGH_TRUST';
      setMessage(
        isLiberia
          ? 'Liberia location confirmed. Your trust score has been updated.'
          : 'Location confirmed. Your trust score has been updated.',
      );
    } catch {
      setMessage('Could not confirm location. Please try again.');
    } finally {
      setVerifying(null);
    }
  }

  async function runDeviceVerification() {
    if (!isAuthenticated || verifying) return;
    setVerifying('device');
    setMessage('');
    try {
      const components = [
        navigator.userAgent,
        navigator.language,
        `${screen.width}x${screen.height}`,
        String(screen.colorDepth),
        Intl.DateTimeFormat().resolvedOptions().timeZone,
        String(navigator.hardwareConcurrency),
        String(navigator.maxTouchPoints),
      ].join('|');
      let hash = 0;
      for (let i = 0; i < components.length; i++) {
        hash = ((hash << 5) - hash) + components.charCodeAt(i);
        hash |= 0;
      }
      const fingerprint = Math.abs(hash).toString(16);
      await apiPost('/verification/device', { fingerprint });
      await refreshTrust();
      setMessage('Device linked. Your trust score has been updated.');
    } catch {
      setMessage('Could not link device. Please try again.');
    } finally {
      setVerifying(null);
    }
  }

  async function submitId(e: FormEvent) {
    e.preventDefault();
    if (!isAuthenticated || idSubmitting) return;
    if (!idFile && !idUrl.trim()) return;
    setIdSubmitting(true);
    try {
      if (idFile) {
        const fd = new FormData();
        fd.append('type', idType);
        fd.append('file', idFile);
        await apiPostFormData('/verification/id-document', fd);
        setIdFile(null);
      } else {
        await apiPost(
          '/verification/id-document',
          { type: idType, fileUrl: idUrl.trim() },
        );
        setIdUrl('');
      }
      setMessage('ID submitted for admin review. Trust increases when approved.');
    } catch (err) {
      setMessage(err instanceof Error ? `Could not submit ID: ${err.message}` : 'Could not submit ID. Please try again.');
    } finally {
      setIdSubmitting(false);
    }
  }

  async function handlePetitionDownload(petitionId: string, format: 'pdf' | 'csv') {
    if (!isAuthenticated) return;
    const key = `${petitionId}-${format}`;
    setDownloadingId(key);
    setDownloadError(null);
    try {
      const path = format === 'pdf'
        ? `/government/report/${petitionId}`
        : `/government/report/${petitionId}/csv`;
      const date = new Date().toISOString().slice(0, 10);
      const blob = await apiGetBlob(path);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = format === 'pdf'
        ? `petition-${petitionId}-${date}.pdf`
        : `signatures-${petitionId}-${date}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setDownloadError(null);
    } catch (err) {
      setDownloadError({ petitionId, message: err instanceof Error ? err.message : 'Download failed' });
    } finally {
      setDownloadingId(null);
    }
  }

  function openEdit(p: MyPetition) {
    setEditPetitionId(p.id);
    setEditTitle(p.title);
    setEditSummary(p.summary ?? '');
    setEditDescription(p.description ?? '');
    setEditImageUrl(p.imageUrl ?? '');
  }

  async function uploadMedia(file: File, kind: 'cover' | 'embed') {
    if (!isAuthenticated || !editPetitionId) return;
    setMediaUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const result = await apiPostFormData(`/petitions/${editPetitionId}/media`, fd) as { url: string };
      if (kind === 'cover') {
        setEditImageUrl(result.url);
      } else {
        setEditDescription((prev) => (prev ? `${prev}\n${result.url}` : result.url));
      }
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setMediaUploading(false);
    }
  }

  async function submitEdit(e: FormEvent) {
    e.preventDefault();
    if (!isAuthenticated || !editPetitionId) return;
    setEditSubmitting(true);
    try {
      await apiPatch(
        `/petitions/${editPetitionId}`,
        {
          title: editTitle,
          summary: editSummary,
          description: editDescription,
          imageUrl: editImageUrl || undefined,
        },
      );
      setPetitions((prev) =>
        prev.map((p) =>
          p.id === editPetitionId
            ? { ...p, title: editTitle, summary: editSummary, description: editDescription, imageUrl: editImageUrl || p.imageUrl }
            : p,
        ),
      );
      setEditPetitionId(null);
      setMessage('Petition updated.');
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Could not save changes.');
    } finally {
      setEditSubmitting(false);
    }
  }

  async function submitUpdate(e: FormEvent) {
    e.preventDefault();
    if (!isAuthenticated || !updatePetitionId || !updateTitle.trim() || !updateBody.trim() || updateSubmitting) {
      return;
    }
    setUpdateSubmitting(true);
    try {
      await apiPost(
        `/petitions/${updatePetitionId}/updates`,
        { title: updateTitle.trim(), body: updateBody.trim() },
      );
      setUpdatePetitionId(null);
      setUpdateTitle('');
      setUpdateBody('');
      setMessage('Update published.');
    } catch (err) {
      setMessage(err instanceof Error ? `Could not publish update: ${err.message}` : 'Could not publish update. Please try again.');
    } finally {
      setUpdateSubmitting(false);
    }
  }

  const allVerified = completed.geo && completed.device && completed.idDocument;

  if (!isAuthenticated) {
    return null;
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="rounded-3xl bg-white p-6 shadow-sm md:p-8 dark:bg-neutral-900">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400">
          Campaign dashboard
        </p>
        <h1 className="mt-3 text-3xl font-bold text-zinc-900 dark:text-white">
          {user ? `Welcome back, ${user.fullName}` : 'Dashboard'}
        </h1>
        <p className="mt-3 max-w-2xl text-zinc-600 dark:text-neutral-400">
          Track your trust status, manage petitions, and keep supporters updated as your campaign
          grows.
        </p>
        {message ? (
          <p className={`mt-4 text-sm font-medium ${message.startsWith('Could not') ? 'text-red-600 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
            {message}
          </p>
        ) : null}

        {loadError && !user ? (
          <div className="mt-4 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-4 text-center dark:border-neutral-700 dark:bg-neutral-800">
            <p className="text-sm text-zinc-600 dark:text-neutral-400">
              Couldn&apos;t load your dashboard right now.
            </p>
            <button
              type="button"
              onClick={() => setRetryKey((k) => k + 1)}
              className="mt-2 text-sm font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
            >
              Try again
            </button>
          </div>
        ) : null}

        {user ? (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-neutral-800">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-neutral-400">Trust score</p>
                <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-white">{user.trustScore}</p>
              </div>
              <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-neutral-800">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-neutral-400">Verification</p>
                <p className="mt-2 text-lg font-semibold text-zinc-900 dark:text-white">
                  {user.verificationStatus.replaceAll('_', ' ')}
                </p>
              </div>
              <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-neutral-800">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-neutral-400">My petitions</p>
                <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-white">{petitions.length}</p>
              </div>
              {user.role === 'ADMIN' && (
                <div className="rounded-2xl bg-zinc-50 dark:bg-neutral-800 p-4 flex flex-col justify-between">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-neutral-400">Admin access</p>
                  <Link
                    href="/admin"
                    className="mt-3 inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md active:scale-95 dark:bg-emerald-500 dark:hover:bg-emerald-400"
                  >
                    Open admin panel
                  </Link>
                </div>
              )}
            </div>
            <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-neutral-100">Organizations</p>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-neutral-400">
                    Run an NGO or team workspace — invite teammates, and optionally upgrade for more seats.
                  </p>
                </div>
                <Link
                  href="/organizations"
                  className="inline-flex rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400"
                >
                  My organizations
                </Link>
              </div>
            </div>
            <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-neutral-100">Marketplace</p>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-neutral-400">
                    Optional paid tools that fund the platform — sponsorships, research products, events, API
                    access, and Studio services.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    <Link href="/promotions" className="hover:underline">My promotions</Link>
                    <Link href="/invoices" className="hover:underline">My invoices</Link>
                  </div>
                </div>
                <Link
                  href="/marketplace"
                  className="inline-flex rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400"
                >
                  Browse marketplace
                </Link>
              </div>
            </div>
            <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-neutral-100">Government submissions</p>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-neutral-400">Track petitions you&apos;ve submitted to government or NGO contacts.</p>
                </div>
                <Link
                  href="/government/submissions"
                  className="inline-flex rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400"
                >
                  View submissions
                </Link>
              </div>
            </div>
          </>
        ) : null}
      </div>

      {allVerified ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 dark:border-emerald-800 dark:bg-emerald-950/30">
          <span className="flex items-center gap-2 text-sm font-medium text-emerald-800 dark:text-emerald-300">
            <svg className="h-4 w-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            Account fully verified
          </span>
          <Link href="/settings" className="text-xs font-semibold text-emerald-700 underline hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-300">
            View verification details
          </Link>
        </div>
      ) : null}

      <div className={`mt-6 grid gap-6 ${allVerified ? '' : 'lg:grid-cols-[1.1fr_0.9fr]'}`}>
        {!allVerified ? (
          <section className="rounded-3xl bg-white p-5 shadow-sm dark:bg-neutral-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Grow your account trust</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-neutral-400">
              Complete the steps below so your petitions and signatures carry more credibility.
            </p>
            <div className="mt-5 space-y-3">
              {([
                {
                  key: 'geo' as const,
                  label: 'Confirm Liberia location',
                  desc: 'Verify your network is in Liberia to add stronger local credibility to your petitions.',
                  btnLabel: 'Verify location',
                  doneLabel: 'Location confirmed',
                  filled: false,
                },
                {
                  key: 'device' as const,
                  label: 'Secure this device',
                  desc: 'Helps reduce abuse and makes future support actions smoother.',
                  btnLabel: 'Link device',
                  doneLabel: 'Device linked',
                  filled: false,
                },
              ]).map(({ key, label, desc, btnLabel, doneLabel, filled }) => {
                const isDone = completed[key as keyof CompletedSteps];
                const isLoading = verifying === key;
                const handleClick = key === 'geo' ? runGeoVerification : runDeviceVerification;
                return (
                  <div
                    key={key}
                    className={`rounded-2xl border p-4 transition-colors ${isDone ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30' : 'border-zinc-200 dark:border-neutral-700'}`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-2 min-w-0">
                        {isDone && (
                          <span className="mt-0.5 flex-shrink-0 text-emerald-600 dark:text-emerald-400">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className={`font-semibold ${isDone ? 'text-emerald-900 dark:text-emerald-200' : 'text-zinc-900 dark:text-white'}`}>{label}</p>
                          <p className="mt-1 text-sm text-zinc-600 dark:text-neutral-400">{desc}</p>
                        </div>
                      </div>
                      {isDone ? (
                        <span className="self-start flex-shrink-0 rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                          {doneLabel}
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={isLoading || !!verifying}
                          onClick={handleClick}
                          className={`self-start flex-shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${
                            filled
                              ? 'bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200'
                              : 'border border-zinc-200 bg-white text-zinc-800 shadow-sm hover:bg-zinc-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700'
                          }`}
                        >
                          {isLoading ? 'Working…' : btnLabel}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <form onSubmit={submitId} className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-800 dark:bg-emerald-950/30">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-lg text-white shadow-sm dark:bg-emerald-500">
                  🪪
                </span>
                <div>
                  <p className="font-bold text-emerald-950 dark:text-emerald-200">Submit an ID for review</p>
                  <p className="mt-0.5 text-sm text-emerald-800/80 dark:text-emerald-400">
                    ID review gives your account the strongest trust boost once approved by an admin.
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <select
                  value={idType}
                  onChange={(e) => setIdType(e.target.value)}
                  className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2.5 text-sm text-zinc-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-emerald-800 dark:bg-neutral-800 dark:text-neutral-200"
                >
                  <option value="passport">Passport</option>
                  <option value="voter_id">Voter ID</option>
                  <option value="utility_bill">Utility Bill (proof of residency)</option>
                  <option value="other">Other government ID</option>
                </select>

                <label className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-dashed border-emerald-300 bg-white px-4 py-3 transition hover:border-emerald-400 hover:bg-emerald-50/50 dark:border-emerald-700 dark:bg-neutral-800 dark:hover:border-emerald-600 dark:hover:bg-neutral-800/70">
                  <svg className="h-5 w-5 flex-shrink-0 text-emerald-500 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  <span className="text-sm text-zinc-500 dark:text-neutral-400">
                    {idFile ? (
                      <span className="font-medium text-emerald-700 dark:text-emerald-400">{idFile.name}</span>
                    ) : (
                      <>Upload JPEG, PNG or PDF <span className="text-zinc-400 dark:text-neutral-500">— up to 5 MB</span></>
                    )}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,application/pdf"
                    onChange={(e) => setIdFile(e.target.files?.[0] ?? null)}
                    className="sr-only"
                  />
                </label>

                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-emerald-200 dark:bg-emerald-800" />
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">or paste a URL</span>
                  <div className="h-px flex-1 bg-emerald-200 dark:bg-emerald-800" />
                </div>

                <input
                  value={idUrl}
                  onChange={(e) => setIdUrl(e.target.value)}
                  placeholder="https://drive.google.com/your-id-document"
                  className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-emerald-800 dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-500"
                />

                <button
                  type="submit"
                  disabled={idSubmitting}
                  className="w-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-5 py-2.5 text-sm font-semibold text-zinc-900 shadow-sm transition-all hover:from-amber-300 hover:to-amber-400 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {idSubmitting ? 'Submitting…' : 'Submit ID for review'}
                </button>
              </div>
            </form>
          </section>
        ) : null}

        <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">My petitions</h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-neutral-400">
                Create, manage, and share your campaigns. Track every signature and milestone.
              </p>
            </div>
            <Link
              href="/create"
              className="self-start flex-shrink-0 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-95 dark:bg-emerald-500 dark:hover:bg-emerald-400"
            >
              + Start a petition
            </Link>
          </div>

          <ul className="mt-4 space-y-3">
            {petitions.map((p) => {
              const progress = Math.min(100, Math.round((p.signaturesCount / p.goal) * 100));
              const petitionUrl = typeof window !== 'undefined'
                ? `${window.location.origin}/petitions/${p.id}`
                : `/petitions/${p.id}`;
              const shareText = `Sign this petition: ${p.title}`;
              const isShareOpen = shareOpenId === p.id;
              return (
                <li key={p.id} className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-4 transition hover:border-zinc-200 dark:border-neutral-800 dark:bg-neutral-800/50 dark:hover:border-neutral-700">
                  <Link href={`/petitions/${p.id}`} className="text-sm font-semibold text-zinc-900 hover:text-emerald-700 transition-colors dark:text-white dark:hover:text-emerald-400">
                    {p.title}
                  </Link>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      p.status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                        : p.status === 'REJECTED'
                        ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                        : 'bg-zinc-100 text-zinc-600 dark:bg-neutral-800 dark:text-neutral-300'
                    }`}>
                      {formatStatus(p.status)}
                    </span>
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{(p.signaturesCount ?? 0).toLocaleString()} signatures</span>
                    <span className="text-xs text-zinc-400 dark:text-neutral-500">{progress}% of goal</span>
                    {governmentStatuses[p.id] ? (
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        governmentStatuses[p.id].submitted
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                      }`}>
                        {governmentStatuses[p.id].submitted ? 'Gov submitted' : 'Gov ready'}
                      </span>
                    ) : p.signaturesCount >= p.goal ? (
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                        Ready for gov review
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-neutral-700">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setShareOpenId(isShareOpen ? null : p.id)}
                      className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:border-emerald-700 dark:hover:text-emerald-400"
                    >
                      Share
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(p)}
                      className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:border-neutral-600 dark:hover:bg-neutral-700"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setUpdatePetitionId(p.id)}
                      className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:border-neutral-600 dark:hover:bg-neutral-700"
                    >
                      Post update
                    </button>
                    <Link
                      href={`/petitions/${p.id}`}
                      className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                    >
                      View petition
                    </Link>
                    <button
                      type="button"
                      onClick={() => handlePetitionDownload(p.id, 'pdf')}
                      disabled={downloadingId === `${p.id}-pdf`}
                      className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:border-emerald-700 dark:hover:text-emerald-400"
                    >
                      {downloadingId === `${p.id}-pdf` ? 'Downloading…' : 'PDF report'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePetitionDownload(p.id, 'csv')}
                      disabled={downloadingId === `${p.id}-csv`}
                      className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:border-emerald-700 dark:hover:text-emerald-400"
                    >
                      {downloadingId === `${p.id}-csv` ? 'Exporting…' : 'CSV export'}
                    </button>
                  </div>
                  {downloadError?.petitionId === p.id && (
                    <p className="mt-2 text-xs text-red-600 dark:text-red-400">{downloadError.message}</p>
                  )}
                  {isShareOpen && (
                    <div className="mt-3 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                      <div className="flex flex-col gap-4 sm:flex-row">
                        <div className="flex flex-col items-center gap-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(petitionUrl)}&size=120x120&margin=4`}
                            alt={`QR code for ${p.title}`}
                            className="h-[120px] w-[120px] rounded-xl border border-zinc-200 dark:border-neutral-700"
                          />
                          <a
                            href={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(petitionUrl)}&size=300x300&margin=8`}
                            download={`petition-${p.id}-qr.png`}
                            className="text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
                          >
                            Download QR Code
                          </a>
                        </div>
                        <div className="flex flex-wrap content-start gap-2">
                          <button
                            type="button"
                            onClick={() => void copyLink(petitionUrl)}
                            className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
                          >
                            {copied ? '✓ Copied!' : '📋 Copy link'}
                          </button>
                          <a
                            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(petitionUrl)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
                          >
                            📘 Facebook
                          </a>
                          <a
                            href={`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + petitionUrl)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
                          >
                            💬 WhatsApp
                          </a>
                          <a
                            href={`https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(petitionUrl)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
                          >
                            𝕏 Twitter
                          </a>
                          <a
                            href={`mailto:?subject=${encodeURIComponent(p.title)}&body=${encodeURIComponent(shareText + '\n\n' + petitionUrl)}`}
                            className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
                          >
                            ✉️ Email
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {petitions.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-6 text-center dark:border-neutral-700 dark:bg-neutral-800">
              <p className="text-sm font-semibold text-zinc-700 dark:text-neutral-200">No petitions yet</p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-neutral-400">
                Launch a petition to begin gathering support and keep campaigners updated.
              </p>
              <Link
                href="/create"
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95 dark:bg-emerald-500 dark:hover:bg-emerald-400"
              >
                ✍️ Start your first petition
              </Link>
            </div>
          ) : null}
        </section>
      </div>

      {editPetitionId && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-16">
          <form
            onSubmit={submitEdit}
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl dark:bg-neutral-900"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Edit petition</h3>
              <button
                type="button"
                onClick={() => setEditPetitionId(null)}
                className="rounded-full p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-neutral-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-neutral-400">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  maxLength={200}
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-neutral-400">Summary</label>
                <input
                  type="text"
                  value={editSummary}
                  onChange={(e) => setEditSummary(e.target.value)}
                  maxLength={500}
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-neutral-400">
                  Description{' '}
                  <span className="normal-case font-normal text-zinc-400">— paste YouTube/image/video URLs on their own line, or upload below</span>
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={10}
                  maxLength={20000}
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm leading-relaxed text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                />
                <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400">
                  <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  {mediaUploading ? 'Uploading…' : 'Upload image or video to embed'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                    disabled={mediaUploading}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void uploadMedia(f, 'embed');
                      e.target.value = '';
                    }}
                    className="sr-only"
                  />
                </label>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-neutral-400">Cover image</label>
                <input
                  type="url"
                  value={editImageUrl}
                  onChange={(e) => setEditImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                />
                <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400">
                  <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  {mediaUploading ? 'Uploading…' : 'Upload cover image'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    disabled={mediaUploading}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void uploadMedia(f, 'cover');
                      e.target.value = '';
                    }}
                    className="sr-only"
                  />
                </label>
                {editImageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={editImageUrl} alt="Petition image preview" className="mt-2 h-32 w-full rounded-xl object-cover" />
                )}
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <button
                type="submit"
                disabled={editSubmitting}
                className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-500 dark:hover:bg-emerald-400"
              >
                {editSubmitting ? 'Saving…' : 'Save changes'}
              </button>
              <button
                type="button"
                onClick={() => setEditPetitionId(null)}
                className="rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {updatePetitionId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={submitUpdate}
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-lg dark:bg-neutral-900"
          >
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Post a campaign update</h3>
            <p className="mt-1 text-sm text-zinc-600 dark:text-neutral-400">
              Let supporters know what has changed, what happened next, or what help you still
              need.
            </p>
            <input
              value={updateTitle}
              onChange={(e) => setUpdateTitle(e.target.value)}
              placeholder="e.g. Meeting secured with Ministry of Public Works"
              className="mt-4 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-500 dark:focus:bg-neutral-800"
            />
            <textarea
              value={updateBody}
              onChange={(e) => setUpdateBody(e.target.value)}
              placeholder="Share what happened, what changed, or what help you still need…"
              rows={4}
              className="mt-3 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-500 dark:focus:bg-neutral-800"
            />
            <div className="mt-3 flex gap-2">
              <button
                type="submit"
                disabled={updateSubmitting}
                className="rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updateSubmitting ? 'Publishing…' : 'Publish'}
              </button>
              <button
                type="button"
                onClick={() => setUpdatePetitionId(null)}
                className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  );
}
