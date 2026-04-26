'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../../lib/api';
import { useAuthStore } from '../../lib/store';

interface Petition {
  id: string;
  title: string;
  summary: string;
  status: string;
  signaturesCount: number;
  goal: number;
  category: string | null;
  createdAt: string;
  updatedAt: string;
}

export function MyPetitions() {
  const token = useAuthStore((s) => s.token);
  const [petitions, setPetitions] = useState<Petition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    if (!token) return;
    loadPetitions();
  }, [token]);

  async function loadPetitions() {
    try {
      setLoading(true);
      const data = await apiGet<Petition[]>('/users/me/petitions', token!);
      setPetitions(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load petitions');
    } finally {
      setLoading(false);
    }
  }

  async function handleWithdraw(id: string) {
    if (!token || !confirm('Are you sure you want to withdraw this petition?')) return;
    try {
      await apiPost(`/petitions/${id}/withdraw`, {}, token);
      await loadPetitions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to withdraw petition');
    }
  }

  const filtered = filter === 'all' ? petitions : petitions.filter(p => p.status.toLowerCase() === filter);

  if (loading) {
    return <div className="text-center py-8">Loading your petitions...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === f
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-200 text-zinc-900 hover:bg-zinc-300'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Create Button */}
      <div className="flex justify-end">
        <Link
          href="/create"
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
        >
          Create New Petition
        </Link>
      </div>

      {/* Petitions List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-zinc-50 rounded-lg border border-zinc-200">
          <p className="text-zinc-600 mb-4">
            {filter === 'all'
              ? "You haven't created any petitions yet."
              : `No ${filter} petitions.`}
          </p>
          <Link
            href="/create"
            className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700"
          >
            Create Your First Petition
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((petition) => {
            const progress = (petition.signaturesCount / petition.goal) * 100;
            return (
              <div
                key={petition.id}
                className="bg-white border border-zinc-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <Link
                      href={`/petitions/${petition.id}`}
                      className="text-lg font-semibold text-emerald-600 hover:underline"
                    >
                      {petition.title}
                    </Link>
                    <p className="text-sm text-zinc-600 mt-1">{petition.summary}</p>
                  </div>
                  <span
                    className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                      petition.status === 'APPROVED'
                        ? 'bg-green-100 text-green-700'
                        : petition.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {petition.status}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-zinc-600">
                      {petition.signaturesCount} signatures
                    </span>
                    <span className="font-semibold">
                      {Math.round(progress)}% of {petition.goal}
                    </span>
                  </div>
                  <div className="w-full bg-zinc-200 rounded-full h-2">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Metadata */}
                <div className="flex flex-wrap gap-4 text-sm text-zinc-600 mb-4">
                  {petition.category && (
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded">
                      {petition.category}
                    </span>
                  )}
                  <span>Created {new Date(petition.createdAt).toLocaleDateString()}</span>
                  <span>Updated {new Date(petition.updatedAt).toLocaleDateString()}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link
                    href={`/petitions/${petition.id}`}
                    className="text-emerald-600 hover:underline font-medium"
                  >
                    View
                  </Link>
                  <Link
                    href={`/petitions/${petition.id}/edit`}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Edit
                  </Link>
                  {petition.status === 'PENDING' && (
                    <button
                      onClick={() => handleWithdraw(petition.id)}
                      className="text-red-600 hover:underline font-medium"
                    >
                      Withdraw
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
