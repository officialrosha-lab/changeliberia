'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPatch } from '../../lib/api';
import { useAuthStore } from '../../lib/store';

interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  bio: string | null;
  avatarUrl: string | null;
  trustScore: number;
  verificationStatus: string;
  createdAt: string;
}

interface VerificationStatus {
  phone: boolean;
  geo: boolean;
  device: boolean;
  idDocument: boolean;
}

export function ProfileSettings() {
  const token = useAuthStore((s) => s.token);
  const [user, setUser] = useState<User | null>(null);
  const [verification, setVerification] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({ fullName: '', bio: '' });

  useEffect(() => {
    if (!token) return;
    loadProfile();
  }, [token]);

  async function loadProfile() {
    try {
      setLoading(true);
      const [u, v] = await Promise.all([
        apiGet<User>('/users/me', token!),
        apiGet<VerificationStatus>('/verification/completed', token!),
      ]);
      setUser(u);
      setVerification(v);
      setFormData({ fullName: u.fullName, bio: u.bio || '' });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProfile() {
    if (!token || !user) return;
    try {
      await apiPatch(`/users/${user.id}`, formData, token);
      setSuccess('Profile updated successfully!');
      setEditing(false);
      setTimeout(() => setSuccess(null), 3000);
      await loadProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    }
  }

  if (loading) {
    return <div className="py-8 text-center text-sm text-zinc-500 dark:text-neutral-400">Loading profile…</div>;
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
          {success}
        </div>
      )}

      {/* Profile Card */}
      {user && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-900">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{user.fullName}</h2>
              <p className="mt-0.5 text-sm text-zinc-600 dark:text-neutral-300">{user.email}</p>
              <p className="mt-1 text-xs text-zinc-400 dark:text-neutral-500">
                Member since {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex-shrink-0 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400"
              >
                Edit Profile
              </button>
            )}
          </div>

          {/* Trust Score */}
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/30">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-700 dark:text-emerald-400">
              Trust Score
            </p>
            <div className="mt-2 flex items-center gap-4">
              <span className="text-3xl font-bold text-emerald-900 dark:text-emerald-300">{user.trustScore}</span>
              <div className="text-sm text-emerald-800 dark:text-emerald-300">
                <p className="font-semibold">{user.verificationStatus.replaceAll('_', ' ')}</p>
                <p className="text-emerald-700 dark:text-emerald-400">Your credibility on the platform</p>
              </div>
            </div>
          </div>

          {/* Bio */}
          {user.bio && !editing && (
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500 dark:text-neutral-400">Bio</p>
              <p className="mt-1 text-sm text-zinc-700 dark:text-neutral-300">{user.bio}</p>
            </div>
          )}

          {/* Edit Form */}
          {editing && (
            <div className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-neutral-700 dark:bg-neutral-800">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.15em] text-zinc-500 dark:text-neutral-400">
                Edit Profile
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-neutral-200">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-600 dark:bg-neutral-900 dark:text-white dark:placeholder:text-neutral-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-neutral-200">Bio</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={4}
                    placeholder="Tell us about yourself…"
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-600 dark:bg-neutral-900 dark:text-white dark:placeholder:text-neutral-500"
                  />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleSaveProfile}
                  className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Verification Status */}
      {verification && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-900">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.15em] text-zinc-500 dark:text-neutral-400">
            Verification Status
          </h3>
          <div className="space-y-2">
            {([
              { key: 'phone', label: 'Phone Verified', icon: '📱' },
              { key: 'geo', label: 'Liberia Location Confirmed', icon: '📍' },
              { key: 'device', label: 'Device Linked', icon: '💻' },
              { key: 'idDocument', label: 'ID Document Submitted', icon: '🆔' },
            ] as const).map((item) => {
              const done = verification[item.key];
              return (
                <div
                  key={item.key}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                    done
                      ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30'
                      : 'border-zinc-200 bg-zinc-50 dark:border-neutral-700 dark:bg-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base">{item.icon}</span>
                    <span className={`text-sm font-semibold ${done ? 'text-emerald-900 dark:text-emerald-200' : 'text-zinc-800 dark:text-neutral-200'}`}>
                      {item.label}
                    </span>
                  </div>
                  <span className={`text-xs font-bold ${done ? 'text-emerald-700 dark:text-emerald-400' : 'text-zinc-500 dark:text-neutral-400'}`}>
                    {done ? '✓ Verified' : 'Pending'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Account Settings */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-900">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.15em] text-zinc-500 dark:text-neutral-400">
          Account Settings
        </h3>
        <div className="space-y-1">
          {[
            { href: '/auth/change-password', label: 'Change Password' },
            { href: '/auth/two-factor', label: 'Two-Factor Authentication' },
            { href: '/auth/sessions', label: 'Active Sessions' },
            { href: '/auth/privacy', label: 'Privacy Settings' },
          ].map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              {label}
              <svg className="h-4 w-4 text-zinc-400 dark:text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </a>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950/30">
        <h3 className="mb-1 text-sm font-semibold uppercase tracking-[0.15em] text-red-700 dark:text-red-400">
          Danger Zone
        </h3>
        <p className="mb-4 text-sm text-red-600 dark:text-red-400">
          These actions are permanent and cannot be undone.
        </p>
        <button className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600">
          Delete Account
        </button>
      </div>
    </div>
  );
}
