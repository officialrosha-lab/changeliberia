'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPatch, apiPost } from '../lib/api';
import { useAuthStore } from '../lib/store';

const STAFF_ROLES = [
  { value: 'CHIEF_OF_STAFF', label: 'Chief of Staff' },
  { value: 'LEGISLATIVE_ASSISTANT', label: 'Legislative Assistant' },
  { value: 'COMMUNICATIONS_OFFICER', label: 'Communications Officer' },
  { value: 'POLICY_ADVISOR', label: 'Policy Advisor' },
  { value: 'RESEARCH_OFFICER', label: 'Research Officer' },
  { value: 'CASE_MANAGER', label: 'Case Manager' },
] as const;

const PERMISSION_FLAGS = [
  { key: 'canDraft', label: 'Draft responses' },
  { key: 'canRespond', label: 'Publish responses' },
  { key: 'canManageInbox', label: 'Manage inbox' },
  { key: 'canGenerateReports', label: 'Generate reports' },
] as const;

interface StaffMember {
  id: string;
  role: string;
  status: string;
  canView: boolean;
  canDraft: boolean;
  canRespond: boolean;
  canManageInbox: boolean;
  canGenerateReports: boolean;
  user: { id: string; fullName: string; phone: string; email: string | null };
}

export function OfficialStaffPanel() {
  const token = useAuthStore((s) => s.token);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<(typeof STAFF_ROLES)[number]['value']>('LEGISLATIVE_ASSISTANT');
  const [permissions, setPermissions] = useState<Record<string, boolean>>({
    canDraft: false,
    canRespond: false,
    canManageInbox: false,
    canGenerateReports: false,
  });
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<StaffMember[]>('/officials/staff', token);
      setStaff(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function invite() {
    if (!token || !phone.trim()) return;
    setInviting(true);
    setInviteError(null);
    try {
      await apiPost('/officials/staff/invite', { phone: phone.trim(), role, ...permissions }, token);
      setPhone('');
      setPermissions({ canDraft: false, canRespond: false, canManageInbox: false, canGenerateReports: false });
      await load();
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Failed to invite staff member');
    } finally {
      setInviting(false);
    }
  }

  async function togglePermission(member: StaffMember, key: string) {
    if (!token) return;
    setBusyId(member.id);
    try {
      await apiPatch(`/officials/staff/${member.id}`, { [key]: !(member as any)[key] }, token);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function revoke(member: StaffMember) {
    if (!token) return;
    setBusyId(member.id);
    try {
      await apiPost(`/officials/staff/${member.id}/revoke`, {}, token);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-zinc-900">Office Staff</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Invite Chief of Staff, Legislative Assistants, and other delegated staff to help manage your office.
        </p>
      </div>

      <div className="rounded-3xl border border-zinc-200 p-5">
        <h3 className="text-lg font-semibold text-zinc-900">Invite staff</h3>
        <p className="mt-1 text-xs text-zinc-500">
          The invitee must already have a Change Liberia account (looked up by phone number).
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number, e.g. +231770000000"
            className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as typeof role)}
            className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm"
          >
            {STAFF_ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-3 flex flex-wrap gap-3">
          {PERMISSION_FLAGS.map((p) => (
            <label key={p.key} className="flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={permissions[p.key]}
                onChange={(e) => setPermissions((prev) => ({ ...prev, [p.key]: e.target.checked }))}
                className="h-4 w-4 rounded accent-emerald-600"
              />
              {p.label}
            </label>
          ))}
        </div>
        {inviteError && <p className="mt-2 text-xs text-red-600">{inviteError}</p>}
        <button
          type="button"
          disabled={inviting || !phone.trim()}
          onClick={() => void invite()}
          className="mt-4 inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {inviting ? 'Sending…' : 'Send invite'}
        </button>
      </div>

      {loading && <p className="text-sm text-zinc-500">Loading staff…</p>}
      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {!loading && !error && (
        <div className="space-y-3">
          {staff.length === 0 && <p className="text-sm text-zinc-500">No staff invited yet.</p>}
          {staff.map((member) => (
            <div key={member.id} className="rounded-2xl border border-zinc-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-zinc-900">{member.user.fullName}</p>
                  <p className="text-xs text-zinc-500">
                    {STAFF_ROLES.find((r) => r.value === member.role)?.label ?? member.role} · {member.user.phone}
                  </p>
                  <span
                    className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                      member.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {member.status === 'ACTIVE' ? 'Active' : 'Invited (pending acceptance)'}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={busyId === member.id}
                  onClick={() => void revoke(member)}
                  className="rounded-full border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  Revoke
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-3">
                {PERMISSION_FLAGS.map((p) => (
                  <label key={p.key} className="flex items-center gap-2 text-xs text-zinc-600">
                    <input
                      type="checkbox"
                      disabled={busyId === member.id}
                      checked={(member as any)[p.key]}
                      onChange={() => void togglePermission(member, p.key)}
                      className="h-4 w-4 rounded accent-emerald-600"
                    />
                    {p.label}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
