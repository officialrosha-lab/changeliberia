'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, Target, Trophy, Zap } from 'lucide-react';
import { apiGet } from '../lib/api';
import { useAuthStore } from '../lib/store';

interface Milestone {
  id: string;
  targetValue: number;
  achieved: boolean;
  achievedAt?: string;
}

interface PetitionMilestonesProps {
  petitionId: string;
  currentSignatures: number;
  goal: number;
}

export const PetitionMilestones: React.FC<PetitionMilestonesProps> = ({
  petitionId,
  currentSignatures,
  goal,
}) => {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreatorOrAdmin, setIsCreatorOrAdmin] = useState(false);
  const token = useAuthStore((s) => s.token);
  const milestoneThresholds = [10, 50, 100, 500, 1000, 5000];

  useEffect(() => {
    const fetchMilestones = async () => {
      try {
        const response = await apiGet<{ success: boolean; count: number; milestones: Milestone[] }>(
          `/growth/petition/${petitionId}/milestones`,
        );
        setMilestones(response.milestones || []);
      } catch {
        // Non-fatal: the badge grid below is driven by the hardcoded
        // thresholds plus the currentSignatures/goal props, not this
        // fetch — a failure here only loses the per-badge "Achieved on"
        // date, not the milestone progress itself.
        setMilestones([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMilestones();
  }, [petitionId]);

  useEffect(() => {
    if (!token) {
      setIsCreatorOrAdmin(false);
      return;
    }
    apiGet<{ isCreator: boolean }>(`/petitions/${petitionId}/is-creator`, token)
      .then((res) => setIsCreatorOrAdmin(res.isCreator))
      .catch(() => setIsCreatorOrAdmin(false));
  }, [petitionId, token]);

  const getNextMilestone = () => {
    for (const threshold of milestoneThresholds) {
      if (currentSignatures < threshold) {
        return threshold;
      }
    }
    return goal;
  };

  const nextMilestone = getNextMilestone();

  const getMilestoneIcon = (target: number) => {
    if (target === 10) return '🚀';
    if (target === 50) return '⭐';
    if (target === 100) return '🔥';
    if (target === 500) return '💎';
    if (target === 1000) return '🏆';
    if (target === 5000) return '👑';
    return '✨';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 dark:bg-neutral-900">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="w-6 h-6 text-amber-500" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Milestone Progress</h3>
      </div>

      {/* Current Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-gray-700 dark:text-neutral-200">Signatures</span>
          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {currentSignatures.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3 dark:text-neutral-300">
          <Zap className="w-4 h-4" />
          {currentSignatures >= goal ? (
            <span className="text-green-600 font-semibold dark:text-green-400">🎉 Goal reached!</span>
          ) : (
            <span>{goal - currentSignatures} more needed</span>
          )}
        </div>
        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden dark:bg-neutral-700">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
            style={{ width: `${Math.min((currentSignatures / goal) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Milestone Badges */}
      <div className="space-y-3">
        {loading ? (
          <div className="animate-pulse space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded dark:bg-neutral-700" />
            ))}
          </div>
        ) : (
          milestoneThresholds.map((threshold) => {
            const achieved = currentSignatures >= threshold;
            const isCurrent = currentSignatures < threshold && currentSignatures >= threshold / 2;
            const milestone = milestones.find((m) => m.targetValue === threshold);

            return (
              <div
                key={threshold}
                className={`flex items-center gap-2 p-4 rounded-lg transition ${
                  achieved
                    ? 'bg-green-50 border border-green-200 dark:bg-green-950/30 dark:border-green-800'
                    : isCurrent
                      ? 'bg-blue-50 border border-blue-200 dark:bg-blue-950/30 dark:border-blue-800'
                      : 'bg-gray-50 border border-gray-200 opacity-60 dark:bg-neutral-800 dark:border-neutral-700'
                }`}
              >
                {/* Icon & Target */}
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <span className="shrink-0 text-xl">{getMilestoneIcon(threshold)}</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {threshold.toLocaleString()} Signatures
                    </p>
                    {isCurrent && (
                      <p className="text-xs text-blue-600 font-semibold dark:text-blue-400">
                        In progress · {currentSignatures.toLocaleString()} so far
                      </p>
                    )}
                    {achieved && milestone?.achievedAt && (
                      <p className="text-xs text-green-600 dark:text-green-400">
                        ✓ Achieved{' '}
                        {new Date(milestone.achievedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Status Badge */}
                <div className="shrink-0">
                  {achieved ? (
                    <div className="flex items-center gap-1 bg-green-600 text-white px-2.5 py-1 rounded-full text-sm font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      Done
                    </div>
                  ) : isCurrent ? (
                    <div className="flex items-center gap-1 bg-blue-600 text-white px-2.5 py-1 rounded-full text-sm font-semibold animate-pulse">
                      <Target className="w-4 h-4" />
                      Active
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500 px-2.5 py-1 dark:text-neutral-400">Locked</div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Next Milestone Info */}
      <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200 dark:from-amber-950/30 dark:to-orange-950/30 dark:border-amber-900">
        <p className="text-sm text-gray-700 mb-2 dark:text-neutral-200">
          <strong>Next Milestone:</strong> {nextMilestone.toLocaleString()} signatures
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600 dark:text-neutral-300">
            {nextMilestone - currentSignatures} signatures away
          </span>
        </div>
      </div>

      {/* Government Ready Badge — visible only to petition creator or admin */}
      {currentSignatures >= 1000 && isCreatorOrAdmin && (
        <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 dark:from-green-950/30 dark:to-emerald-950/30 dark:border-green-800">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🏛️</span>
            <div>
              <p className="font-semibold text-green-900 dark:text-green-200">Government Ready</p>
              <p className="text-sm text-green-700 dark:text-green-400">
                This petition can be submitted to government. Click the button below to proceed.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PetitionMilestones;
