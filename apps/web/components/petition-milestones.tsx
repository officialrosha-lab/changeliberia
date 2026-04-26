'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, Target, Trophy, Zap } from 'lucide-react';
import { apiGet } from '../lib/api';

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
  const milestoneThresholds = [10, 50, 100, 500, 1000, 5000];

  useEffect(() => {
    const fetchMilestones = async () => {
      try {
          const response = await apiGet<{ success: boolean; count: number; milestones: Milestone[] }>(
            `/growth/petition/${petitionId}/milestones`,
          );
          setMilestones(response.milestones || []);
      } finally {
        setLoading(false);
      }
    };

    fetchMilestones();
  }, [petitionId]);

  const getNextMilestone = () => {
    for (const threshold of milestoneThresholds) {
      if (currentSignatures < threshold) {
        return threshold;
      }
    }
    return goal;
  };

  const nextMilestone = getNextMilestone();
  const progressToNextMilestone = Math.round(
    ((currentSignatures - (nextMilestone / 2)) / (nextMilestone - nextMilestone / 2)) * 100
  );

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
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="w-6 h-6 text-amber-500" />
        <h3 className="text-lg font-bold">Milestone Progress</h3>
      </div>

      {/* Current Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-gray-700">Signatures</span>
          <span className="text-2xl font-bold text-blue-600">
            {currentSignatures.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
          <Zap className="w-4 h-4" />
          {currentSignatures >= goal ? (
            <span className="text-green-600 font-semibold">🎉 Goal reached!</span>
          ) : (
            <span>{goal - currentSignatures} more needed</span>
          )}
        </div>
        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
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
              <div key={i} className="h-12 bg-gray-200 rounded" />
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
                className={`flex items-center gap-3 p-4 rounded-lg transition ${
                  achieved
                    ? 'bg-green-50 border border-green-200'
                    : isCurrent
                      ? 'bg-blue-50 border border-blue-200'
                      : 'bg-gray-50 border border-gray-200 opacity-60'
                }`}
              >
                {/* Icon & Target */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-2xl">{getMilestoneIcon(threshold)}</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">
                      {threshold.toLocaleString()} Signatures
                    </p>
                    {isCurrent && (
                      <p className="text-xs text-blue-600 font-semibold">
                        In progress · {currentSignatures.toLocaleString()} so far
                      </p>
                    )}
                    {achieved && milestone?.achievedAt && (
                      <p className="text-xs text-green-600">
                        ✓ Achieved{' '}
                        {new Date(milestone.achievedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Status Badge */}
                <div>
                  {achieved ? (
                    <div className="flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      Done
                    </div>
                  ) : isCurrent ? (
                    <div className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold animate-pulse">
                      <Target className="w-4 h-4" />
                      Active
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500 px-3 py-1">Locked</div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Next Milestone Info */}
      <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
        <p className="text-sm text-gray-700 mb-2">
          <strong>Next Milestone:</strong> {nextMilestone.toLocaleString()} signatures
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600">
            {nextMilestone - currentSignatures} signatures away
          </span>
        </div>
      </div>

      {/* Government Ready Badge */}
      {currentSignatures >= 1000 && (
        <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🏛️</span>
            <div>
              <p className="font-semibold text-green-900">Government Ready</p>
              <p className="text-sm text-green-700">
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
