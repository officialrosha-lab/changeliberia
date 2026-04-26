'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../../lib/api';
import { useAuthStore } from '../../lib/store';

interface SignedPetition {
  id: string;
  title: string;
  summary: string;
  signaturesCount: number;
  goal: number;
  status: string;
  creator: {
    fullName: string;
  };
  createdAt: string;
  signedAt: string;
}

export function SignedPetitions() {
  const token = useAuthStore((s) => s.token);
  const [petitions, setPetitions] = useState<SignedPetition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    loadSignedPetitions();
  }, [token]);

  async function loadSignedPetitions() {
    try {
      setLoading(true);
      const data = await apiGet<SignedPetition[]>('/users/me/signed-petitions', token!);
      setPetitions(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load signed petitions');
    } finally {
      setLoading(false);
    }
  }

  async function handleUnsign(petitionId: string) {
    if (!token || !confirm('Are you sure you want to remove your signature?')) return;
    try {
      await apiPost(`/petitions/${petitionId}/unsign`, {}, token);
      await loadSignedPetitions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove signature');
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading signed petitions...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <p className="text-purple-700 font-semibold">
          You have signed {petitions.length} petition{petitions.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Petitions List */}
      {petitions.length === 0 ? (
        <div className="text-center py-12 bg-zinc-50 rounded-lg border border-zinc-200">
          <p className="text-zinc-600 mb-4">You haven't signed any petitions yet.</p>
          <Link
            href="/petitions"
            className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700"
          >
            Browse Petitions
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {petitions.map((petition) => {
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
                    <p className="text-sm text-zinc-600 mt-1">
                      by <span className="font-semibold">{petition.creator.fullName}</span>
                    </p>
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

                <p className="text-sm text-zinc-600 mb-4">{petition.summary}</p>

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
                      className="bg-purple-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Metadata */}
                <div className="flex flex-wrap gap-4 text-sm text-zinc-600 mb-4">
                  <span>Created {new Date(petition.createdAt).toLocaleDateString()}</span>
                  <span>You signed {new Date(petition.signedAt).toLocaleDateString()}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link
                    href={`/petitions/${petition.id}`}
                    className="text-emerald-600 hover:underline font-medium"
                  >
                    View Details
                  </Link>
                  <button
                    onClick={() => handleUnsign(petition.id)}
                    className="text-red-600 hover:underline font-medium"
                  >
                    Remove Signature
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
