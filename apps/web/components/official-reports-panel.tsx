'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiGetBlob, apiPatch, apiPost } from '../lib/api';
import { useAuthStore } from '../lib/store';

type ReportPeriod = 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
type ReportStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

interface ReportFile {
  format: string;
}

interface ConstituencyReport {
  id: string;
  period: ReportPeriod;
  periodStart: string;
  periodEnd: string;
  status: ReportStatus;
  generatedAt: string | null;
  createdAt: string;
  files: ReportFile[];
}

interface ReportsResponse {
  data: ConstituencyReport[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

interface ReportPreferences {
  weeklyEnabled: boolean;
  monthlyEnabled: boolean;
  quarterlyEnabled: boolean;
  annualEnabled: boolean;
}

const PERIOD_LABELS: Record<ReportPeriod, string> = {
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  ANNUAL: 'Annual',
};

const STATUS_STYLES: Record<ReportStatus, string> = {
  QUEUED: 'bg-zinc-100 text-zinc-600 dark:bg-neutral-800 dark:text-neutral-300',
  PROCESSING: 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  COMPLETED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
  FAILED: 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400',
};

const PREFERENCE_FIELDS: { key: keyof ReportPreferences; label: string }[] = [
  { key: 'weeklyEnabled', label: 'Weekly' },
  { key: 'monthlyEnabled', label: 'Monthly' },
  { key: 'quarterlyEnabled', label: 'Quarterly' },
  { key: 'annualEnabled', label: 'Annual' },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function OfficialReportsPanel() {
  const token = useAuthStore((s) => s.token);
  const [reports, setReports] = useState<ReportsResponse | null>(null);
  const [preferences, setPreferences] = useState<ReportPreferences | null>(null);
  const [generating, setGenerating] = useState<ReportPeriod | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadReports() {
    if (!token) return;
    try {
      const data = await apiGet<ReportsResponse>('/officials/me/reports', token);
      setReports(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports');
    }
  }

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void (async () => {
      try {
        const [reportsData, prefsData] = await Promise.all([
          apiGet<ReportsResponse>('/officials/me/reports', token),
          apiGet<ReportPreferences>('/officials/me/reports/preferences', token),
        ]);
        if (!cancelled) {
          setReports(reportsData);
          setPreferences(prefsData);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load reports');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleGenerate(period: ReportPeriod) {
    if (!token) return;
    setGenerating(period);
    setError(null);
    try {
      await apiPost('/officials/me/reports/generate', { period }, token);
      await loadReports();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to queue report');
    } finally {
      setGenerating(null);
    }
  }

  async function handleDownload(report: ConstituencyReport, format: string) {
    if (!token) return;
    const key = `${report.id}-${format}`;
    setDownloading(key);
    try {
      const blob = await apiGetBlob(
        `/officials/me/reports/${report.id}/download/${format}`,
        token,
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `constituency-report-${report.id}.${format.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setDownloading(null);
    }
  }

  async function togglePreference(key: keyof ReportPreferences) {
    if (!token || !preferences) return;
    const next = { ...preferences, [key]: !preferences[key] };
    setPreferences(next);
    setSavingPrefs(true);
    try {
      await apiPatch<ReportPreferences>('/officials/me/reports/preferences', next, token);
    } catch (err) {
      setPreferences(preferences);
      setError(err instanceof Error ? err.message : 'Failed to update preferences');
    } finally {
      setSavingPrefs(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white">Constituency Reports</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-neutral-400">
          Automated PDF/CSV summaries of petitions, signatures, and issue trends for your constituency.
        </p>
      </div>

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
        Basic constituency reports are free for every verified official, permanently.
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="rounded-3xl border border-zinc-200 p-5 dark:border-neutral-700">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Generate a report now</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {(Object.keys(PERIOD_LABELS) as ReportPeriod[]).map((period) => (
            <button
              key={period}
              type="button"
              disabled={generating !== null}
              onClick={() => void handleGenerate(period)}
              className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              {generating === period ? 'Queuing…' : `${PERIOD_LABELS[period]} report`}
            </button>
          ))}
        </div>
      </div>

      {preferences && (
        <div className="rounded-3xl border border-zinc-200 p-5 dark:border-neutral-700">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Automatic delivery</h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-neutral-400">
            Choose which cadences are emailed to you and your report-enabled staff automatically.
          </p>
          <div className="mt-3 flex flex-wrap gap-4">
            {PREFERENCE_FIELDS.map((field) => (
              <label key={field.key} className="flex items-center gap-2 text-sm text-zinc-700 dark:text-neutral-300">
                <input
                  type="checkbox"
                  checked={preferences[field.key]}
                  disabled={savingPrefs}
                  onChange={() => void togglePreference(field.key)}
                  className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 dark:border-neutral-600"
                />
                {field.label}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-zinc-200 p-5 dark:border-neutral-700">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Report history</h3>
        {!reports && <p className="mt-3 text-sm text-zinc-500 dark:text-neutral-400">Loading…</p>}
        {reports && reports.data.length === 0 && (
          <p className="mt-3 text-sm text-zinc-500 dark:text-neutral-400">
            No reports yet — generate one above or wait for the next scheduled delivery.
          </p>
        )}
        <div className="mt-3 space-y-3">
          {reports?.data.map((report) => (
            <div key={report.id} className="rounded-2xl border border-zinc-200 p-4 dark:border-neutral-700">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-white">
                    {PERIOD_LABELS[report.period]} report
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-neutral-500">
                    {formatDate(report.periodStart)} – {formatDate(report.periodEnd)}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${STATUS_STYLES[report.status]}`}>
                  {report.status}
                </span>
              </div>
              {report.status === 'COMPLETED' && report.files.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {report.files.map((file) => (
                    <button
                      key={file.format}
                      type="button"
                      disabled={downloading === `${report.id}-${file.format}`}
                      onClick={() => void handleDownload(report, file.format)}
                      className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800"
                    >
                      {downloading === `${report.id}-${file.format}` ? 'Downloading…' : `Download ${file.format}`}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
