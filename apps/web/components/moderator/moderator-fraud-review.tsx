'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../../lib/api';
import { useAuthStore } from '../../lib/store';

interface FraudFlag {
  id: string;
  reason: string;
  riskLevel: string;
  suspiciousSignatures: number;
  totalSignatures: number;
  flaggedAt: string;
  status: string;
  details: string;
  petition?: {
    id: string;
    title: string;
  };
  user?: {
    id: string;
    email: string;
    fullName: string;
  };
}

export function ModeratorFraudReview() {
  const token = useAuthStore((s) => s.token);
  const [flags, setFlags] = useState<FraudFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'RESOLVED' | 'all'>('PENDING');
  const [selectedFlagId, setSelectedFlagId] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState(false);

  useEffect(() => {
    if (!token) return;
    loadFlags();
  }, [token, statusFilter]);

  async function loadFlags() {
    try {
      setLoading(true);
      const data = await apiGet<FraudFlag[]>(
        `/moderator/fraud-flags?status=${statusFilter === 'all' ? '' : statusFilter}`,
        token!
      );
      setFlags(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load fraud flags');
    } finally {
      setLoading(false);
    }
  }

  async function handleResolveFlag(flagId: string, action: 'approve' | 'ban' | 'dismiss', notes?: string) {
    if (!token) return;
    try {
      setActionInProgress(true);
      await apiPost(
        `/moderator/fraud-flags/${flagId}/resolve`,
        { action, notes },
        token
      );
      setFlags((prev) => prev.filter((f) => f.id !== flagId));
      setSelectedFlagId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve flag');
    } finally {
      setActionInProgress(false);
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading fraud flags...</div>;
  }

  const filtered = flags.filter((f) => statusFilter === 'all' || f.status === statusFilter);

  const getRiskColor = (level: string) => {
    switch (level.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-900 border-red-200';
      case 'HIGH':
        return 'bg-orange-100 text-orange-900 border-orange-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-900 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-900 border-blue-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Filter */}
      <div className="flex gap-2">
        {(
          [
            ['PENDING', 'Pending Review'],
            ['RESOLVED', 'Resolved'],
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

      {/* Count */}
      <div className="text-sm text-zinc-600">
        {filtered.length} flag{filtered.length !== 1 ? 's' : ''} to review
      </div>

      {/* Flags List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-zinc-50 rounded-lg border border-zinc-200">
          <p className="text-zinc-600">No fraud flags to review</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((flag) => (
            <div
              key={flag.id}
              className={`border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow ${getRiskColor(flag.riskLevel)}`}
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{flag.reason}</h3>
                    <span className="px-2 py-1 text-xs rounded bg-white font-semibold">
                      {flag.riskLevel}
                    </span>
                  </div>
                  <p className="text-sm mt-1">{flag.details}</p>

                  {flag.petition && (
                    <div className="text-sm mt-2">
                      <p className="font-medium">Petition: {flag.petition.title}</p>
                    </div>
                  )}

                  {flag.user && (
                    <div className="text-sm mt-1">
                      <p>User: {flag.user.fullName} ({flag.user.email})</p>
                    </div>
                  )}

                  {/* Signature Stats */}
                  <div className="mt-2 text-sm">
                    <p className="mb-1">
                      Suspicious: {flag.suspiciousSignatures} / {flag.totalSignatures} signatures
                    </p>
                    <div className="w-full h-2 bg-white bg-opacity-50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-600"
                        style={{
                          width: `${(flag.suspiciousSignatures / flag.totalSignatures) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <p className="text-xs mt-2 opacity-75">
                    Flagged {new Date(flag.flaggedAt).toLocaleDateString()}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedFlagId(selectedFlagId === flag.id ? null : flag.id)}
                  className="px-4 py-2 bg-white bg-opacity-80 text-black rounded-lg hover:bg-opacity-100 whitespace-nowrap font-medium"
                  disabled={actionInProgress}
                >
                  {selectedFlagId === flag.id ? 'Close' : 'Review'}
                </button>
              </div>

              {/* Resolution Panel */}
              {selectedFlagId === flag.id && (
                <FlagResolutionPanel
                  flag={flag}
                  onResolve={(action, notes) => handleResolveFlag(flag.id, action, notes)}
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

interface FlagResolutionPanelProps {
  flag: FraudFlag;
  onResolve: (action: 'approve' | 'ban' | 'dismiss', notes?: string) => void;
  isLoading: boolean;
}

function FlagResolutionPanel({ flag, onResolve, isLoading }: FlagResolutionPanelProps) {
  const [notes, setNotes] = useState('');
  const [selectedAction, setSelectedAction] = useState<'approve' | 'ban' | 'dismiss' | null>(null);

  const handleAction = (action: 'approve' | 'ban' | 'dismiss') => {
    onResolve(action, notes);
  };

  return (
    <div className="bg-white bg-opacity-90 rounded-lg p-4 space-y-3 border-t border-current border-opacity-20">
      <p className="font-semibold">Resolution</p>

      {selectedAction === null && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedAction('approve')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm"
            disabled={isLoading}
          >
            Approve & Clear
          </button>
          <button
            onClick={() => setSelectedAction('ban')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm"
            disabled={isLoading}
          >
            Ban User/IP
          </button>
          <button
            onClick={() => setSelectedAction('dismiss')}
            className="px-4 py-2 bg-zinc-600 text-white rounded-lg hover:bg-zinc-700 font-medium text-sm"
            disabled={isLoading}
          >
            Dismiss Flag
          </button>
        </div>
      )}

      {selectedAction && (
        <div className="space-y-2">
          <label className="block text-sm font-medium">Notes (Optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add resolution notes..."
            className="w-full px-3 py-2 border border-current border-opacity-40 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-white"
            rows={2}
          />
          <div className="flex gap-2">
            <button
              onClick={() => handleAction(selectedAction)}
              className="flex-1 px-4 py-2 bg-white text-black rounded-lg hover:bg-opacity-80 font-medium disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Confirm'}
            </button>
            <button
              onClick={() => {
                setSelectedAction(null);
                setNotes('');
              }}
              className="px-4 py-2 bg-white bg-opacity-50 text-black rounded-lg hover:bg-opacity-75 font-medium"
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
