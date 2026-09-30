'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiGet, apiPatch, apiPost } from '../../lib/api';
import { useAuthStore } from '../../lib/store';

export type PlanFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'datetime-local'
  | 'tags';

export interface PlanField {
  key: string;
  label: string;
  type: PlanFieldType;
  options?: { value: string; label: string }[];
  required?: boolean;
  step?: string;
  placeholder?: string;
  // Converts the raw form value into what the API expects (e.g. a
  // datetime-local string into an ISO timestamp, or a comma-separated
  // string into a string[] for entitlementKeys).
  toApiValue?: (raw: string) => unknown;
  // Reverses toApiValue for pre-filling the edit form from a loaded row.
  fromApiValue?: (value: unknown) => string;
}

export interface PlanRow {
  id: string;
  active?: boolean;
  [key: string]: unknown;
}

interface PlanCatalogPanelProps {
  title: string;
  description?: string;
  listPath: string;
  createPath: string;
  updatePath: (id: string) => string;
  createFields: PlanField[];
  updateFields: PlanField[];
  // Which fields (by key) to show as table columns, in order.
  columns: string[];
  formatCell?: (row: PlanRow, key: string) => string;
}

function defaultToDisplay(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}

function inputClass() {
  return 'px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:placeholder-neutral-500';
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: PlanField;
  value: string;
  onChange: (v: string) => void;
}) {
  if (field.type === 'textarea') {
    return (
      <textarea
        placeholder={field.placeholder ?? field.label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`col-span-full ${inputClass()}`}
        rows={3}
      />
    );
  }
  if (field.type === 'select') {
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass()}>
        <option value="">{field.placeholder ?? `Select ${field.label}`}</option>
        {field.options?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }
  if (field.type === 'number') {
    return (
      <input
        type="number"
        step={field.step ?? '1'}
        placeholder={field.placeholder ?? field.label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass()}
      />
    );
  }
  if (field.type === 'datetime-local') {
    return (
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass()}
      />
    );
  }
  return (
    <input
      type="text"
      placeholder={field.placeholder ?? (field.type === 'tags' ? `${field.label} (comma-separated)` : field.label)}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={inputClass()}
    />
  );
}

function buildApiPayload(fields: PlanField[], values: Record<string, string>) {
  const payload: Record<string, unknown> = {};
  for (const field of fields) {
    const raw = values[field.key] ?? '';
    if (raw === '' && !field.required) continue;
    if (field.toApiValue) {
      payload[field.key] = field.toApiValue(raw);
      continue;
    }
    if (field.type === 'number') {
      payload[field.key] = raw === '' ? undefined : Number(raw);
    } else {
      payload[field.key] = raw;
    }
  }
  return payload;
}

/**
 * Generic list + create + edit + active-toggle UI over one of the six
 * near-identical plan/product catalogs (Membership, Workspace, Sponsorship
 * Package, Research Product, Event, API Plan). Deliberately one shared
 * component rather than six hand-written near-duplicates — this is a
 * presentation-layer form renderer, not a domain model, so it doesn't carry
 * the same "don't conflate distinct products" concern the schema comments
 * raise about WorkspacePlan/MembershipPlan. Each catalog supplies its own
 * field spec; the six product-specific shapes never get merged into one.
 */
export function PlanCatalogPanel({
  title,
  description,
  listPath,
  createPath,
  updatePath,
  createFields,
  updateFields,
  columns,
  formatCell,
}: PlanCatalogPanelProps) {
  const token = useAuthStore((s) => s.token);
  const [rows, setRows] = useState<PlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createValues, setCreateValues] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await apiGet<PlanRow[]>(listPath, token);
      setRows(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [token, listPath]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate() {
    if (!token) return;
    try {
      await apiPost(createPath, buildApiPayload(createFields, createValues), token);
      setCreateValues({});
      setShowCreate(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create');
    }
  }

  function startEdit(row: PlanRow) {
    const values: Record<string, string> = {};
    for (const field of updateFields) {
      const raw = row[field.key];
      values[field.key] = field.fromApiValue ? field.fromApiValue(raw) : defaultToDisplay(raw) === '—' ? '' : String(raw ?? '');
    }
    setEditValues(values);
    setEditingId(row.id);
  }

  async function handleSaveEdit(id: string) {
    if (!token) return;
    try {
      await apiPatch(updatePath(id), buildApiPayload(updateFields, editValues), token);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
  }

  async function handleToggleActive(row: PlanRow) {
    if (!token) return;
    try {
      await apiPatch(updatePath(row.id), { active: !row.active }, token);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    }
  }

  if (loading) {
    return <div className="py-8 text-center dark:text-neutral-300">Loading {title.toLowerCase()}…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold dark:text-white">{title}</h3>
          {description && <p className="mt-1 text-sm text-zinc-500 dark:text-neutral-400">{description}</p>}
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="whitespace-nowrap rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white transition-colors hover:bg-emerald-700"
        >
          {showCreate ? 'Cancel' : `Add ${title}`}
        </button>
      </div>

      {showCreate && (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-6 dark:border-neutral-700 dark:bg-neutral-800">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {createFields.map((field) => (
              <div key={field.key} className={field.type === 'textarea' ? 'col-span-full' : ''}>
                <FieldInput
                  field={field}
                  value={createValues[field.key] ?? ''}
                  onChange={(v) => setCreateValues((s) => ({ ...s, [field.key]: v }))}
                />
              </div>
            ))}
          </div>
          <button
            onClick={() => void handleCreate()}
            className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white transition-colors hover:bg-emerald-700"
          >
            Create
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-neutral-700 dark:bg-neutral-800">
            <tr>
              {columns.map((key) => (
                <th key={key} className="px-4 py-3 text-left font-semibold dark:text-white">
                  {createFields.find((f) => f.key === key)?.label ?? key}
                </th>
              ))}
              <th className="px-4 py-3 text-left font-semibold dark:text-white">Status</th>
              <th className="px-4 py-3 text-left font-semibold dark:text-white">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) =>
              editingId === row.id ? (
                <tr key={row.id} className="border-b border-zinc-200 dark:border-neutral-800">
                  <td colSpan={columns.length + 2} className="px-4 py-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {updateFields.map((field) => (
                        <div key={field.key} className={field.type === 'textarea' ? 'col-span-full' : ''}>
                          <FieldInput
                            field={field}
                            value={editValues[field.key] ?? ''}
                            onChange={(v) => setEditValues((s) => ({ ...s, [field.key]: v }))}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 space-x-3">
                      <button
                        onClick={() => void handleSaveEdit(row.id)}
                        className="font-medium text-emerald-600 hover:underline dark:text-emerald-400"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="font-medium text-zinc-500 hover:underline dark:text-neutral-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={row.id} className="border-b border-zinc-200 hover:bg-zinc-50 dark:border-neutral-800 dark:hover:bg-neutral-800">
                  {columns.map((key) => (
                    <td key={key} className="px-4 py-3 dark:text-neutral-300">
                      {formatCell ? formatCell(row, key) : defaultToDisplay(row[key])}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    {row.active ? (
                      <span className="inline-block rounded-full bg-green-100 px-2 py-1 text-xs text-green-700 dark:bg-emerald-900 dark:text-emerald-300">
                        Active
                      </span>
                    ) : (
                      <span className="inline-block rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-600 dark:bg-neutral-800 dark:text-neutral-400">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="space-x-3 px-4 py-3">
                    <button
                      onClick={() => startEdit(row)}
                      className="font-medium text-emerald-600 hover:underline dark:text-emerald-400"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => void handleToggleActive(row)}
                      className="font-medium text-zinc-600 hover:underline dark:text-neutral-300"
                    >
                      {row.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ),
            )}
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length + 2} className="px-4 py-8 text-center text-zinc-500 dark:text-neutral-400">
                  Nothing here yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
