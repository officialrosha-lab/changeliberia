'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { FormEvent, useEffect, useState } from 'react';
import { apiGet, apiPatch, apiPost, apiPostFormData } from '../../lib/api';
import { useAuthStore } from '../../lib/store';

type User = {
  id: string;
  fullName: string;
  trustScore: number;
  verificationStatus: string;
  role: string;
};

type CompletedSteps = {
  phone: boolean;
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
  const token = useAuthStore((s) => s.token);
  const setToken = useAuthStore((s) => s.setToken);
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [petitions, setPetitions] = useState<MyPetition[]>([]);
  const [message, setMessage] = useState('');
  const [governmentStatuses, setGovernmentStatuses] = useState<Record<string, GovernmentStatus>>({});
  const [completed, setCompleted] = useState<CompletedSteps>({ phone: false, geo: false, device: false, idDocument: false });
  const [verifying, setVerifying] = useState<string | null>(null);
  const [phoneStep, setPhoneStep] = useState<'idle' | 'enter_phone' | 'enter_otp'>('idle');
  const [phoneInput, setPhoneInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [idType, setIdType] = useState('passport');
  const [idUrl, setIdUrl] = useState('');
  const [idFile, setIdFile] = useState<File | null>(null);
const [shareOpenId, setShareOpenId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [updatePetitionId, setUpdatePetitionId] = useState<string | null>(null);
  const [updateTitle, setUpdateTitle] = useState('');
  const [updateBody, setUpdateBody] = useState('');
  const [editPetitionId, setEditPetitionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [mediaUploading, setMediaUploading] = useState(false);

  useEffect(() => {
    if (!token) { router.replace('/'); return; }
  }, [token, router]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void (async () => {
      try {
        const [me, mine, steps] = await Promise.all([
          apiGet<User>('/users/me', token),
          apiGet<MyPetition[]>('/users/me/petitions', token),
          apiGet<CompletedSteps>('/verification/completed', token),
        ]);
        if (!cancelled) {
          setUser(me);
          setPetitions(mine);
          setCompleted(steps);
        }
      } catch {
        if (!cancelled) {
          setToken(null);
          setMessage('Session expired. Sign in again.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, setToken]);

  useEffect(() => {
    if (!token || petitions.length === 0) return;
    let cancelled = false;

    void (async () => {
      const govResults = await Promise.allSettled(
        petitions.map((p) => apiGet<GovernmentStatus>(`/government/status/${p.id}`, token)),
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
  }, [token, petitions]);

  async function copyLink(url: string) {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function refreshTrust() {
    if (!token) return;
    const [me, steps] = await Promise.all([
      apiGet<User>('/users/me', token),
      apiGet<CompletedSteps>('/verification/completed', token),
    ]);
    setUser(me);
    setCompleted(steps);
  }

  async function requestPhoneOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !phoneInput.trim() || verifying) return;
    setVerifying('phone');
    setPhoneError('');
    try {
      await apiPost('/verification/phone/request-otp', { phone: phoneInput.trim() }, token);
      setPhoneStep('enter_otp');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      setPhoneError(msg || 'Could not send code. Please check your number and try again.');
    } finally {
      setVerifying(null);
    }
  }

  async function verifyPhoneOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !otpInput.trim() || verifying) return;
    setVerifying('phone');
    setPhoneError('');
    try {
      await apiPost('/verification/phone/verify-otp', { phone: phoneInput.trim(), code: otpInput.trim() }, token);
      await refreshTrust();
      setPhoneStep('idle');
      setPhoneInput('');
      setOtpInput('');
      setMessage('Phone verified. Your trust score has been updated.');
    } catch {
      setPhoneError('Invalid code. Please try again.');
    } finally {
      setVerifying(null);
    }
  }

  async function runGeoVerification() {
    if (!token || verifying) return;
    setVerifying('geo');
    setMessage('');
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 }),
      );
      const { latitude, longitude } = position.coords;
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
        { headers: { 'User-Agent': 'ChangeLiberia/1.0' } },
      );
      const geo = await resp.json() as { address?: { country_code?: string } };
      const countryCode = (geo?.address?.country_code ?? 'XX').toUpperCase();
      await apiPost('/verification/geo', { countryCode }, token);
      await refreshTrust();
      setMessage(
        countryCode === 'LR'
          ? 'Liberia location confirmed. Your trust score has been updated.'
          : 'Location confirmed. Your trust score has been updated.',
      );
    } catch (err: unknown) {
      const isGeoError = err instanceof GeolocationPositionError;
      setMessage(
        isGeoError
          ? 'Location access denied. Please allow location access in your browser and try again.'
          : 'Could not confirm location. Please try again.',
      );
    } finally {
      setVerifying(null);
    }
  }

  async function runDeviceVerification() {
    if (!token || verifying) return;
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
      await apiPost('/verification/device', { fingerprint }, token);
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
    if (!token) return;
    if (idFile) {
      const fd = new FormData();
      fd.append('type', idType);
      fd.append('file', idFile);
      await apiPostFormData('/verification/id-document', fd, token);
      setIdFile(null);
    } else if (idUrl.trim()) {
      await apiPost(
        '/verification/id-document',
        { type: idType, fileUrl: idUrl.trim() },
        token,
      );
      setIdUrl('');
    } else {
      return;
    }
    setMessage('ID submitted for admin review. Trust increases when approved.');
  }

  function openEdit(p: MyPetition) {
    setEditPetitionId(p.id);
    setEditTitle(p.title);
    setEditSummary(p.summary ?? '');
    setEditDescription(p.description ?? '');
    setEditImageUrl(p.imageUrl ?? '');
  }

  async function uploadMedia(file: File, kind: 'cover' | 'embed') {
    if (!token || !editPetitionId) return;
    setMediaUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const result = await apiPostFormData(`/petitions/${editPetitionId}/media`, fd, token) as { url: string };
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
    if (!token || !editPetitionId) return;
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
        token,
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
    if (!token || !updatePetitionId || !updateTitle.trim() || !updateBody.trim()) {
      return;
    }
    await apiPost(
      `/petitions/${updatePetitionId}/updates`,
      { title: updateTitle.trim(), body: updateBody.trim() },
      token,
    );
    setUpdatePetitionId(null);
    setUpdateTitle('');
    setUpdateBody('');
    setMessage('Update published.');
  }

  const allVerified = completed.phone && completed.geo && completed.device && completed.idDocument;

  if (!token) {
    return null;
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
          Campaign dashboard
        </p>
        <h1 className="mt-3 text-3xl font-bold text-zinc-900">
          {user ? `Welcome back, ${user.fullName}` : 'Dashboard'}
        </h1>
        <p className="mt-3 max-w-2xl text-zinc-600">
          Track your trust status, manage petitions, and keep supporters updated as your campaign
          grows.
        </p>
        {message ? (
          <p className={`mt-4 text-sm font-medium ${message.startsWith('Could not') ? 'text-red-600' : 'text-emerald-700'}`}>
            {message}
          </p>
        ) : null}

        {user ? (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl bg-zinc-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Trust score</p>
                <p className="mt-2 text-2xl font-bold text-zinc-900">{user.trustScore}</p>
              </div>
              <div className="rounded-2xl bg-zinc-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Verification</p>
                <p className="mt-2 text-lg font-semibold text-zinc-900">
                  {user.verificationStatus.replaceAll('_', ' ')}
                </p>
              </div>
              <div className="rounded-2xl bg-zinc-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">My petitions</p>
                <p className="mt-2 text-2xl font-bold text-zinc-900">{petitions.length}</p>
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
            {user.role === 'ADMIN' && (
              <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">Government submissions</p>
                    <p className="mt-1 text-sm text-zinc-600">View and manage petitions submitted to government or NGO contacts.</p>
                  </div>
                  <Link
                    href="/government/submissions"
                    className="inline-flex rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    View submissions
                  </Link>
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>

      {allVerified ? (
        <div className="mt-6 flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3">
          <span className="flex items-center gap-2 text-sm font-medium text-emerald-800">
            <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            Account fully verified
          </span>
          <Link href="/settings" className="text-xs font-semibold text-emerald-700 underline hover:text-emerald-900">
            View verification details
          </Link>
        </div>
      ) : null}

      <div className={`mt-6 grid gap-6 ${allVerified ? '' : 'lg:grid-cols-[1.1fr_0.9fr]'}`}>
        {!allVerified ? (
          <section className="rounded-3xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-900">Grow your account trust</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Complete the steps below so your petitions and signatures carry more credibility.
            </p>
            <div className="mt-5 space-y-3">
              {([
                {
                  key: 'phone' as const,
                  label: 'Confirm your phone',
                  desc: 'Adds a strong trust signal that you are a reachable, real supporter.',
                  btnLabel: 'Verify phone',
                  doneLabel: 'Phone verified',
                  filled: true,
                },
                {
                  key: 'geo' as const,
                  label: 'Confirm Liberia location',
                  desc: 'Use your current location signal to show the petition has Liberian support.',
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
                const handleClick =
                  key === 'phone'
                    ? () => setPhoneStep('enter_phone')
                    : key === 'geo'
                      ? runGeoVerification
                      : runDeviceVerification;
                return (
                  <div
                    key={key}
                    className={`rounded-2xl border p-4 transition-colors ${isDone ? 'border-emerald-200 bg-emerald-50' : 'border-zinc-200'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2">
                        {isDone && (
                          <span className="mt-0.5 flex-shrink-0 text-emerald-600">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          </span>
                        )}
                        <div>
                          <p className={`font-semibold ${isDone ? 'text-emerald-900' : 'text-zinc-900'}`}>{label}</p>
                          <p className="mt-1 text-sm text-zinc-600">{desc}</p>
                        </div>
                      </div>
                      {isDone ? (
                        <span className="flex-shrink-0 rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
                          {doneLabel}
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={isLoading || !!verifying}
                          onClick={handleClick}
                          className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${
                            filled
                              ? 'bg-zinc-900 text-white hover:bg-zinc-700'
                              : 'border border-zinc-200 bg-white text-zinc-800 shadow-sm hover:bg-zinc-50'
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

            <form onSubmit={submitId} className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-lg text-white shadow-sm">
                  🪪
                </span>
                <div>
                  <p className="font-bold text-emerald-950">Submit an ID for review</p>
                  <p className="mt-0.5 text-sm text-emerald-800/80">
                    ID review gives your account the strongest trust boost once approved by an admin.
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <select
                  value={idType}
                  onChange={(e) => setIdType(e.target.value)}
                  className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2.5 text-sm text-zinc-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="passport">Passport</option>
                  <option value="voter_id">Voter ID</option>
                  <option value="other">Other government ID</option>
                </select>

                <label className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-dashed border-emerald-300 bg-white px-4 py-3 transition hover:border-emerald-400 hover:bg-emerald-50/50">
                  <svg className="h-5 w-5 flex-shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  <span className="text-sm text-zinc-500">
                    {idFile ? (
                      <span className="font-medium text-emerald-700">{idFile.name}</span>
                    ) : (
                      <>Upload JPEG, PNG or PDF <span className="text-zinc-400">— up to 5 MB</span></>
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
                  <div className="h-px flex-1 bg-emerald-200" />
                  <span className="text-xs font-medium text-emerald-700">or paste a URL</span>
                  <div className="h-px flex-1 bg-emerald-200" />
                </div>

                <input
                  value={idUrl}
                  onChange={(e) => setIdUrl(e.target.value)}
                  placeholder="https://drive.google.com/your-id-document"
                  className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />

                <button
                  type="submit"
                  className="w-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-5 py-2.5 text-sm font-semibold text-zinc-900 shadow-sm transition-all hover:from-amber-300 hover:to-amber-400 hover:shadow-md active:scale-95"
                >
                  Submit ID for review
                </button>
              </div>
            </form>
          </section>
        ) : null}

        <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-zinc-900">My petitions</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Create, manage, and share your campaigns. Track every signature and milestone.
              </p>
            </div>
            <Link
              href="/create"
              className="flex-shrink-0 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-95"
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
                <li key={p.id} className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-4 transition hover:border-zinc-200">
                  <Link href={`/petitions/${p.id}`} className="text-sm font-semibold text-zinc-900 hover:text-emerald-700 transition-colors">
                    {p.title}
                  </Link>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      p.status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-700'
                        : p.status === 'REJECTED'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-zinc-100 text-zinc-600'
                    }`}>
                      {formatStatus(p.status)}
                    </span>
                    <span className="text-xs font-medium text-emerald-600">{(p.signaturesCount ?? 0).toLocaleString()} signatures</span>
                    <span className="text-xs text-zinc-400">{progress}% of goal</span>
                    {governmentStatuses[p.id] ? (
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        governmentStatuses[p.id].submitted
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {governmentStatuses[p.id].submitted ? 'Gov submitted' : 'Gov ready'}
                      </span>
                    ) : p.signaturesCount >= p.goal ? (
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                        Ready for gov review
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-200">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setShareOpenId(isShareOpen ? null : p.id)}
                      className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-700"
                    >
                      Share
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(p)}
                      className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setUpdatePetitionId(p.id)}
                      className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50"
                    >
                      Post update
                    </button>
                    <Link
                      href={`/petitions/${p.id}`}
                      className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-zinc-700"
                    >
                      View petition
                    </Link>
                  </div>
                  {isShareOpen && (
                    <div className="mt-3 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
                      <div className="flex flex-col gap-4 sm:flex-row">
                        <div className="flex flex-col items-center gap-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(petitionUrl)}&size=120x120&margin=4`}
                            alt="QR code"
                            className="h-[120px] w-[120px] rounded-xl border border-zinc-200"
                          />
                          <a
                            href={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(petitionUrl)}&size=300x300&margin=8`}
                            download={`petition-${p.id}-qr.png`}
                            className="text-xs font-semibold text-emerald-700 hover:underline"
                          >
                            Download QR Code
                          </a>
                        </div>
                        <div className="flex flex-wrap content-start gap-2">
                          <button
                            type="button"
                            onClick={() => void copyLink(petitionUrl)}
                            className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100"
                          >
                            {copied ? '✓ Copied!' : '📋 Copy link'}
                          </button>
                          <a
                            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(petitionUrl)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100"
                          >
                            📘 Facebook
                          </a>
                          <a
                            href={`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + petitionUrl)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100"
                          >
                            💬 WhatsApp
                          </a>
                          <a
                            href={`https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(petitionUrl)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100"
                          >
                            𝕏 Twitter
                          </a>
                          <a
                            href={`mailto:?subject=${encodeURIComponent(p.title)}&body=${encodeURIComponent(shareText + '\n\n' + petitionUrl)}`}
                            className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100"
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
            <div className="mt-4 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-6 text-center">
              <p className="text-sm font-semibold text-zinc-700">No petitions yet</p>
              <p className="mt-1 text-sm text-zinc-500">
                Launch a petition to begin gathering support and keep campaigners updated.
              </p>
              <Link
                href="/create"
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
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
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
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
                  <img src={editImageUrl} alt="preview" className="mt-2 h-32 w-full rounded-xl object-cover" />
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

      {phoneStep !== 'idle' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          {phoneStep === 'enter_phone' ? (
            <form
              onSubmit={requestPhoneOtp}
              className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-lg"
            >
              <h3 className="text-lg font-semibold text-zinc-900">Verify your phone</h3>
              <p className="mt-1 text-sm text-zinc-600">
                Enter your phone number and we&apos;ll send a 6-digit code to confirm it.
              </p>
              <input
                type="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="+231 77 000 0000"
                required
                className="mt-4 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <p className="mt-1.5 text-xs text-zinc-400">
                Liberian numbers: +231 77 000 0000 or 0770000000
              </p>
              {phoneError && (
                <p className="mt-2 text-sm text-red-600">{phoneError}</p>
              )}
              <div className="mt-4 flex gap-2">
                <button
                  type="submit"
                  disabled={!!verifying}
                  className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {verifying === 'phone' ? 'Sending…' : 'Send code'}
                </button>
                <button
                  type="button"
                  onClick={() => { setPhoneStep('idle'); setPhoneInput(''); setPhoneError(''); }}
                  className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <form
              onSubmit={verifyPhoneOtp}
              className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-lg"
            >
              <h3 className="text-lg font-semibold text-zinc-900">Enter verification code</h3>
              <p className="mt-1 text-sm text-zinc-600">
                Enter the 6-digit code sent to <span className="font-medium text-zinc-900">{phoneInput}</span>.
              </p>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                required
                className="mt-4 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-center text-xl font-bold tracking-widest text-zinc-900 placeholder:text-zinc-300 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              {phoneError && (
                <p className="mt-2 text-sm text-red-600">{phoneError}</p>
              )}
              <div className="mt-4 flex gap-2">
                <button
                  type="submit"
                  disabled={!!verifying || otpInput.length !== 6}
                  className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {verifying === 'phone' ? 'Verifying…' : 'Verify'}
                </button>
                <button
                  type="button"
                  onClick={() => setPhoneStep('enter_phone')}
                  className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-700"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => { setPhoneStep('idle'); setPhoneInput(''); setOtpInput(''); setPhoneError(''); }}
                  className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {updatePetitionId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={submitUpdate}
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-lg"
          >
            <h3 className="text-lg font-semibold text-zinc-900">Post a campaign update</h3>
            <p className="mt-1 text-sm text-zinc-600">
              Let supporters know what has changed, what happened next, or what help you still
              need.
            </p>
            <input
              value={updateTitle}
              onChange={(e) => setUpdateTitle(e.target.value)}
              placeholder="e.g. Meeting secured with Ministry of Public Works"
              className="mt-4 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <textarea
              value={updateBody}
              onChange={(e) => setUpdateBody(e.target.value)}
              placeholder="Share what happened, what changed, or what help you still need…"
              rows={4}
              className="mt-3 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <div className="mt-3 flex gap-2">
              <button
                type="submit"
                className="rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-zinc-900"
              >
                Publish
              </button>
              <button
                type="button"
                onClick={() => setUpdatePetitionId(null)}
                className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-700"
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
