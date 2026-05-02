'use client';

import { useState, useMemo } from 'react';
import { useAuthStore } from '../../lib/store';
import { apiPatch } from '../../lib/api';

type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

interface Ambassador {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  occupation?: string;
  motivation: string;
  growthPlan: string;
  socialLinks?: string;
  status: ApplicationStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface AdminAmbassadorsPanelProps {
  initialApplications: Ambassador[];
}

export function AdminAmbassadorsPanel({ initialApplications }: AdminAmbassadorsPanelProps) {
  const { token } = useAuthStore();
  const [applications, setApplications] = useState<Ambassador[]>(initialApplications);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'ALL'>('ALL');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [updateNotes, setUpdateNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const filteredApplications = useMemo(() => {
    if (statusFilter === 'ALL') return applications;
    return applications.filter((app) => app.status === statusFilter);
  }, [applications, statusFilter]);

  const selectedApplication = selectedId ? applications.find((app) => app.id === selectedId) : null;

  const handleStatusUpdate = async (id: string, newStatus: ApplicationStatus) => {
    setUpdatingId(id);
    setError(null);

    try {
      const app = applications.find((a) => a.id === id);
      const result = await apiPatch(`/ambassadors/admin/${id}`, {
        status: newStatus,
        notes: updateNotes || undefined,
      }, token);

      setApplications((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: newStatus, notes: updateNotes || a.notes } : a))
      );

      setSuccess(`Application marked as ${newStatus.toLowerCase()}`);
      setSelectedId(null);
      setUpdateNotes('');

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update application');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'APPROVED':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="flex gap-2">
        {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              statusFilter === status
                ? 'bg-emerald-600 text-white dark:bg-emerald-500'
                : 'border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300'
            }`}
          >
            {status} ({applications.filter((a) => status === 'ALL' ? true : a.status === status).length})
          </button>
        ))}
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-950/20">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <p className="text-sm text-emerald-700 dark:text-emerald-300">{success}</p>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-neutral-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-neutral-800 dark:bg-neutral-900">
                <th className="px-4 py-3 text-left font-semibold text-zinc-700 dark:text-neutral-300">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-700 dark:text-neutral-300">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-700 dark:text-neutral-300">Location</th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-700 dark:text-neutral-300">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-700 dark:text-neutral-300">Applied</th>
                <th className="px-4 py-3 text-right font-semibold text-zinc-700 dark:text-neutral-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-500 dark:text-neutral-400">
                    No applications found
                  </td>
                </tr>
              ) : (
                filteredApplications.map((app) => (
                  <tr
                    key={app.id}
                    className="border-b border-zinc-200 hover:bg-zinc-50 dark:border-neutral-800 dark:hover:bg-neutral-800/30"
                  >
                    <td className="px-4 py-3">{app.fullName}</td>
                    <td className="px-4 py-3 text-xs text-zinc-600 dark:text-neutral-400">{app.email}</td>
                    <td className="px-4 py-3">{app.location}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(app.status)}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500 dark:text-neutral-500">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedId(app.id);
                          setUpdateNotes(app.notes || '');
                        }}
                        className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-lg border border-zinc-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Application Details</h2>
              <button
                onClick={() => setSelectedId(null)}
                className="text-zinc-500 hover:text-zinc-700 dark:text-neutral-400 dark:hover:text-neutral-200"
              >
                ✕
              </button>
            </div>

            <div className="max-h-96 space-y-4 overflow-y-auto">
              {/* Personal Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-zinc-500 dark:text-neutral-400">Full Name</p>
                  <p className="mt-1 text-sm text-zinc-900 dark:text-white">{selectedApplication.fullName}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-500 dark:text-neutral-400">Email</p>
                  <p className="mt-1 text-sm text-zinc-900 dark:text-white">{selectedApplication.email}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-500 dark:text-neutral-400">Phone</p>
                  <p className="mt-1 text-sm text-zinc-900 dark:text-white">{selectedApplication.phone}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-500 dark:text-neutral-400">Location</p>
                  <p className="mt-1 text-sm text-zinc-900 dark:text-white">{selectedApplication.location}</p>
                </div>
              </div>

              {selectedApplication.occupation && (
                <div>
                  <p className="text-xs font-semibold text-zinc-500 dark:text-neutral-400">Occupation</p>
                  <p className="mt-1 text-sm text-zinc-900 dark:text-white">{selectedApplication.occupation}</p>
                </div>
              )}

              {selectedApplication.socialLinks && (
                <div>
                  <p className="text-xs font-semibold text-zinc-500 dark:text-neutral-400">Social Media</p>
                  <p className="mt-1 text-sm text-zinc-900 dark:text-white">{selectedApplication.socialLinks}</p>
                </div>
              )}

              {/* Motivation */}
              <div>
                <p className="text-xs font-semibold text-zinc-500 dark:text-neutral-400">Motivation</p>
                <p className="mt-1 text-sm leading-relaxed text-zinc-900 dark:text-white">{selectedApplication.motivation}</p>
              </div>

              {/* Growth Plan */}
              <div>
                <p className="text-xs font-semibold text-zinc-500 dark:text-neutral-400">Growth Plan</p>
                <p className="mt-1 text-sm leading-relaxed text-zinc-900 dark:text-white">{selectedApplication.growthPlan}</p>
              </div>

              {/* Status & Notes */}
              <div className="space-y-3 border-t border-zinc-200 pt-4 dark:border-neutral-800">
                <div>
                  <p className="text-xs font-semibold text-zinc-500 dark:text-neutral-400">Status</p>
                  <p className="mt-1">
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(selectedApplication.status)}`}>
                      {selectedApplication.status}
                    </span>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-neutral-400">Admin Notes</label>
                  <textarea
                    value={updateNotes}
                    onChange={(e) => setUpdateNotes(e.target.value)}
                    placeholder="Add notes for this application..."
                    rows={3}
                    className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-neutral-700"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex gap-3 border-t border-zinc-200 pt-4 dark:border-neutral-800">
              {selectedApplication.status !== 'APPROVED' && (
                <button
                  onClick={() => handleStatusUpdate(selectedApplication.id, 'APPROVED')}
                  disabled={updatingId === selectedApplication.id}
                  className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-500"
                >
                  Approve
                </button>
              )}

              {selectedApplication.status !== 'REJECTED' && (
                <button
                  onClick={() => handleStatusUpdate(selectedApplication.id, 'REJECTED')}
                  disabled={updatingId === selectedApplication.id}
                  className="flex-1 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                  Reject
                </button>
              )}

              <button
                onClick={() => setSelectedId(null)}
                className="flex-1 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
