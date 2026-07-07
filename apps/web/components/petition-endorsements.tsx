'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../lib/api';
import { useAuthStore } from '../lib/store';

const ENDORSER_TYPES = [
  { value: 'TRADITIONAL_LEADER', label: 'Traditional Leader' },
  { value: 'RELIGIOUS_LEADER', label: 'Religious Leader' },
  { value: 'CIVIC_LEADER', label: 'Civic Leader' },
  { value: 'BUSINESS_LEADER', label: 'Business Leader' },
  { value: 'OTHER', label: 'Other' },
] as const;

interface Endorsement {
  id: string;
  endorserName: string;
  endorserTitle: string | null;
  endorserType: string;
  organization: string | null;
  statement: string | null;
  createdAt: string;
}

export function PetitionEndorsements({ petitionId }: { petitionId: string }) {
  const token = useAuthStore((s) => s.token);
  const [endorsements, setEndorsements] = useState<Endorsement[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [endorserName, setEndorserName] = useState('');
  const [endorserTitle, setEndorserTitle] = useState('');
  const [endorserType, setEndorserType] = useState<(typeof ENDORSER_TYPES)[number]['value']>('TRADITIONAL_LEADER');
  const [organization, setOrganization] = useState('');
  const [statement, setStatement] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const load = () => {
    apiGet<Endorsement[]>(`/petitions/${petitionId}/endorsements`)
      .then(setEndorsements)
      .catch(() => {/* best-effort */});
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petitionId]);

  async function submit() {
    if (!token || !endorserName.trim()) return;
    setSubmitting(true);
    setStatus(null);
    try {
      await apiPost(
        `/petitions/${petitionId}/endorsements`,
        {
          endorserName: endorserName.trim(),
          endorserTitle: endorserTitle.trim() || undefined,
          endorserType,
          organization: organization.trim() || undefined,
          statement: statement.trim() || undefined,
        },
        token,
      );
      setStatus('Thank you — your endorsement has been submitted for review.');
      setEndorserName('');
      setEndorserTitle('');
      setOrganization('');
      setStatement('');
      setShowForm(false);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Failed to submit endorsement');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-zinc-900 dark:text-neutral-50">Community Endorsements</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-neutral-400">
            Traditional, religious, civic, and business leaders publicly backing this petition.
          </p>
        </div>
        {token && (
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:border-emerald-400 hover:text-emerald-700 dark:border-neutral-600 dark:text-neutral-300"
          >
            {showForm ? 'Cancel' : 'Add endorsement'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="mt-5 space-y-3 rounded-2xl bg-zinc-50 p-4 dark:bg-neutral-900">
          <input
            value={endorserName}
            onChange={(e) => setEndorserName(e.target.value)}
            placeholder="Endorser's full name"
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={endorserTitle}
              onChange={(e) => setEndorserTitle(e.target.value)}
              placeholder="Title, e.g. Paramount Chief of Bomi"
              className="rounded-xl border border-zinc-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800"
            />
            <select
              value={endorserType}
              onChange={(e) => setEndorserType(e.target.value as typeof endorserType)}
              className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800"
            >
              {ENDORSER_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <input
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            placeholder="Organization (optional)"
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800"
          />
          <textarea
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            placeholder="Endorsement statement (optional)"
            rows={3}
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800"
          />
          <p className="text-xs text-zinc-500 dark:text-neutral-400">
            Submissions are reviewed by an administrator before appearing publicly.
          </p>
          <button
            type="button"
            disabled={submitting || !endorserName.trim()}
            onClick={() => void submit()}
            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit for review'}
          </button>
        </div>
      )}

      {status && <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-400">{status}</p>}

      <div className="mt-5 space-y-3">
        {endorsements.length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-neutral-400">No endorsements yet.</p>
        )}
        {endorsements.map((e) => (
          <div key={e.id} className="rounded-2xl bg-zinc-50 p-4 dark:bg-neutral-900">
            <p className="font-semibold text-zinc-900 dark:text-neutral-50">{e.endorserName}</p>
            <p className="text-xs text-zinc-500 dark:text-neutral-400">
              {[e.endorserTitle, e.organization].filter(Boolean).join(', ') || ENDORSER_TYPES.find((t) => t.value === e.endorserType)?.label}
            </p>
            {e.statement && <p className="mt-2 text-sm text-zinc-700 dark:text-neutral-300">&ldquo;{e.statement}&rdquo;</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
