'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Flame } from 'lucide-react';
import { fetchApi } from '@/lib/api-client';
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

interface Challenge {
  id: string;
  title: string;
  description: string;
  status: string;
  targetCount: number;
  currentCount: number;
  createdAt: string;
  endsAt: string;
}

interface ChallengeDetails extends Challenge {
  completionRate: number;
  membersCount: number;
}

export function AdminFacebookEngagement() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeDetails | null>(null);

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const response = await fetchApi('/api/v1/admin/facebook/challenges');

        if (!response.ok) throw new Error('Failed to fetch challenges');
        const result = await response.json();
        setChallenges(result.challenges || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchChallenges();
  }, []);

  const handleChallengeSelect = async (challengeId: string) => {
    try {
      const response = await fetchApi(`/api/v1/admin/facebook/challenges/${challengeId}`);

      if (!response.ok) throw new Error('Failed to fetch challenge details');
      const result = await response.json();
      setSelectedChallenge(result);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error loading challenge details');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgress = (challenge: Challenge) => {
    return Math.min((challenge.currentCount / challenge.targetCount) * 100, 100);
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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Share Challenges</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : challenges.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No challenges found</p>
          ) : (
            <div className="space-y-3">
              {challenges.map((challenge) => (
                <div
                  key={challenge.id}
                  onClick={() => handleChallengeSelect(challenge.id)}
                  className="border rounded p-3 cursor-pointer hover:bg-gray-50 transition"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{challenge.title}</h4>
                      <p className="text-sm text-gray-600">{challenge.description}</p>
                    </div>
                    <Badge className={getStatusColor(challenge.status)}>
                      {challenge.status}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        {challenge.currentCount} / {challenge.targetCount} participants
                      </span>
                      <span className="font-medium">
                        {getProgress(challenge).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${getProgress(challenge)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedChallenge && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedChallenge.title} - Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <p className="text-xs text-gray-600">Status</p>
                <Badge className={getStatusColor(selectedChallenge.status)}>
                  {selectedChallenge.status}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-gray-600">Members</p>
                <p className="text-2xl font-bold">{selectedChallenge.membersCount}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Participants</p>
                <p className="text-2xl font-bold">{selectedChallenge.currentCount}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold">
                  {selectedChallenge.completionRate.toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 mb-2">Description</p>
              <p className="text-sm">{selectedChallenge.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t pt-4">
              <div>
                <p className="text-xs text-gray-600">Started</p>
                <p className="text-sm">
                  {new Date(selectedChallenge.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Ends</p>
                <p className="text-sm">
                  {new Date(selectedChallenge.endsAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
