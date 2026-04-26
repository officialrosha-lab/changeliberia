'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost, apiPatch } from '../../lib/api';
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
      const response = await fetch(`/api/rbac/users/${userId}/roles/${roleId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to remove role');
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
          className="flex-1 px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="overflow-x-auto bg-white rounded-lg border border-zinc-200">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Name</th>
              <th className="px-4 py-3 text-left font-semibold">Email</th>
              <th className="px-4 py-3 text-left font-semibold">Trust Score</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Roles</th>
              <th className="px-4 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => {
              const ur = userRoles.get(user.id) || [];
              return (
                <tr key={user.id} className="border-b border-zinc-200 hover:bg-zinc-50">
                  <td className="px-4 py-3 font-medium">{user.fullName}</td>
                  <td className="px-4 py-3 text-zinc-600">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                      {user.trustScore}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded-full ${
                        user.verificationStatus === 'HIGH_TRUST'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {user.verificationStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {ur.map((r) => (
                        <span key={r.roleId} className="inline-block px-2 py-1 text-xs rounded bg-purple-100 text-purple-700">
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
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-lg mb-4">
            Role Management for {users.find((u) => u.id === selectedUserId)?.fullName}
          </h3>

          {/* Current Roles */}
          <div className="mb-6">
            <p className="font-semibold mb-2">Current Roles</p>
            {(userRoles.get(selectedUserId) || []).length === 0 ? (
              <p className="text-zinc-600 text-sm">No roles assigned</p>
            ) : (
              <div className="space-y-2">
                {(userRoles.get(selectedUserId) || []).map((ur) => {
                  const role = roles.find((r) => r.id === ur.roleId);
                  return (
                    <div key={ur.roleId} className="flex justify-between items-center bg-white p-3 rounded border border-blue-200">
                      <div>
                        <p className="font-medium">{role?.name}</p>
                        {ur.expiresAt && (
                          <p className="text-xs text-zinc-500">
                            Expires: {new Date(ur.expiresAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveRole(selectedUserId, ur.roleId)}
                        className="text-red-600 hover:underline text-sm font-medium"
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
            <p className="font-semibold mb-2">Assign Role</p>
            <div className="space-y-2">
              {roles
                .filter((r) => !userRoles.get(selectedUserId)?.some((ur) => ur.roleId === r.id))
                .map((role) => (
                  <div key={role.id} className="flex justify-between items-center bg-white p-3 rounded border border-blue-200">
                    <div>
                      <p className="font-medium">{role.name}</p>
                      <p className="text-xs text-zinc-500">{role.description}</p>
                    </div>
                    <button
                      onClick={() => handleAssignRole(selectedUserId, role.id)}
                      className="text-emerald-600 hover:underline text-sm font-medium"
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
          className="px-4 py-2 bg-zinc-200 text-zinc-900 rounded-lg disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-sm text-zinc-600">
          Page {page + 1} of {Math.ceil(filtered.length / pageSize)}
        </span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={filtered.length < pageSize}
          className="px-4 py-2 bg-zinc-200 text-zinc-900 rounded-lg disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
