'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '../../lib/api';
import { useAuthStore } from '../../lib/store';

interface User {
  id: string;
  fullName: string;
  email: string;
  trustScore: number;
  verificationStatus: string;
  badgesEarned: string[];
}

interface Stats {
  petitionsCreated: number;
  petitionsApproved: number;
  signaturesGiven: number;
  petitionsWon: number;
}

export function DashboardOverview() {
  const token = useAuthStore((s) => s.token);
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    loadDashboardData();
  }, [token]);

  async function loadDashboardData() {
    try {
      setLoading(true);
      const [u, s] = await Promise.all([
        apiGet<User>('/users/me', token!),
        apiGet<Stats>('/users/me/stats', token!),
      ]);
      setUser(u);
      setStats(s);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      {user && (
        <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-emerald-900">
            Welcome back, {user.fullName}!
          </h2>
          <p className="mt-2 text-emerald-700">
            Your trust score: <span className="font-bold">{user.trustScore}</span> •{' '}
            Status: <span className="font-semibold">{user.verificationStatus}</span>
          </p>
        </div>
      )}

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-700 font-semibold">Petitions Created</p>
            <p className="text-3xl font-bold text-blue-900 mt-2">{stats.petitionsCreated}</p>
            <p className="text-xs text-blue-600 mt-1">total created</p>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <p className="text-sm text-emerald-700 font-semibold">Approved</p>
            <p className="text-3xl font-bold text-emerald-900 mt-2">{stats.petitionsApproved}</p>
            <p className="text-xs text-emerald-600 mt-1">now public</p>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm text-purple-700 font-semibold">Signatures Given</p>
            <p className="text-3xl font-bold text-purple-900 mt-2">{stats.signaturesGiven}</p>
            <p className="text-xs text-purple-600 mt-1">petitions signed</p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-700 font-semibold">Petitions Won</p>
            <p className="text-3xl font-bold text-green-900 mt-2">{stats.petitionsWon}</p>
            <p className="text-xs text-green-600 mt-1">goal reached</p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-6">
        <h3 className="font-semibold text-lg mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <a
            href="/create"
            className="px-4 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors text-center"
          >
            Create Petition
          </a>
          <a
            href="/petitions"
            className="px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-center"
          >
            Browse Petitions
          </a>
          <a
            href="/dashboard?tab=profile"
            className="px-4 py-3 bg-zinc-600 text-white rounded-lg font-medium hover:bg-zinc-700 transition-colors text-center"
          >
            View Profile
          </a>
        </div>
      </div>

      {/* Badges */}
      {user && user.badgesEarned.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-semibold text-lg mb-4">Your Badges</h3>
          <div className="flex flex-wrap gap-3">
            {user.badgesEarned.map((badge, i) => (
              <div
                key={i}
                className="px-3 py-2 bg-yellow-100 border border-yellow-300 rounded-full text-sm font-medium text-yellow-800"
              >
                🏅 {badge}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Getting Started */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-lg text-blue-900 mb-3">Getting Started</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <span className="text-lg">1️⃣</span>
            <span>Create a petition about an issue you care about</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-lg">2️⃣</span>
            <span>Share it with your network to gather signatures</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-lg">3️⃣</span>
            <span>When approved, it reaches government officials</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-lg">4️⃣</span>
            <span>Track the response and celebrate your impact</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
