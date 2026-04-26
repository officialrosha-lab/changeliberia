'use client';

import { useEffect, useState } from 'react';

type ChallengeData = {
  challengeId: string;
  title: string;
  progress: number;
  goalValue: number;
  percentComplete: number;
  completed: boolean;
  daysRemaining: number;
  earnedBonus: number;
};

type Props = {
  challenge?: ChallengeData;
  petitionId?: string;
  displayMode?: 'card' | 'compact' | 'inline';
};

export function ChallengeCard({ 
  challenge,
  petitionId,
  displayMode = 'card'
}: Props) {
  const [userChallenges, setUserChallenges] = useState<ChallengeData[]>([]);
  const [activeChallenges, setActiveChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        if (challenge) {
          // Single challenge provided
          setUserChallenges([challenge]);
          setLoading(false);
          return;
        }

        // Fetch user challenges
        const userRes = await fetch('/api/challenges/user', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        });
        
        if (userRes.ok) {
          const { data } = await userRes.json();
          setUserChallenges(data.challenges || []);
        }

        // Fetch active challenges for petition
        if (petitionId) {
          const activeRes = await fetch(`/api/challenges/active/${petitionId}`);
          if (activeRes.ok) {
            const { data } = await activeRes.json();
            setActiveChallenges(data.challenges || []);
          }
        }
      } catch (err) {
        console.error('Failed to load challenges:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchChallenges();
  }, [challenge, petitionId]);

  const renderProgressBar = (percentComplete: number, completed: boolean) => (
    <div className="w-full h-3 bg-zinc-200 rounded-full overflow-hidden">
      <div 
        className={`h-full transition-all ${completed ? 'bg-green-500' : 'bg-blue-500'}`}
        style={{ width: `${percentComplete}%` }}
      />
    </div>
  );

  if (displayMode === 'inline') {
    // Inline view: single line summary
    if (!challenge) return null;
    
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="font-semibold text-zinc-700">{challenge.title}</span>
        <div className="flex-1 max-w-32 h-2 bg-zinc-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all"
            style={{ width: `${challenge.percentComplete}%` }}
          />
        </div>
        <span className="text-xs font-semibold text-zinc-600">
          {challenge.progress}/{challenge.goalValue}
        </span>
      </div>
    );
  }

  if (displayMode === 'compact') {
    // Compact: stacked challenges without full details
    const displayChallenges = challenge ? [challenge] : userChallenges;
    
    if (displayChallenges.length === 0) {
      return null;
    }

    return (
      <div className="space-y-2">
        {displayChallenges.map((c, idx) => (
          <div 
            key={idx}
            className={`p-2 rounded-lg ${c.completed ? 'bg-green-50' : 'bg-blue-50'}`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-zinc-700">{c.title}</span>
              <span className="text-xs font-bold text-zinc-600">{c.percentComplete}%</span>
            </div>
            {renderProgressBar(c.percentComplete, c.completed)}
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-zinc-500">
                {c.progress} of {c.goalValue}
              </span>
              <span className="text-xs font-semibold text-zinc-600">
                {c.daysRemaining > 0 ? `${c.daysRemaining}d left` : 'Ended'}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Full card view
  const displayChallenges = challenge ? [challenge] : userChallenges;

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-4 bg-zinc-200 rounded w-1/2" />
        <div className="h-3 bg-zinc-200 rounded w-full" />
      </div>
    );
  }

  if (displayChallenges.length === 0 && activeChallenges.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 p-4 text-center">
        <p className="text-sm text-zinc-600">No active challenges yet</p>
        <p className="text-xs text-zinc-500 mt-1">Check back soon for new opportunities to earn bonuses!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* User's participating challenges */}
      {displayChallenges.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm mb-3">Your Challenges</h4>
          <div className="space-y-3">
            {displayChallenges.map((c, idx) => (
              <div 
                key={idx}
                className={`rounded-lg p-4 border-2 ${c.completed ? 'border-green-300 bg-green-50' : 'border-blue-300 bg-blue-50'}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-sm">{c.title}</p>
                    <p className="text-xs text-zinc-600 mt-0.5">
                      {c.progress} of {c.goalValue} shares
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white">
                    {c.percentComplete}%
                  </span>
                </div>

                {renderProgressBar(c.percentComplete, c.completed)}

                {c.completed ? (
                  <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-green-700">
                    ✓ Completed
                    {c.earnedBonus > 1 && (
                      <span className="bg-green-200 px-2 py-0.5 rounded">
                        +{(c.earnedBonus - 1) * 100}% Trust Bonus
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-zinc-600">
                    {c.daysRemaining > 0 
                      ? `${c.daysRemaining} days remaining`
                      : 'Ended'}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available challenges for this petition */}
      {petitionId && activeChallenges.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm mb-3">Available Challenges</h4>
          <div className="space-y-2">
            {activeChallenges.map((ac, idx) => (
              <div 
                key={idx}
                className="rounded-lg p-3 border border-purple-200 bg-purple-50"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-sm text-purple-900">{ac.title}</p>
                    <p className="text-xs text-purple-700 mt-0.5">
                      Goal: {ac.goalValue} {ac.goalType.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                    +{Math.round((ac.rewardMultiplier - 1) * 100)}%
                  </span>
                </div>
                <p className="text-xs text-purple-600 mt-2">
                  {ac.participantCount} participant{ac.participantCount !== 1 ? 's' : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
