'use client';

import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';

// UI Components (inline)
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-lg border border-zinc-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>
);

const CardTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>
);

const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 pt-0 ${className}`}>{children}</div>
);

const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse rounded-md bg-gradient-to-r from-zinc-200 to-zinc-100 dark:from-neutral-700 dark:to-neutral-800 ${className}`} />
);

const Badge = ({ children, className = '', variant = 'default' }: { children: React.ReactNode; className?: string; variant?: 'default' | 'outline' }) => {
  const baseStyles = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold';
  const variantStyles = variant === 'outline' ? 'border border-zinc-200 bg-transparent text-zinc-900 dark:border-neutral-700' : 'bg-zinc-200 text-zinc-900 dark:bg-neutral-700';
  return <span className={`${baseStyles} ${variantStyles} ${className}`}>{children}</span>;
};

interface BadgeData {
  badgeType: string;
  totalUnlocks: number;
  recentUnlocks?: Array<{
    id: string;
    userId: string;
    earnedAt: string;
    user?: {
      fullName: string;
      email: string;
    };
    petition?: {
      title: string;
    };
  }>;
}

interface BadgesResponse {
  badges: Array<{
    badgeType: string;
  }>;
  summary: Record<string, number>;
}

export function AdminFacebookSocialFeatures() {
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const response = await fetch('/api/v1/api/admin/facebook/badges', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch badges');
        const result: BadgesResponse = await response.json();
        
        // Convert summary to badge data
        const badgeData = Object.entries(result.summary).map(([type, count]) => ({
          badgeType: type,
          totalUnlocks: count,
        }));
        
        setBadges(badgeData);
        if (badgeData.length > 0) {
          setSelectedBadge(badgeData[0].badgeType);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();
  }, []);

  const handleBadgeSelect = async (badgeType: string) => {
    setSelectedBadge(badgeType);
    try {
      const response = await fetch(`/api/v1/api/admin/facebook/badges/${badgeType}/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch badge stats');
      const result: BadgeData = await response.json();
      
      // Update the badge with detailed stats
      setBadges(prev =>
        prev.map(b =>
          b.badgeType === badgeType
            ? { ...b, recentUnlocks: result.recentUnlocks }
            : b
        )
      );
    } catch (err) {
      console.error('Error fetching badge stats:', err);
    }
  };

  if (error) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="flex items-center gap-2 pt-6">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-800">{error}</span>
        </CardContent>
      </Card>
    );
  }

  const selectedBadgeData = badges.find(b => b.badgeType === selectedBadge);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Social Engagement Badges</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {badges.map((badge) => (
                <button
                  key={badge.badgeType}
                  onClick={() => handleBadgeSelect(badge.badgeType)}
                  className={`px-3 py-1 rounded text-sm font-medium transition ${
                    selectedBadge === badge.badgeType
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {badge.badgeType} ({badge.totalUnlocks})
                </button>
              ))}
            </div>

            {selectedBadgeData && (
              <div className="border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs text-gray-600">Total Unlocks</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <span className="text-2xl font-bold">{selectedBadgeData.totalUnlocks}</span>
                    </CardContent>
                  </Card>
                </div>

                <h4 className="font-medium text-sm mb-3">Recent Unlocks</h4>
                <div className="space-y-2">
                  {selectedBadgeData.recentUnlocks?.slice(0, 5).map((unlock) => (
                    <div
                      key={unlock.id}
                      className="border rounded p-2 text-xs space-y-1 bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{unlock.user?.fullName}</span>
                        <span className="text-gray-500">
                          {new Date(unlock.earnedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-gray-600">{unlock.petition?.title}</div>
                      <div className="text-gray-500">{unlock.user?.email}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
