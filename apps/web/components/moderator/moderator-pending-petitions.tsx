'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../../lib/api';
import { useAuthStore } from '../../lib/store';

interface Petition {
  id: string;
  title: string;
  category: string | null;
  summary: string;
  goal: number;
  signaturesCount: number;
  status: string;
  createdAt: string;
  creator: { name: string; email: string };
}

interface ModeratorScope {
  allowedCategories: string[];
}

export function ModeratorPendingPetitions() {
  const token = useAuthStore((s) => s.token);
  const [petitions, setPetitions] = useState<Petition[]>([]);
  const [scope, setScope] = useState<ModeratorScope | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'all'>('PENDING');
  const [selectedPetitionId, setSelectedPetitionId] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState(false);

  useEffect(() => {
    if (!token) return;
    loadData();
  }, [token, statusFilter]);

  async function loadData() {
    try {
      setLoading(true);
      const [p, s] = await Promise.all([
        apiGet<Petition[]>(`/moderator/petitions?status=${statusFilter === 'all' ? '' : statusFilter}`, token!),
        apiGet<ModeratorScope>('/moderator/scope', token!),
      ]);
      setPetitions(p);
      setScope(s);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load petitions');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(petitionId: string, feedback?: string) {
    if (!token) return;
    try {
      setActionInProgress(true);
      await apiPost(
        `/moderator/petitions/${petitionId}/approve`,
        { feedback },
        token
      );
      setPetitions((prev) => prev.filter((p) => p.id !== petitionId));
      setSelectedPetitionId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve petition');
    } finally {
      setActionInProgress(false);
    }
  }

  async function handleReject(petitionId: string, reason: string) {
    if (!token || !reason.trim()) {
      setError('Rejection reason is required');
      return;
    }
    try {
      setActionInProgress(true);
      await apiPost(
        `/moderator/petitions/${petitionId}/reject`,
        { reason },
        token
      );
      setPetitions((prev) => prev.filter((p) => p.id !== petitionId));
      setSelectedPetitionId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject petition');
    } finally {
      setActionInProgress(false);
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading petitions...</div>;
  }

  const filtered = petitions.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (scope?.allowedCategories && scope.allowedCategories.length > 0) {
      return scope.allowedCategories.includes(p.category || '');
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Scope Info */}
      {scope && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-blue-900">Your Categories</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {scope.allowedCategories.length === 0 ? (
              <span className="text-sm text-blue-700">All categories</span>
            ) : (
              scope.allowedCategories.map((cat) => (
                <span key={cat} className="inline-block px-2 py-1 text-xs rounded bg-blue-200 text-blue-900">
                  {cat}
                </span>
              ))
            )}
          </div>
        </div>
      )}

      {/* Status Filter */}
      <div className="flex gap-2">
        {(
          [
            ['PENDING', 'Pending Review'],
            ['APPROVED', 'Approved'],
            ['REJECTED', 'Rejected'],
            ['all', 'All'],
          ] as const
        ).map(([status, label]) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === status
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-200 text-zinc-900 hover:bg-zinc-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Petitions Count */}
      <div className="text-sm text-zinc-600">
        {filtered.length} petition{filtered.length !== 1 ? 's' : ''} found
      </div>

      {/* Petitions Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-zinc-50 rounded-lg border border-zinc-200">
          <p className="text-zinc-600">No petitions to review in this category</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((petition) => (
            <div
              key={petition.id}
              className="border border-zinc-200 rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{petition.title}</h3>
                  <p className="text-sm text-zinc-600 mt-1">{petition.summary}</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {petition.category && (
                      <span className="inline-block px-2 py-1 text-xs rounded bg-purple-100 text-purple-700">
                        {petition.category}
                      </span>
                    )}
                    <span className={`inline-block px-2 py-1 text-xs rounded ${
                      petition.status === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-700'
                        : petition.status === 'APPROVED'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {petition.status}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPetitionId(selectedPetitionId === petition.id ? null : petition.id)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 whitespace-nowrap"
                  disabled={actionInProgress}
                >
                  {selectedPetitionId === petition.id ? 'Close' : 'Review'}
                </button>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-zinc-600">
                  <span>{petition.signaturesCount} signatures</span>
                  <span>Goal: {petition.goal}</span>
                </div>
                <div className="w-full h-2 bg-zinc-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500"
                    style={{
                      width: `${Math.min((petition.signaturesCount / petition.goal) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Creator Info */}
              <div className="text-xs text-zinc-600">
                Created by {petition.creator.name} ({petition.creator.email})
              </div>

              {/* Review Panel */}
              {selectedPetitionId === petition.id && (
                <PetitionApprovalPanel
                  petition={petition}
                  onApprove={(feedback) => handleApprove(petition.id, feedback)}
                  onReject={(reason) => handleReject(petition.id, reason)}
                  isLoading={actionInProgress}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface PetitionApprovalPanelProps {
  petition: Petition;
  onApprove: (feedback?: string) => void;
  onReject: (reason: string) => void;
  isLoading: boolean;
}

function PetitionApprovalPanel({
  petition,
  onApprove,
  onReject,
  isLoading,
}: PetitionApprovalPanelProps) {
  const [approvalFeedback, setApprovalFeedback] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);

  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-3">
      <p className="font-semibold text-emerald-900">Review Decision</p>

      {action === null && (
        <div className="flex gap-2">
          <button
            onClick={() => setAction('approve')}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            disabled={isLoading}
          >
            Approve
          </button>
          <button
            onClick={() => setAction('reject')}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
            disabled={isLoading}
          >
            Reject
          </button>
        </div>
      )}

      {action === 'approve' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium">
            Approval Feedback (Optional)
          </label>
          <textarea
            value={approvalFeedback}
            onChange={(e) => setApprovalFeedback(e.target.value)}
            placeholder="Add any feedback or notes..."
            className="w-full px-3 py-2 border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            rows={3}
          />
          <div className="flex gap-2">
            <button
              onClick={() => onApprove(approvalFeedback)}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Approving...' : 'Confirm Approval'}
            </button>
            <button
              onClick={() => {
                setAction(null);
                setApprovalFeedback('');
              }}
              className="px-4 py-2 bg-zinc-300 text-zinc-900 rounded-lg hover:bg-zinc-400"
              disabled={isLoading}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {action === 'reject' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-red-900">
            Rejection Reason (Required)
          </label>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Explain why this petition is being rejected..."
            className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            rows={3}
            required
          />
          <div className="flex gap-2">
            <button
              onClick={() => onReject(rejectionReason)}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50"
              disabled={isLoading || !rejectionReason.trim()}
            >
              {isLoading ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
            <button
              onClick={() => {
                setAction(null);
                setRejectionReason('');
              }}
              className="px-4 py-2 bg-zinc-300 text-zinc-900 rounded-lg hover:bg-zinc-400"
              disabled={isLoading}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
