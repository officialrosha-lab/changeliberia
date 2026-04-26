import React, { useEffect, useState } from 'react';
import { TrendingUp, Flame } from 'lucide-react';
import Image from 'next/image';

interface TrendingPetition {
  id: string;
  title: string;
  summary?: string;
  imageUrl?: string;
  signaturesCount: number;
  goal: number;
  todaySignatures: number;
  signatureVelocity: number;
  percentToGoal: number;
  creator: {
    fullName: string;
    avatarUrl?: string;
  };
}

interface TrendingPetitionsProps {
  limit?: number;
  county?: string;
}

export const TrendingPetitions: React.FC<TrendingPetitionsProps> = ({
  limit = 10,
  county,
}) => {
  const [petitions, setPetitions] = useState<TrendingPetition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        setLoading(true);
        const url = new URL('/api/growth/trending', window.location.origin);
        url.searchParams.set('limit', limit.toString());
        if (county) {
          url.searchParams.set('county', county);
        }

        const response = await fetch(url.toString());

        if (!response.ok) {
          throw new Error('Failed to fetch trending petitions');
        }

        const data = await response.json();
        setPetitions(data.petitions || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch');
        console.error('Trending fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, [limit, county]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow animate-pulse h-80" />
        ))}
      </div>
    );
  }

  if (error || petitions.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg">
        <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No trending petitions found</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <div className="flex items-center gap-2">
          <Flame className="w-6 h-6 text-orange-500" />
          <h2 className="text-2xl font-bold">Trending Now</h2>
        </div>
        <span className="text-sm text-gray-600">This week</span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {petitions.map((petition, idx) => (
          <a
            key={petition.id}
            href={`/petitions/${petition.id}`}
            className="group bg-white rounded-lg shadow hover:shadow-lg overflow-hidden transition transform hover:-translate-y-1"
          >
            {/* Image */}
            <div className="relative h-48 bg-gradient-to-br from-blue-400 to-blue-600 overflow-hidden">
              {petition.imageUrl ? (
                <Image
                  src={petition.imageUrl}
                  alt={petition.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-4xl opacity-20">
                  📋
                </div>
              )}

              {/* Trending Badge */}
              <div className="absolute top-3 left-3 flex items-center gap-1 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                <Flame className="w-4 h-4" />
                #{idx + 1}
              </div>

              {/* Velocity Badge */}
              {petition.signatureVelocity > 0 && (
                <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  +{petition.signatureVelocity}/day
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4">
              {/* Title */}
              <h3 className="font-bold text-gray-900 line-clamp-2 mb-2 group-hover:text-blue-600 transition">
                {petition.title}
              </h3>

              {/* Creator */}
              <div className="flex items-center gap-2 mb-3">
                {petition.creator.avatarUrl ? (
                  <Image
                    src={petition.creator.avatarUrl}
                    alt={petition.creator.fullName}
                    width={24}
                    height={24}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold">
                    {petition.creator.fullName.charAt(0)}
                  </div>
                )}
                <span className="text-xs text-gray-600">{petition.creator.fullName}</span>
              </div>

              {/* Progress */}
              <div className="space-y-2">
                {/* Progress Bar */}
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                    style={{ width: `${Math.min(petition.percentToGoal, 100)}%` }}
                  />
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-gray-900">
                    {petition.signaturesCount.toLocaleString()}
                  </span>
                  <span className="text-gray-600">
                    {petition.percentToGoal}% of {petition.goal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Momentum Indicator */}
              <div className="mt-3 pt-3 border-t">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">This week</span>
                  <span className="font-semibold text-green-600 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    +{petition.todaySignatures} signatures
                  </span>
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* View All Button */}
      <div className="text-center mt-8">
        <a
          href="/petitions?sort=trending"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition"
        >
          View All Trending Petitions →
        </a>
      </div>
    </div>
  );
};

export default TrendingPetitions;
