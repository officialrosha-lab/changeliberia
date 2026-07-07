'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '../lib/api';

const STAGE_LABELS: Record<string, string> = {
  RECEIVED: 'Received',
  ASSIGNED: 'Assigned',
  UNDER_REVIEW: 'Under review',
  INVESTIGATION: 'Investigation',
  ACTION_PLANNED: 'Action planned',
  IMPLEMENTATION: 'Implementation',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

interface TimelineEntry {
  id: string;
  stage: string;
  note: string | null;
  createdAt: string;
}

interface ResponseRecord {
  id: string;
  currentStage: string;
  publicSummary: string | null;
  institution: { id: string; name: string; slug: string | null; category: string };
  timeline: TimelineEntry[];
}

export function OfficialResponseTimeline({ petitionId }: { petitionId: string }) {
  const [responses, setResponses] = useState<ResponseRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await apiGet<ResponseRecord[]>(`/officials/responses/${petitionId}`);
        if (!cancelled) setResponses(data);
      } catch {
        if (!cancelled) setResponses([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [petitionId]);

  if (loading || responses.length === 0) return null;

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-extrabold text-zinc-900">Government response</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Official response status from institutions and representatives handling this petition.
      </p>

      <div className="mt-5 space-y-6">
        {responses.map((response) => (
          <div key={response.id} className="rounded-2xl border border-zinc-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-zinc-900">
                {response.institution.slug ? (
                  <a href={`/official/${response.institution.slug}`} className="hover:underline">
                    {response.institution.name}
                  </a>
                ) : (
                  response.institution.name
                )}
              </p>
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-800">
                {STAGE_LABELS[response.currentStage] ?? response.currentStage}
              </span>
            </div>
            {response.publicSummary && (
              <p className="mt-2 text-sm text-zinc-600">{response.publicSummary}</p>
            )}
            <ol className="mt-4 space-y-3 border-l-2 border-emerald-200 pl-4">
              {response.timeline.map((entry) => (
                <li key={entry.id} className="relative">
                  <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <p className="text-sm font-semibold text-zinc-900">
                    {STAGE_LABELS[entry.stage] ?? entry.stage}
                  </p>
                  {entry.note && <p className="text-sm text-zinc-600">{entry.note}</p>}
                  <p className="text-xs text-zinc-400">{new Date(entry.createdAt).toLocaleString()}</p>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </div>
  );
}
