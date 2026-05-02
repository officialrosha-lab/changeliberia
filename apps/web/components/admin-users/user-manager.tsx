'use client';

import { useEffect, useState } from 'react';
import { apiDelete, apiGet, apiPost } from '../../lib/api';
import { useAuthStore } from '../../lib/store';

interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  trustScore: number;
  verificationStatus: string;
  createdAt: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
}

interface UserRole {
  userId: string;
  roleId: string;
  grantedAt: string;
  expiresAt: string | null;
}

export function AdminUserManager() {
  const token = useAuthStore((s) => s.token);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [userRoles, setUserRoles] = useState<Map<string, UserRole[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    if (!token) return;
    loadData();
  }, [token, page]);

  async function loadData() {
    try {
      setLoading(true);
      const [u, r] = await Promise.all([
        apiGet<User[]>(`/admin/users?page=${page}&limit=${pageSize}`, token!),
        apiGet<Role[]>('/rbac/roles', token!),
      ]);
      setUsers(u);
      setRoles(r);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  async function loadUserRoles(userId: string) {
    try {
      const data = await apiGet<UserRole[]>(`/rbac/users/${userId}/roles`, token!);
      setUserRoles((prev) => new Map(prev).set(userId, data));
    } catch (err) {
      console.error('Failed to load user roles:', err);
    }
  }

  async function handleAssignRole(userId: string, roleId: string, expiryDays?: number) {
    if (!token) return;
    try {
      const expiresAt = expiryDays ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString() : null;
      await apiPost(`/rbac/users/${userId}/roles/${roleId}`, { expiresAt }, token);
      await loadUserRoles(userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign role');
    }
  }

  async function handleRemoveRole(userId: string, roleId: string) {
    if (!token) return;
    try {
      await apiDelete(`/rbac/users/${userId}/roles/${roleId}`, token);
      await loadUserRoles(userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove role');
    }
  }

  const filtered = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-8">Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(0);
          }}
          className="flex-1 px-3 py-2 rounded-xl border border-zinc-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-zinc-900 dark:text-neutral-50 placeholder-zinc-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-neutral-800/50 border-b border-zinc-200 dark:border-neutral-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-neutral-400">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-neutral-400">Email</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-neutral-400">Trust Score</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-neutral-400">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-neutral-400">Roles</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-neutral-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => {
              const ur = userRoles.get(user.id) || [];
              return (
                <tr key={user.id} className="border-b border-zinc-100 dark:border-neutral-800 hover:bg-zinc-50 dark:hover:bg-neutral-800/60 transition-colors">
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-neutral-50">{user.fullName}</td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-neutral-400">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold">
                      {user.trustScore}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded-full font-medium ${
                        user.verificationStatus === 'HIGH_TRUST'
                          ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                          : user.verificationStatus === 'VERIFIED_LIBERIAN'
                            ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                            : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {user.verificationStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {ur.map((r) => (
                        <span key={r.roleId} className="inline-block px-2 py-1 text-xs rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 font-medium">
                          {roles.find((ro) => ro.id === r.roleId)?.name || 'Unknown'}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        setSelectedUserId(selectedUserId === user.id ? null : user.id);
                        if (selectedUserId !== user.id) {
                          loadUserRoles(user.id);
                        }
                      }}
                      className="text-emerald-600 hover:underline font-medium"
                    >
                      {selectedUserId === user.id ? 'Hide' : 'Manage'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Role Management Panel */}
      {selectedUserId && (
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-6">
          <h3 className="font-semibold text-base text-zinc-900 dark:text-neutral-50 mb-4">
            Role Management — {users.find((u) => u.id === selectedUserId)?.fullName}
          </h3>

          {/* Current Roles */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-zinc-700 dark:text-neutral-300 mb-2">Current Roles</p>
            {(userRoles.get(selectedUserId) || []).length === 0 ? (
              <p className="text-zinc-500 dark:text-neutral-400 text-sm">No roles assigned</p>
            ) : (
              <div className="space-y-2">
                {(userRoles.get(selectedUserId) || []).map((ur) => {
                  const role = roles.find((r) => r.id === ur.roleId);
                  return (
                    <div key={ur.roleId} className="flex justify-between items-center bg-white dark:bg-neutral-900 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800">
                      <div>
                        <p className="font-medium text-zinc-900 dark:text-neutral-50 text-sm">{role?.name}</p>
                        {ur.expiresAt && (
                          <p className="text-xs text-zinc-500 dark:text-neutral-400">
                            Expires: {new Date(ur.expiresAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveRole(selectedUserId, ur.roleId)}
                        className="text-red-600 dark:text-red-400 hover:underline text-xs font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Assign Role */}
          <div>
            <p className="text-sm font-semibold text-zinc-700 dark:text-neutral-300 mb-2">Assign Role</p>
            <div className="space-y-2">
              {roles
                .filter((r) => !userRoles.get(selectedUserId)?.some((ur) => ur.roleId === r.id))
                .map((role) => (
                  <div key={role.id} className="flex justify-between items-center bg-white dark:bg-neutral-900 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-neutral-50 text-sm">{role.name}</p>
                      <p className="text-xs text-zinc-500 dark:text-neutral-400">{role.description}</p>
                    </div>
                    <button
                      onClick={() => handleAssignRole(selectedUserId, role.id)}
                      className="text-emerald-600 dark:text-emerald-400 hover:underline text-xs font-semibold"
                    >
                      Assign
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setPage(Math.max(0, page - 1))}
          disabled={page === 0}
          className="px-4 py-2 bg-zinc-100 dark:bg-neutral-800 text-zinc-900 dark:text-neutral-50 rounded-xl border border-zinc-200 dark:border-neutral-700 text-sm font-medium disabled:opacity-40"
        >
          Previous
        </button>
        <span className="text-sm text-zinc-500 dark:text-neutral-400">
          Page {page + 1} of {Math.ceil(filtered.length / pageSize)}
        </span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={filtered.length < pageSize}
          className="px-4 py-2 bg-zinc-100 dark:bg-neutral-800 text-zinc-900 dark:text-neutral-50 rounded-xl border border-zinc-200 dark:border-neutral-700 text-sm font-medium disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
