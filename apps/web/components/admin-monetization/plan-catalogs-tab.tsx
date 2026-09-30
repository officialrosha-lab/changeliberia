'use client';

import { useState } from 'react';
import { PlanCatalogPanel, PlanField, PlanRow } from './plan-catalog-panel';

const INTERVAL_OPTIONS = [
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'YEARLY', label: 'Yearly' },
];

const tagsField: Pick<PlanField, 'toApiValue' | 'fromApiValue'> = {
  toApiValue: (raw) =>
    raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  fromApiValue: (value) => (Array.isArray(value) ? value.join(', ') : ''),
};

const datetimeField: Pick<PlanField, 'toApiValue' | 'fromApiValue'> = {
  toApiValue: (raw) => (raw ? new Date(raw).toISOString() : undefined),
  fromApiValue: (value) =>
    typeof value === 'string' ? new Date(value).toISOString().slice(0, 16) : '',
};

function priceCell(row: PlanRow, key: string): string {
  if (key !== 'priceAmount') return String(row[key] ?? '—');
  const amount = row.priceAmount;
  if (amount === null || amount === undefined) return 'Free';
  const currency = typeof row.currency === 'string' ? row.currency : 'USD';
  return `${currency} ${String(amount)}`;
}

const CATALOGS = [
  {
    key: 'membership',
    label: 'Membership',
    title: 'Membership plans',
    description: 'Individual paid supporter tiers — separate from the free Membership advocate list.',
    listPath: '/admin/memberships/plans',
    createPath: '/admin/memberships/plans',
    updatePath: (id: string) => `/admin/memberships/plans/${id}`,
    columns: ['key', 'name', 'priceAmount', 'interval'],
    createFields: [
      { key: 'key', label: 'Key (e.g. SUPPORTER_MONTHLY)', type: 'text', required: true },
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'priceAmount', label: 'Price', type: 'number', step: '0.01', required: true },
      { key: 'currency', label: 'Currency (default USD)', type: 'text' },
      { key: 'interval', label: 'Billing interval', type: 'select', options: INTERVAL_OPTIONS, required: true },
      { key: 'entitlementKeys', label: 'Entitlement keys', type: 'tags', ...tagsField },
    ] as PlanField[],
  },
  {
    key: 'workspace',
    label: 'Workspace (Org/Institution)',
    title: 'Workspace plans',
    description: 'Shared catalog for paid Organization and Institution workspace tooling.',
    listPath: '/admin/workspace-plans',
    createPath: '/admin/workspace-plans',
    updatePath: (id: string) => `/admin/workspace-plans/${id}`,
    columns: ['key', 'name', 'scope', 'priceAmount', 'interval', 'seatLimit'],
    createFields: [
      { key: 'key', label: 'Key (e.g. ORG_TEAM_MONTHLY)', type: 'text', required: true },
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      {
        key: 'scope',
        label: 'Scope',
        type: 'select',
        required: true,
        options: [
          { value: 'ORGANIZATION', label: 'Organization' },
          { value: 'INSTITUTION', label: 'Institution' },
        ],
      },
      { key: 'priceAmount', label: 'Price', type: 'number', step: '0.01', required: true },
      { key: 'currency', label: 'Currency (default USD)', type: 'text' },
      { key: 'interval', label: 'Billing interval', type: 'select', options: INTERVAL_OPTIONS, required: true },
      { key: 'seatLimit', label: 'Seat limit (blank = unlimited)', type: 'number' },
      { key: 'entitlementKeys', label: 'Entitlement keys', type: 'tags', ...tagsField },
    ] as PlanField[],
  },
  {
    key: 'sponsorship',
    label: 'Sponsorship',
    title: 'Sponsorship packages',
    description: 'Paid logo-wall placements. A completed purchase is fulfilled by linking it to a Sponsor entry.',
    listPath: '/admin/sponsorships/packages',
    createPath: '/admin/sponsorships/packages',
    updatePath: (id: string) => `/admin/sponsorships/packages/${id}`,
    columns: ['key', 'name', 'priceAmount', 'durationDays'],
    createFields: [
      { key: 'key', label: 'Key', type: 'text', required: true },
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'priceAmount', label: 'Price', type: 'number', step: '0.01', required: true },
      { key: 'currency', label: 'Currency (default USD)', type: 'text' },
      { key: 'durationDays', label: 'Duration (days)', type: 'number', required: true },
    ] as PlanField[],
  },
  {
    key: 'research',
    label: 'Research',
    title: 'Research products',
    description: 'Paid reports. fileUrl is only ever returned to a completed purchaser.',
    listPath: '/admin/research-products',
    createPath: '/admin/research-products',
    updatePath: (id: string) => `/admin/research-products/${id}`,
    columns: ['key', 'title', 'priceAmount'],
    createFields: [
      { key: 'key', label: 'Key', type: 'text', required: true },
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'priceAmount', label: 'Price', type: 'number', step: '0.01', required: true },
      { key: 'currency', label: 'Currency (default USD)', type: 'text' },
      { key: 'fileUrl', label: 'File URL (gated download)', type: 'text' },
    ] as PlanField[],
  },
  {
    key: 'events',
    label: 'Events',
    title: 'Events',
    description: 'Leave price blank for a free event — registration completes instantly with no checkout.',
    listPath: '/admin/events',
    createPath: '/admin/events',
    updatePath: (id: string) => `/admin/events/${id}`,
    columns: ['key', 'title', 'startsAt', 'priceAmount', 'capacity'],
    createFields: [
      { key: 'key', label: 'Key', type: 'text', required: true },
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'startsAt', label: 'Starts at', type: 'datetime-local', required: true, ...datetimeField },
      { key: 'endsAt', label: 'Ends at', type: 'datetime-local', required: true, ...datetimeField },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'priceAmount', label: 'Price (blank = free)', type: 'number', step: '0.01' },
      { key: 'currency', label: 'Currency (default USD)', type: 'text' },
      { key: 'capacity', label: 'Capacity (blank = unlimited)', type: 'number' },
    ] as PlanField[],
  },
  {
    key: 'api',
    label: 'API Billing',
    title: 'API plans',
    description: 'Paid API access tiers with a daily request quota.',
    listPath: '/admin/api-plans',
    createPath: '/admin/api-plans',
    updatePath: (id: string) => `/admin/api-plans/${id}`,
    columns: ['key', 'name', 'priceAmount', 'interval', 'requestsPerDay'],
    createFields: [
      { key: 'key', label: 'Key', type: 'text', required: true },
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'priceAmount', label: 'Price', type: 'number', step: '0.01', required: true },
      { key: 'currency', label: 'Currency (default USD)', type: 'text' },
      { key: 'interval', label: 'Billing interval', type: 'select', options: INTERVAL_OPTIONS, required: true },
      { key: 'requestsPerDay', label: 'Requests per day', type: 'number', required: true },
      { key: 'entitlementKeys', label: 'Entitlement keys', type: 'tags', ...tagsField },
    ] as PlanField[],
  },
] as const;

export function PlanCatalogsTab() {
  const [activeCatalog, setActiveCatalog] = useState<(typeof CATALOGS)[number]['key']>('membership');
  const catalog = CATALOGS.find((c) => c.key === activeCatalog) ?? CATALOGS[0];

  // Update forms drop the create-only 'key' field and reuse the rest —
  // an entitlement/price/interval change is always editable after creation.
  const updateFields = catalog.createFields.filter((f) => f.key !== 'key');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {CATALOGS.map((c) => (
          <button
            key={c.key}
            onClick={() => setActiveCatalog(c.key)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              activeCatalog === c.key
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <PlanCatalogPanel
        title={catalog.title}
        description={catalog.description}
        listPath={catalog.listPath}
        createPath={catalog.createPath}
        updatePath={catalog.updatePath}
        createFields={catalog.createFields as PlanField[]}
        updateFields={updateFields}
        columns={catalog.columns as unknown as string[]}
        formatCell={priceCell}
      />
    </div>
  );
}
