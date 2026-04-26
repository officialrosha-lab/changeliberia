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
  email: boolean;
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
  const [formData, setFormData] = useState({
    fullName: '',
    bio: '',
  });

  useEffect(() => {
    if (!token) return;
    loadProfile();
  }, [token]);

  async function loadProfile() {
    try {
      setLoading(true);
      const [u, v] = await Promise.all([
        apiGet<User>('/users/me', token!),
        apiGet<VerificationStatus>('/users/me/verification-status', token!),
      ]);
      setUser(u);
      setVerification(v);
      setFormData({
        fullName: u.fullName,
        bio: u.bio || '',
      });
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
    return <div className="text-center py-8">Loading profile...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Error and Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Profile Card */}
      {user && (
        <div className="bg-white border border-zinc-200 rounded-lg p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">{user.fullName}</h2>
              <p className="text-zinc-600">{user.email}</p>
              <p className="text-sm text-zinc-500 mt-1">
                Member since {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700"
              >
                Edit Profile
              </button>
            )}
          </div>

          {/* Trust Score */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-700 font-semibold">Trust Score</p>
            <div className="flex items-center gap-4 mt-2">
              <div className="text-3xl font-bold text-blue-900">{user.trustScore}</div>
              <div className="text-sm text-blue-700">
                <p className="font-semibold">{user.verificationStatus}</p>
                <p>Your credibility on the platform</p>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          {editing && (
            <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-lg mb-4">Edit Profile</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Bio</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    rows={4}
                    placeholder="Tell us about yourself..."
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleSaveProfile}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 bg-zinc-300 text-zinc-900 rounded-lg font-medium hover:bg-zinc-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Bio */}
          {user.bio && !editing && (
            <div className="mb-6">
              <p className="text-sm font-semibold text-zinc-700 mb-2">Bio</p>
              <p className="text-zinc-600">{user.bio}</p>
            </div>
          )}
        </div>
      )}

      {/* Verification Status */}
      {verification && (
        <div className="bg-white border border-zinc-200 rounded-lg p-6">
          <h3 className="font-semibold text-lg mb-4">Verification Status</h3>
          <div className="space-y-3">
            {[
              { key: 'email', label: 'Email Verified', icon: '✉️' },
              { key: 'phone', label: 'Phone Verified', icon: '📱' },
              { key: 'device', label: 'Device Verified', icon: '💻' },
              { key: 'idDocument', label: 'ID Document Verified', icon: '🆔' },
            ].map((item) => (
              <div
                key={item.key}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  verification[item.key as keyof VerificationStatus]
                    ? 'bg-green-50 border-green-200'
                    : 'bg-zinc-50 border-zinc-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </div>
                <span
                  className={`text-sm font-semibold ${
                    verification[item.key as keyof VerificationStatus]
                      ? 'text-green-700'
                      : 'text-zinc-600'
                  }`}
                >
                  {verification[item.key as keyof VerificationStatus] ? '✓ Verified' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Account Settings */}
      <div className="bg-white border border-zinc-200 rounded-lg p-6">
        <h3 className="font-semibold text-lg mb-4">Account Settings</h3>
        <div className="space-y-2">
          <a
            href="/auth/change-password"
            className="block text-emerald-600 hover:underline font-medium"
          >
            Change Password
          </a>
          <a
            href="/auth/two-factor"
            className="block text-emerald-600 hover:underline font-medium"
          >
            Two-Factor Authentication
          </a>
          <a
            href="/auth/sessions"
            className="block text-emerald-600 hover:underline font-medium"
          >
            Active Sessions
          </a>
          <a
            href="/auth/privacy"
            className="block text-emerald-600 hover:underline font-medium"
          >
            Privacy Settings
          </a>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="font-semibold text-lg text-red-900 mb-4">Danger Zone</h3>
        <p className="text-sm text-red-700 mb-4">
          These actions are permanent and cannot be undone.
        </p>
        <button className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">
          Delete Account
        </button>
      </div>
    </div>
  );
}
