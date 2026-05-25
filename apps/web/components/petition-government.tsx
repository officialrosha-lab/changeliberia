'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { apiGet, apiPost, getApiBase } from '../lib/api';
import { useAuthStore } from '../lib/store';

interface GovernmentContact {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  category: string;
  region?: string | null;
  priority: number;
  isActive: boolean;
}

interface GovernmentReadiness {
  petitionId: string;
  isGovernmentReady: boolean;
  signaturesCount: number;
  signaturesNeeded: number;
  achievedAt?: string;
  creatorContact?: {
    id: string;
    fullName: string;
    phone?: string | null;
    email?: string | null;
  };
  nextMilestone: number;
  nextMilestoneProgress: number;
}

interface GovernmentStatus {
  petitionId: string;
  submitted: boolean;
  status: string;
  submittedAt?: string;
  updatedAt?: string;
  submissions?: Array<{
    id: string;
    governmentEmail: string;
    status: string;
    submittedAt: string;
    updatedAt: string;
    notes?: string | null;
    responseNotes?: string | null;
    signatureCount?: number | null;
  }>;
}

const COPY = {
  government: {
    panelTitle: 'Government Submission',
    panelDesc: 'Track readiness, download a report, and submit this petition when it reaches 1,000 verified signatures.',
    statusLabel: 'Government readiness',
    readyMsg: 'This petition can be submitted to government now.',
    notReadyMsg: 'This petition is not yet government-ready.',
    submitBtn: 'Submit petition to government',
    recipientLabel: 'Government contact',
    emailPlaceholder: 'ministry@example.gov.lr',
    noContactsMsg: 'No government contacts are available. Enter an email address manually below.',
  },
  ngo: {
    panelTitle: 'NGO Partnership',
    panelDesc: 'Track readiness, download a report, and connect with an NGO partner when this petition reaches 1,000 signatures.',
    statusLabel: 'NGO readiness',
    readyMsg: 'This petition is ready for NGO review.',
    notReadyMsg: 'This petition is not yet ready for NGO review.',
    submitBtn: 'Submit to NGO partner',
    recipientLabel: 'NGO contact',
    emailPlaceholder: 'partner@ngo.org',
    noContactsMsg: 'No NGO contacts are listed. Enter a partner email address manually below.',
  },
};

export function PetitionGovernmentPanel({
  petitionId,
  petitionTitle,
  signaturesCount,
  petitionType,
}: {
  petitionId: string;
  petitionTitle: string;
  signaturesCount: number;
  petitionType?: string | null;
}) {
  const type = petitionType ?? 'government';
  const isSubmissionType = type === 'government' || type === 'ngo';
  const copy = type === 'ngo' ? COPY.ngo : COPY.government;
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const [readiness, setReadiness] = useState<GovernmentReadiness | null>(null);
  const [contacts, setContacts] = useState<GovernmentContact[]>([]);
  const [status, setStatus] = useState<GovernmentStatus | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [customEmail, setCustomEmail] = useState('');
  const [notes, setNotes] = useState('Auto-submit generated when petition reached government readiness.');
  const [loading, setLoading] = useState(true);
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isCreator, setIsCreator] = useState<boolean | null>(isSubmissionType ? null : true);

  const reportUrl = useMemo(
    () => `${getApiBase()}/government/report/${petitionId}`,
    [petitionId],
  );

  const handleDownloadReport = async () => {
    setDownloadingReport(true);
    setDownloadError(null);

    try {
      const response = await fetch(reportUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) {
        let message = 'Unable to download report.';
        try {
          const body = await response.json();
          if (body?.message) message = body.message;
        } catch {
          // ignore parse errors
        }
        throw new Error(message);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `petition-${petitionId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Failed to download report');
    } finally {
      setDownloadingReport(false);
    }
  };

  useEffect(() => {
    if (!isSubmissionType || !hydrated) return;

    let cancelled = false;

    const loadOwnerStatus = async () => {
      try {
        const result = await apiGet<{ isCreator: boolean }>(
          `/petitions/${petitionId}/is-creator`,
          token ?? undefined,
        );
        if (!cancelled) setIsCreator(result.isCreator);
      } catch (err) {
        if (!cancelled) {
          setIsCreator(false);
          setError(err instanceof Error ? err.message : 'Unable to verify petition ownership');
        }
      }
    };

    void loadOwnerStatus();

    return () => {
      cancelled = true;
    };
  }, [petitionId, token, isSubmissionType, hydrated]);

  useEffect(() => {
    if (isSubmissionType && isCreator !== true) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [readinessResponse, contactsResponse, statusResponse] = await Promise.all([
          apiGet<{ success: boolean; readiness: GovernmentReadiness }>(
            `/growth/petition/${petitionId}/government-readiness`,
          ),
          apiGet<{ success: boolean; count: number; contacts: GovernmentContact[] }>(
            '/government/contacts',
          ),
          apiGet<GovernmentStatus>(`/government/status/${petitionId}`, token ?? undefined),
        ]);

        if (cancelled) return;
        setReadiness(readinessResponse.readiness);
        setContacts(contactsResponse.contacts || []);
        setStatus(statusResponse);
        setSelectedContactId(contactsResponse.contacts?.[0]?.id || '');
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load government readiness');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [petitionId, token, isSubmissionType, isCreator]);

  const chosenEmail = useMemo(() => {
    const contact = contacts.find((item) => item.id === selectedContactId);
    return contact?.email || customEmail;
  }, [contacts, selectedContactId, customEmail]);

  const canSubmit = !!token && readiness?.isGovernmentReady && !!chosenEmail;

  async function handleSubmit() {
    if (!canSubmit) {
      setError('You must be logged in and select a target contact email before submitting.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const response = await apiPost<{ success: boolean; message: string }>(
        '/government/submit',
        {
          petitionId,
          governmentEmail: chosenEmail,
          notes,
        },
        token,
      );

      setMessage(response.message || 'Government submission queued successfully.');
      setStatus({
        petitionId,
        submitted: true,
        status: 'SUBMITTED',
        submittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        submissions: [
          {
            id: 'local',
            governmentEmail: chosenEmail,
            status: 'SUBMITTED',
            submittedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            notes,
            signatureCount: signaturesCount,
          },
        ],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (isSubmissionType && isCreator === false) {
    return null;
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-zinc-500">Loading campaign readiness...</p>
      </div>
    );
  }

  if (!readiness) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm">
        <p className="text-sm text-red-700">Unable to load campaign readiness details.</p>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  /* ── Social / Community — simplified "Collect & share" panel ── */
  if (!isSubmissionType) {
    return (
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">Signature progress</p>
            <h2 className="mt-1 text-xl font-extrabold text-zinc-900">Collect &amp; share</h2>
            <p className="mt-1 text-sm text-zinc-500">
              This petition collects signatures directly. Download a report or share the link when
              you&apos;re ready to act.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDownloadReport}
            disabled={downloadingReport}
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
          >
            {downloadingReport ? 'Downloading...' : 'Download report'}
          </button>
          {downloadError && (
            <p className="mt-2 text-xs text-red-600">{downloadError}</p>
          )}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl bg-emerald-50 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-emerald-700">Signatures</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-900">{readiness.signaturesCount.toLocaleString()}</p>
            <p className="mt-1 text-sm text-emerald-700">
              {readiness.isGovernmentReady ? 'Goal reached!' : `${readiness.signaturesNeeded.toLocaleString()} more to goal`}
            </p>
          </div>
          <div className="rounded-3xl bg-blue-50 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-blue-700">Next milestone</p>
            <p className="mt-2 text-3xl font-semibold text-blue-900">{readiness.nextMilestone.toLocaleString()}</p>
            <p className="mt-1 text-sm text-blue-700">{readiness.nextMilestoneProgress}% there</p>
          </div>
          <div className="rounded-3xl bg-zinc-50 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Petition</p>
            <p className="mt-2 text-lg font-semibold text-zinc-900 break-words">{petitionTitle}</p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-zinc-50 p-4">
          <p className="text-sm font-semibold text-zinc-700">Campaign status</p>
          <p className="mt-1 text-sm text-zinc-500">
            You&apos;re in control — share your petition link and present the report directly to your
            target audience when you&apos;re ready.
          </p>
        </div>
      </div>
    );
  }

  /* ── Government / NGO — full submission panel ── */
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-zinc-900">{copy.panelTitle}</h2>
          <p className="mt-2 text-sm text-zinc-600">{copy.panelDesc}</p>
        </div>
        <button
          type="button"
          onClick={handleDownloadReport}
          disabled={downloadingReport}
          className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
        >
          {downloadingReport ? 'Downloading...' : 'Download report'}
        </button>
        {downloadError && (
          <p className="mt-2 text-xs text-red-600">{downloadError}</p>
        )}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl bg-emerald-50 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-emerald-700">Signatures</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-900">{readiness.signaturesCount.toLocaleString()}</p>
          <p className="mt-1 text-sm text-emerald-700">
            {readiness.isGovernmentReady ? 'Ready for submission' : `${readiness.signaturesNeeded.toLocaleString()} more to go`}
          </p>
        </div>
        <div className="rounded-3xl bg-blue-50 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-blue-700">Next readiness</p>
          <p className="mt-2 text-3xl font-semibold text-blue-900">{readiness.nextMilestone.toLocaleString()}</p>
          <p className="mt-1 text-sm text-blue-700">{readiness.nextMilestoneProgress}% to next level</p>
        </div>
        <div className="rounded-3xl bg-zinc-50 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Petition</p>
          <p className="mt-2 text-lg font-semibold text-zinc-900 break-words">{petitionTitle}</p>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-zinc-900">{copy.statusLabel}</p>
            <p className="text-sm text-zinc-600">
              {readiness.isGovernmentReady ? copy.readyMsg : copy.notReadyMsg}
            </p>
          </div>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${
              readiness.isGovernmentReady ? 'bg-emerald-100 text-emerald-800' : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {readiness.isGovernmentReady ? 'Ready' : 'Pending'}
          </span>
        </div>

        {!readiness.isGovernmentReady && (
          <div className="mt-4 rounded-2xl bg-white p-4 text-sm text-zinc-600">
            <p>
              This petition needs <strong>{readiness.signaturesNeeded.toLocaleString()}</strong> more verified signatures before it can be submitted.
            </p>
          </div>
        )}
      </div>

      {readiness.isGovernmentReady && (
        <div className="mt-6 space-y-4">
          {status?.submissions?.length ? (
            <>
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm font-semibold text-emerald-900">Submission status</p>
                <p className="mt-2 text-sm text-emerald-700">{`Current status: ${status.status}`}</p>
                <p className="mt-2 text-sm text-zinc-700">Submitted at {status.submittedAt ? new Date(status.submittedAt).toLocaleString() : 'N/A'}</p>
              </div>

              <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4">
                <h3 className="text-lg font-semibold text-zinc-900">Submission history</h3>
                <div className="mt-4 space-y-3">
                  {status.submissions.map((submission) => (
                    <div key={submission.id} className="rounded-2xl bg-white p-4 shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-3 min-w-0">
                        <div className="min-w-0">
                          <p className="font-semibold text-zinc-900 break-words">{submission.governmentEmail}</p>
                          <p className="mt-1 text-sm text-zinc-500">{submission.status}</p>
                        </div>
                        <div className="text-sm text-zinc-500 text-right">
                          <p>Submitted {new Date(submission.submittedAt).toLocaleString()}</p>
                          <p>Updated {new Date(submission.updatedAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2 text-sm text-zinc-600">
                        <p className="break-words">Signatures: {submission.signatureCount ?? 'N/A'}</p>
                        <p className="break-words">Notes: {submission.notes || '—'}</p>
                        <p className="sm:col-span-2 break-words">Response notes: {submission.responseNotes || '—'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold text-zinc-900">{copy.recipientLabel}</p>
                {!token ? (
                  <Link href="/auth/login" className="inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                    Sign in to submit
                  </Link>
                ) : null}
              </div>

              {contacts.length > 0 ? (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-zinc-700">Pick a contact</label>
                  <select
                    value={selectedContactId}
                    onChange={(e) => {
                      setSelectedContactId(e.target.value);
                      setCustomEmail('');
                    }}
                    className="w-full rounded-2xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  >
                    <option value="">Choose a contact</option>
                    {contacts.map((contact) => (
                      <option key={contact.id} value={contact.id}>
                        {contact.name} — {contact.email}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                  {copy.noContactsMsg}
                </div>
              )}

              <div className="space-y-3">
                <label className="block text-sm font-medium text-zinc-700">Email address</label>
                <input
                  type="email"
                  value={customEmail}
                  onChange={(e) => {
                    setCustomEmail(e.target.value);
                    setSelectedContactId('');
                  }}
                  placeholder={copy.emailPlaceholder}
                  className="w-full rounded-2xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-zinc-700">Notes</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                />
              </div>

              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
              ) : null}
              {message ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>
              ) : null}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Submitting…' : copy.submitBtn}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
