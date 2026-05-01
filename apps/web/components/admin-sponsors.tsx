'use client';

import { useEffect, useState } from 'react';
import { apiDelete, apiGet, apiPatch, apiPost } from '../lib/api';
import { useAuthStore } from '../lib/store';

type Sponsor = {
  id: string;
  name: string;
  logoUrl: string;
  websiteUrl?: string | null;
  type: string;
  displayOrder: number;
  isActive: boolean;
};

const EMPTY_FORM = {
  name: '',
  logoUrl: '',
  websiteUrl: '',
  type: 'sponsor',
  displayOrder: 0,
  isActive: true,
};

export function AdminSponsors() {
  const token = useAuthStore((s) => s.token);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Sponsor>>({});

  useEffect(() => {
    if (!token) return;
    void load();
  }, [token]);

  async function load() {
    if (!token) return;
    setLoading(true);
    try {
      const data = await apiGet<Sponsor[]>('/admin/sponsors', token);
      setSponsors(data);
    } catch {
      setError('Failed to load sponsors');
    } finally {
      setLoading(false);
    }
  }

  async function create() {
    if (!token || !form.name || !form.logoUrl) return;
    setSaving(true);
    setError(null);
    try {
      await apiPost('/admin/sponsors', {
        ...form,
        websiteUrl: form.websiteUrl || undefined,
        displayOrder: Number(form.displayOrder),
      }, token);
      setForm(EMPTY_FORM);
      await load();
    } catch {
      setError('Failed to create sponsor');
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit(id: string) {
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      await apiPatch(`/admin/sponsors/${id}`, {
        ...editForm,
        websiteUrl: editForm.websiteUrl || undefined,
        displayOrder: editForm.displayOrder !== undefined ? Number(editForm.displayOrder) : undefined,
      }, token);
      setEditingId(null);
      setEditForm({});
      await load();
    } catch {
      setError('Failed to update sponsor');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!token) return;
    if (!confirm('Delete this sponsor?')) return;
    try {
      await apiDelete(`/admin/sponsors/${id}`, token);
      setSponsors((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setError('Failed to delete sponsor');
    }
  }

  function startEdit(s: Sponsor) {
    setEditingId(s.id);
    setEditForm({
      name: s.name,
      logoUrl: s.logoUrl,
      websiteUrl: s.websiteUrl ?? '',
      type: s.type,
      displayOrder: s.displayOrder,
      isActive: s.isActive,
    });
  }

  const inputCls =
    'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-50 dark:placeholder-neutral-500';

  return (
    <div className="space-y-6">
      {/* Add form */}
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
        <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-neutral-50">Add sponsor / partner</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Name *"
            className={inputCls}
          />
          <input
            value={form.logoUrl}
            onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
            placeholder="Logo URL *"
            className={inputCls}
          />
          <input
            value={form.websiteUrl}
            onChange={(e) => setForm((f) => ({ ...f, websiteUrl: e.target.value }))}
            placeholder="Website URL (optional)"
            className={inputCls}
          />
          <select
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            className={inputCls}
          >
            <option value="sponsor">Sponsor</option>
            <option value="partner">Partner</option>
          </select>
          <input
            type="number"
            value={form.displayOrder}
            onChange={(e) => setForm((f) => ({ ...f, displayOrder: Number(e.target.value) }))}
            placeholder="Display order"
            className={inputCls}
          />
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-neutral-300">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              className="accent-emerald-500"
            />
            Active
          </label>
        </div>
        <button
          type="button"
          onClick={create}
          disabled={saving || !form.name || !form.logoUrl}
          className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {saving ? 'Adding…' : 'Add'}
        </button>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">{error}</p>
      )}

      {/* List */}
      {loading ? (
        <p className="text-sm text-zinc-500 dark:text-neutral-400">Loading…</p>
      ) : sponsors.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-neutral-400">No sponsors yet.</p>
      ) : (
        <ul className="space-y-2">
          {sponsors.map((s) => (
            <li
              key={s.id}
              className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-900"
            >
              {editingId === s.id ? (
                <div className="space-y-2">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      value={editForm.name ?? ''}
                      onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Name"
                      className={inputCls}
                    />
                    <input
                      value={editForm.logoUrl ?? ''}
                      onChange={(e) => setEditForm((f) => ({ ...f, logoUrl: e.target.value }))}
                      placeholder="Logo URL"
                      className={inputCls}
                    />
                    <input
                      value={editForm.websiteUrl ?? ''}
                      onChange={(e) => setEditForm((f) => ({ ...f, websiteUrl: e.target.value }))}
                      placeholder="Website URL"
                      className={inputCls}
                    />
                    <select
                      value={editForm.type ?? 'sponsor'}
                      onChange={(e) => setEditForm((f) => ({ ...f, type: e.target.value }))}
                      className={inputCls}
                    >
                      <option value="sponsor">Sponsor</option>
                      <option value="partner">Partner</option>
                    </select>
                    <input
                      type="number"
                      value={editForm.displayOrder ?? 0}
                      onChange={(e) => setEditForm((f) => ({ ...f, displayOrder: Number(e.target.value) }))}
                      placeholder="Display order"
                      className={inputCls}
                    />
                    <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-neutral-300">
                      <input
                        type="checkbox"
                        checked={editForm.isActive ?? true}
                        onChange={(e) => setEditForm((f) => ({ ...f, isActive: e.target.checked }))}
                        className="accent-emerald-500"
                      />
                      Active
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => saveEdit(s.id)}
                      disabled={saving}
                      className="rounded-lg bg-emerald-600 px-3 py-1 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEditingId(null); setEditForm({}); }}
                      className="rounded-lg border border-zinc-300 px-3 py-1 text-sm text-zinc-700 hover:bg-zinc-100 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.logoUrl} alt={s.name} className="h-8 w-16 object-contain" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-900 dark:text-neutral-50">{s.name}</p>
                      <p className="text-xs text-zinc-500 dark:text-neutral-400">
                        {s.type} · order {s.displayOrder} · {s.isActive ? 'active' : 'inactive'}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(s)}
                      className="rounded-lg border border-zinc-300 px-3 py-1 text-xs text-zinc-700 hover:bg-zinc-100 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(s.id)}
                      className="rounded-lg border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
