import React, { useEffect, useState } from 'react';
import { TrendingUp, MapPin } from 'lucide-react';
import Image from 'next/image';

interface PetitionRank {
  id: string;
  title: string;
  imageUrl?: string;
  signaturesCount: number;
  goal: number;
  rank: number;
  countySignatures: number;
  percentOfTotal: number;
}

interface CountyLeaderboardProps {
  county: string;
  limit?: number;
}

export const CountyLeaderboard: React.FC<CountyLeaderboardProps> = ({
  county,
  limit = 10,
}) => {
  const [leaderboard, setLeaderboard] = useState<PetitionRank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/growth/leaderboard/${encodeURIComponent(county)}?limit=${limit}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard');
        }

        const data = await response.json();
        setLeaderboard(data.leaderboard || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch leaderboard');
        console.error('Leaderboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [county, limit]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (error || leaderboard.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500">No petitions found for {county}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-5 h-5" />
          <h2 className="text-xl font-bold">{county} Leaderboard</h2>
        </div>
        <p className="text-blue-100 text-sm">Most active petitions in your county</p>
      </div>

      {/* Leaderboard Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">#</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Petition</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">{county} Signatures</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">% of Total</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Overall Progress</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((petition, idx) => {
              const progressPercent = Math.round((petition.signaturesCount / petition.goal) * 100);
              const isTopRank = petition.rank === 1;

              return (
                <tr
                  key={petition.id}
                  className={`border-b transition hover:bg-gray-50 ${
                    isTopRank ? 'bg-amber-50' : ''
                  }`}
                >
                  {/* Rank */}
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {isTopRank ? (
                        <span className="text-2xl">🥇</span>
                      ) : petition.rank === 2 ? (
                        <span className="text-2xl">🥈</span>
                      ) : petition.rank === 3 ? (
                        <span className="text-2xl">🥉</span>
                      ) : (
                        <span className="font-bold text-gray-600 text-lg">#{petition.rank}</span>
                      )}
                    </div>
                  </td>

                  {/* Petition Title */}
                  <td className="px-6 py-4">
                    <a
                      href={`/petitions/${petition.id}`}
                      className="hover:underline text-blue-600 font-semibold line-clamp-2"
                    >
                      {petition.title}
                    </a>
                  </td>

                  {/* County Signatures */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="font-bold text-gray-900">
                        {petition.countySignatures.toLocaleString()}
                      </span>
                    </div>
                  </td>

                  {/* Percentage */}
                  <td className="px-6 py-4 text-right">
                    <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                      {petition.percentOfTotal}%
                    </span>
                  </td>

                  {/* Overall Progress Bar */}
                  <td className="px-6 py-4 text-right">
                    <div className="space-y-1">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden ml-auto">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all"
                          style={{ width: `${Math.min(progressPercent, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-600">
                        {petition.signaturesCount.toLocaleString()} / {petition.goal.toLocaleString()}
                      </p>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Stats */}
      <div className="px-6 py-4 bg-gray-50 border-t">
        <p className="text-xs text-gray-600">
          Showing {Math.min(leaderboard.length, limit)} most active petitions · Updated daily
        </p>
      </div>
    </div>
  );
};

export default CountyLeaderboard;
