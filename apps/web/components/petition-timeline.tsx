'use client';

type StatusLog = {
  id: string;
  status: string;
  note?: string | null;
  createdAt: string;
};

const STATUS_META: Record<string, { label: string; icon: string; color: string }> = {
  submitted: {
    label: 'Submitted',
    icon: '✍️',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  },
  under_review: {
    label: 'Under Review',
    icon: '🔎',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  },
  approved: {
    label: 'Approved',
    icon: '✅',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  },
  gathering_signatures: {
    label: 'Gathering Signatures',
    icon: '🤝',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  },
  sent_to_authority: {
    label: 'Sent to Authority',
    icon: '📬',
    color: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  },
  awaiting_response: {
    label: 'Awaiting Response',
    icon: '⏳',
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  },
  responded: {
    label: 'Responded',
    icon: '📣',
    color: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300',
  },
};

export function PetitionTimeline({ logs }: { logs: StatusLog[] }) {
  if (!logs.length) return null;

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <h2 className="text-lg font-bold text-zinc-900 dark:text-neutral-50">Petition Timeline</h2>
      <p className="mt-1 text-sm text-zinc-500 dark:text-neutral-400">
        Every stage of this petition, tracked publicly.
      </p>

      <ol className="mt-6 space-y-0">
        {logs.map((log, i) => {
          const meta = STATUS_META[log.status] ?? {
            label: log.status.replace(/_/g, ' '),
            icon: '•',
            color: 'bg-zinc-100 text-zinc-700 dark:bg-neutral-800 dark:text-neutral-300',
          };
          const isLast = i === logs.length - 1;

          return (
            <li key={log.id} className="flex gap-4">
              {/* Left timeline track */}
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base font-bold ${meta.color}`}
                >
                  {meta.icon}
                </div>
                {!isLast && (
                  <div className="my-1 w-0.5 flex-1 bg-zinc-200 dark:bg-neutral-700" />
                )}
              </div>

              {/* Right content */}
              <div className={`${isLast ? '' : 'pb-5'} min-w-0 flex-1 pt-1`}>
                <p className="text-sm font-semibold text-zinc-900 dark:text-neutral-50">
                  {meta.label}
                </p>
                {log.note && (
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-neutral-400">{log.note}</p>
                )}
                <p className="mt-0.5 text-xs text-zinc-400 dark:text-neutral-500">
                  {new Date(log.createdAt).toLocaleDateString('en-LR', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
