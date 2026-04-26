'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface LiveSigner {
  id: string;
  name: string;
  timestamp: string;
}

interface LivePetitionStatsProps {
  petitionId: string;
  initialCount: number;
  initialTodayCount: number;
  goal: number;
}

const MILESTONE_THRESHOLDS = [10, 50, 100, 500, 1000, 5000];

function getNextMilestone(count: number, goal: number): number {
  for (const t of MILESTONE_THRESHOLDS) {
    if (count < t) return t;
  }
  return goal;
}

function getMilestoneProgress(count: number, nextMilestone: number): number {
  const prevMilestone = MILESTONE_THRESHOLDS[MILESTONE_THRESHOLDS.indexOf(nextMilestone) - 1] ?? 0;
  if (nextMilestone <= prevMilestone) return 100;
  return Math.min(100, Math.round(((count - prevMilestone) / (nextMilestone - prevMilestone)) * 100));
}

export function LivePetitionStats({
  petitionId,
  initialCount,
  initialTodayCount,
  goal,
}: LivePetitionStatsProps) {
  const [count, setCount] = useState(initialCount);
  const [todayCount, setTodayCount] = useState(initialTodayCount);
  const [liveSigners, setLiveSigners] = useState<LiveSigner[]>([]);
  const [pulse, setPulse] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const idCounter = useRef(0);

  const triggerPulse = useCallback(() => {
    setPulse(true);
    setTimeout(() => setPulse(false), 600);
  }, []);

  useEffect(() => {
    const socket = io('http://localhost:3001/petitions', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('subscribe_petition', { petitionId });
    });

    socket.on('signature_update', (data: { petitionId: string; signaturesCount: number; todaySignatures: number }) => {
      if (data.petitionId !== petitionId) return;
      setCount(data.signaturesCount);
      setTodayCount(data.todaySignatures);
      triggerPulse();
    });

    socket.on('new_signature', (data: { petitionId: string; signerName?: string; anonymous?: boolean; timestamp: string }) => {
      if (data.petitionId !== petitionId) return;
      const displayName = data.anonymous || !data.signerName ? 'Someone' : data.signerName;
      const entry: LiveSigner = {
        id: String(++idCounter.current),
        name: displayName,
        timestamp: data.timestamp,
      };
      setLiveSigners((prev) => [entry, ...prev].slice(0, 5));
    });

    return () => {
      socket.disconnect();
    };
  }, [petitionId, triggerPulse]);

  const progress = Math.min(100, Math.round((count / Math.max(1, goal)) * 100));
  const nextMilestone = getNextMilestone(count, goal);
  const milestoneProgress = getMilestoneProgress(count, nextMilestone);
  const toNextMilestone = nextMilestone - count;

  return (
    <div className="space-y-5">
      {/* Count + progress */}
      <div>
        <div className="flex items-center justify-between text-sm font-medium">
          <span className="text-zinc-900 dark:text-neutral-100">
            <span
              className={`text-xl font-extrabold transition-colors duration-300 ${
                pulse ? 'text-emerald-500 dark:text-emerald-300' : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {count.toLocaleString()}
            </span>{' '}
            signed
          </span>
          <span className="text-zinc-500 dark:text-neutral-400">
            Goal: {goal.toLocaleString()}
          </span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-zinc-100 dark:bg-neutral-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs text-zinc-500 dark:text-neutral-400">
          {progress}% to goal
        </p>
      </div>

      {/* Today stat */}
      <div className="flex items-center gap-2 rounded-2xl bg-zinc-50 px-4 py-3 dark:bg-neutral-800">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <p className="text-sm font-semibold text-zinc-700 dark:text-neutral-300">
          <span className="text-emerald-600 dark:text-emerald-400">{todayCount.toLocaleString()}</span> signed today
        </p>
      </div>

      {/* Next Milestone */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/40 dark:bg-amber-950/20">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
            Next milestone
          </p>
          <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
            {nextMilestone.toLocaleString()}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-amber-200/60 dark:bg-amber-900/40">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all duration-700"
            style={{ width: `${milestoneProgress}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-500">
          {toNextMilestone > 0 ? `${toNextMilestone.toLocaleString()} more needed` : '🎉 Milestone reached!'}
        </p>
      </div>

      {/* Live signer feed */}
      {liveSigners.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-neutral-500">
            Just signed
          </p>
          <ul className="space-y-1.5">
            {liveSigners.map((s) => (
              <li
                key={s.id}
                className="flex items-center gap-2.5 transition-all duration-300"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  {s.name === 'Someone' ? '?' : s.name.charAt(0).toUpperCase()}
                </span>
                <p className="text-sm text-zinc-700 dark:text-neutral-300">
                  <span className="font-semibold">{s.name}</span>{' '}
                  <span className="text-zinc-400 dark:text-neutral-500">just signed</span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
