'use client';

import { useState } from 'react';
import { apiPatch, apiPost } from '../lib/api';
import { useAuthStore } from '../lib/store';

type FraudRule = {
  id: string;
  key: string;
  description: string;
  threshold: number;
  penalty: number;
  enabled: boolean;
};

type FraudSnapshot = {
  id: string;
  riskIndex: number;
  suspiciousSignatures: number;
  totalSignatures: number;
  createdAt: string;
};

type Props = {
  initialRules: FraudRule[];
  latestSnapshots: FraudSnapshot[];
};

export function AdminFraudPanel({ initialRules, latestSnapshots }: Props) {
  const token = useAuthStore((s) => s.token);
  const [rules, setRules] = useState(initialRules);
  const [running, setRunning] = useState(false);
  const [jobMessage, setJobMessage] = useState('');

  async function updateRule(key: string, field: 'threshold' | 'penalty', value: number) {
    if (!token) return;
    const updated = await apiPatch<FraudRule>(
      `/fraud/rules/${key}`,
      { [field]: value },
      token,
    );
    setRules((prev) => prev.map((rule) => (rule.key === key ? updated : rule)));
  }

  async function toggleRule(key: string, enabled: boolean) {
    if (!token) return;
    const updated = await apiPatch<FraudRule>(`/fraud/rules/${key}`, { enabled }, token);
    setRules((prev) => prev.map((rule) => (rule.key === key ? updated : rule)));
  }

  async function runAnomalyJob() {
    if (!token) return;
    setRunning(true);
    try {
      const result = await apiPost<{ suspiciousIpCount: number }>(
        '/fraud/jobs/anomaly-scan',
        {},
        token,
      );
      setJobMessage(`Anomaly job completed. Suspicious IP clusters: ${result.suspiciousIpCount}`);
    } finally {
      setRunning(false);
    }
  }

  return (
    <section className="rounded-2xl bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Fraud analytics and tuning</h2>
        <button
          onClick={runAnomalyJob}
          disabled={running || !token}
          className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {running ? 'Running...' : 'Run anomaly job'}
        </button>
      </div>
      {jobMessage ? <p className="mt-2 text-sm text-emerald-700">{jobMessage}</p> : null}

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {latestSnapshots.slice(0, 4).map((snap) => (
          <div key={snap.id} className="rounded-xl bg-zinc-50 p-3 text-sm">
            <p className="font-semibold">Risk index: {(snap.riskIndex * 100).toFixed(1)}%</p>
            <p className="text-zinc-600">
              {snap.suspiciousSignatures}/{snap.totalSignatures} suspicious signatures
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {rules.map((rule) => (
          <div key={rule.id} className="rounded-xl border border-zinc-200 p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-semibold">{rule.key}</p>
                <p className="text-sm text-zinc-600">{rule.description}</p>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={rule.enabled}
                  onChange={(e) => toggleRule(rule.key, e.target.checked)}
                />
                Enabled
              </label>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              <label className="text-sm">
                Threshold
                <input
                  type="number"
                  defaultValue={rule.threshold}
                  onBlur={(e) => updateRule(rule.key, 'threshold', Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-2 py-1"
                />
              </label>
              <label className="text-sm">
                Penalty
                <input
                  type="number"
                  defaultValue={rule.penalty}
                  onBlur={(e) => updateRule(rule.key, 'penalty', Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-2 py-1"
                />
              </label>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
