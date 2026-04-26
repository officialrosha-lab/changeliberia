'use client';

import { useEffect, useState } from 'react';

type Badge = {
  badgeType: string;
  earnedAt: string;
  multiplier: number;
  petitionId: string;
};

type Props = {
  userId: string;
  petitionId?: string;
  displayMode?: 'compact' | 'detailed';
};

const BADGE_ICONS = {
  SHARE_WIZARD: '🧙',
  VIRAL_HERO: '🦸',
  NETWORK_BUILDER: '🌐',
  INFLUENCER: '⭐',
  STREAK_MASTER: '🔥',
};

const BADGE_COLORS = {
  SHARE_WIZARD: 'bg-purple-100 text-purple-700',
  VIRAL_HERO: 'bg-red-100 text-red-700',
  NETWORK_BUILDER: 'bg-blue-100 text-blue-700',
  INFLUENCER: 'bg-yellow-100 text-yellow-700',
  STREAK_MASTER: 'bg-orange-100 text-orange-700',
};

export function BadgeDisplay({ 
  userId, 
  petitionId,
  displayMode = 'compact'
}: Props) {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalMultiplier, setTotalMultiplier] = useState(1);

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const url = petitionId 
          ? `/api/badges/user/${userId}?petitionId=${petitionId}`
          : `/api/badges/user/${userId}`;

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to load badges');

        const { data } = await response.json();
        setBadges(data.badges || []);
        setTotalMultiplier(data.totalMultiplier || 1);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();
  }, [userId, petitionId]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-12 bg-zinc-200 rounded-lg w-full" />
      </div>
    );
  }

  if (error) {
    return null; // Silent fail for badges
  }

  if (badges.length === 0) {
    return (
      <div className="text-center py-4 text-sm text-zinc-500">
        No badges earned yet. Share to unlock!
      </div>
    );
  }

  return (
    <div>
      {displayMode === 'compact' ? (
        // Compact view: badge icons in a row
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {badges.map((badge, idx) => (
              <div 
                key={idx}
                title={`${badge.badgeType} (${badge.multiplier}x multiplier)`}
                className="text-2xl cursor-help"
              >
                {BADGE_ICONS[badge.badgeType as keyof typeof BADGE_ICONS] || '🏆'}
              </div>
            ))}
          </div>
          {totalMultiplier > 1 && (
            <div className="text-xs font-semibold text-green-700 bg-green-50 rounded px-2 py-1 inline-block">
              {totalMultiplier.toFixed(1)}x Trust Bonus Applied
            </div>
          )}
        </div>
      ) : (
        // Detailed view: cards with descriptions
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-sm">Earned Badges ({badges.length})</h4>
            {totalMultiplier > 1 && (
              <span className="text-xs font-bold text-green-600 bg-green-100 rounded-full px-2.5 py-0.5">
                {totalMultiplier.toFixed(1)}x Bonus
              </span>
            )}
          </div>

          {badges.map((badge, idx) => (
            <div 
              key={idx}
              className={`rounded-lg p-3 ${BADGE_COLORS[badge.badgeType as keyof typeof BADGE_COLORS] || 'bg-gray-100 text-gray-700'}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl">
                  {BADGE_ICONS[badge.badgeType as keyof typeof BADGE_ICONS] || '🏆'}
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-sm">
                    {badge.badgeType.replace(/_/g, ' ')}
                  </p>
                  <p className="text-xs opacity-75 mt-0.5">
                    Earned {new Date(badge.earnedAt).toLocaleDateString()}
                  </p>
                  <p className="text-xs font-semibold mt-1">
                    {badge.multiplier}x Multiplier
                  </p>
                </div>
              </div>
            </div>
          ))}

          {badges.length > 0 && (
            <div className="rounded-lg bg-blue-50 p-3 mt-4">
              <p className="text-xs text-blue-900">
                <span className="font-semibold">Multiplier Stack:</span> All your badges combine to boost your Trust Points by {totalMultiplier > 5 ? '5x max' : `${totalMultiplier.toFixed(1)}x`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
