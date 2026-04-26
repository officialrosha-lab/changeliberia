'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost, apiPatch } from '../../lib/api';
import { useAuthStore } from '../../lib/store';

interface ModeratorScope {
  moderatorId: string;
  moderatorName: string;
  allowedCategories: string[];
}

interface PermissionTemplate {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  createdAt: string;
}

interface SystemSettings {
  petitionApprovalThreshold: number;
  autoApprovalSignatureThreshold: number;
  routingDefaultPriority: string;
  emailNotificationEnabled: boolean;
  fraudDetectionLevel: string;
  maxSignaturesPerUser: number;
}

export function AdminSettings() {
  const token = useAuthStore((s) => s.token);
  const [scopes, setScopes] = useState<ModeratorScope[]>([]);
  const [templates, setTemplates] = useState<PermissionTemplate[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'scopes' | 'templates' | 'settings'>('scopes');
  const [editingScope, setEditingScope] = useState<ModeratorScope | null>(null);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplatePerms, setNewTemplatePerms] = useState<string[]>([]);

  useEffect(() => {
    if (!token) return;
    loadData();
  }, [token]);

  async function loadData() {
    try {
      setLoading(true);
      const [s, t, st] = await Promise.all([
        apiGet<ModeratorScope[]>('/admin/settings/moderator-scopes', token!),
        apiGet<PermissionTemplate[]>('/admin/settings/permission-templates', token!),
        apiGet<SystemSettings>('/admin/settings/system', token!),
      ]);
      setScopes(s);
      setTemplates(t);
      setSettings(st);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveScope(scope: ModeratorScope) {
    if (!token) return;
    try {
      await apiPost(`/admin/settings/moderator-scopes/${scope.moderatorId}`, scope, token);
      setEditingScope(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save scope');
    }
  }

  async function handleCreateTemplate() {
    if (!token || !newTemplateName.trim()) return;
    try {
      await apiPost(
        '/admin/settings/permission-templates',
        { name: newTemplateName, permissions: newTemplatePerms },
        token
      );
      setNewTemplateName('');
      setNewTemplatePerms([]);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create template');
    }
  }

  async function handleDeleteTemplate(id: string) {
    if (!token) return;
    try {
      const response = await fetch(`/api/admin/settings/permission-templates/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to delete template');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete template');
    }
  }

  async function handleSaveSettings(newSettings: SystemSettings) {
    if (!token) return;
    try {
      await apiPatch('/admin/settings/system', newSettings, token);
      setSettings(newSettings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading settings...</div>;
  }

  const categoryOptions = ['HEALTH', 'EDUCATION', 'AGENCY', 'MINISTRY', 'SECURITY', 'UTILITY', 'NGO'];
  const allPermissions = [
    'petition:create',
    'petition:read',
    'petition:update',
    'petition:delete',
    'petition:approve',
    'petition:reject',
    'directory:create',
    'directory:read',
    'directory:update',
    'directory:delete',
    'institution:create',
    'institution:read',
    'institution:update',
    'institution:delete',
    'user:read',
    'user:update',
    'routing:read',
    'routing:override',
    'content:read',
    'content:update',
    'analytics:read',
    'role:create',
    'role:read',
    'role:update',
    'role:delete',
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-zinc-200">
        {(
          [
            ['scopes', 'Moderator Scopes'],
            ['templates', 'Permission Templates'],
            ['settings', 'System Settings'],
          ] as const
        ).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-zinc-600 hover:text-zinc-900'
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

      {/* Moderator Scopes Tab */}
      {activeTab === 'scopes' && (
        <div className="space-y-4">
          <p className="text-zinc-600 text-sm">
            Restrict moderators to specific petition categories. Unset means moderators can approve all.
          </p>

          {scopes.map((scope) => (
            <div
              key={scope.moderatorId}
              className="border border-zinc-200 rounded-lg p-4 space-y-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{scope.moderatorName}</p>
                  <p className="text-xs text-zinc-500">ID: {scope.moderatorId}</p>
                </div>
                <button
                  onClick={() => setEditingScope(editingScope?.moderatorId === scope.moderatorId ? null : scope)}
                  className="text-emerald-600 hover:underline font-medium"
                >
                  {editingScope?.moderatorId === scope.moderatorId ? 'Done' : 'Edit'}
                </button>
              </div>

              {editingScope?.moderatorId === scope.moderatorId ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Allowed Categories</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {categoryOptions.map((cat) => (
                      <label key={cat} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editingScope.allowedCategories.includes(cat)}
                          onChange={(e) => {
                            setEditingScope({
                              ...editingScope,
                              allowedCategories: e.target.checked
                                ? [...editingScope.allowedCategories, cat]
                                : editingScope.allowedCategories.filter((c) => c !== cat),
                            });
                          }}
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-sm">{cat}</span>
                      </label>
                    ))}
                  </div>
                  <button
                    onClick={() => handleSaveScope(editingScope)}
                    className="mt-3 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-zinc-600">
                    {editingScope?.allowedCategories.length === 0
                      ? 'All categories'
                      : editingScope?.allowedCategories.join(', ')}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Permission Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="border border-zinc-200 rounded-lg p-4 space-y-3 bg-blue-50">
            <p className="font-semibold">Create New Template</p>
            <input
              type="text"
              placeholder="Template name (e.g., 'Moderator Lite')"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <div className="max-h-48 overflow-y-auto space-y-1 bg-white p-3 rounded border border-zinc-200">
              {allPermissions.map((perm) => (
                <label key={perm} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newTemplatePerms.includes(perm)}
                    onChange={(e) => {
                      setNewTemplatePerms(
                        e.target.checked
                          ? [...newTemplatePerms, perm]
                          : newTemplatePerms.filter((p) => p !== perm)
                      );
                    }}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm font-mono">{perm}</span>
                </label>
              ))}
            </div>
            <button
              onClick={handleCreateTemplate}
              disabled={!newTemplateName.trim()}
              className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              Create Template
            </button>
          </div>

          <div className="space-y-2">
            {templates.map((template) => (
              <div key={template.id} className="border border-zinc-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold">{template.name}</p>
                    <p className="text-xs text-zinc-600">
                      {template.permissions.length} permissions • Created{' '}
                      {new Date(template.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="text-red-600 hover:underline text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {template.permissions.map((perm) => (
                    <span
                      key={perm}
                      className="inline-block px-2 py-1 text-xs rounded bg-zinc-100 text-zinc-700 font-mono"
                    >
                      {perm}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Settings Tab */}
      {activeTab === 'settings' && settings && (
        <div className="space-y-4">
          <div className="border border-zinc-200 rounded-lg p-4 space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">
                Petition Approval Threshold (signatures required)
              </label>
              <input
                type="number"
                value={settings.petitionApprovalThreshold}
                onChange={(e) =>
                  setSettings({ ...settings, petitionApprovalThreshold: parseInt(e.target.value) })
                }
                min={1}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Auto-Approval Signature Threshold
              </label>
              <input
                type="number"
                value={settings.autoApprovalSignatureThreshold}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    autoApprovalSignatureThreshold: parseInt(e.target.value),
                  })
                }
                min={0}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Default Routing Priority
              </label>
              <select
                value={settings.routingDefaultPriority}
                onChange={(e) =>
                  setSettings({ ...settings, routingDefaultPriority: e.target.value })
                }
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option>TAG_MATCH</option>
                <option>CATEGORY_MATCH</option>
                <option>PRIMARY</option>
                <option>FALLBACK</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Fraud Detection Level</label>
              <select
                value={settings.fraudDetectionLevel}
                onChange={(e) =>
                  setSettings({ ...settings, fraudDetectionLevel: e.target.value })
                }
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="LOW">Low (minimal checks)</option>
                <option value="MEDIUM">Medium (standard checks)</option>
                <option value="HIGH">High (strict checks)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Max Signatures Per User
              </label>
              <input
                type="number"
                value={settings.maxSignaturesPerUser}
                onChange={(e) =>
                  setSettings({ ...settings, maxSignaturesPerUser: parseInt(e.target.value) })
                }
                min={1}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                checked={settings.emailNotificationEnabled}
                onChange={(e) =>
                  setSettings({ ...settings, emailNotificationEnabled: e.target.checked })
                }
                className="w-4 h-4 rounded"
              />
              <label className="text-sm font-semibold">Enable Email Notifications</label>
            </div>

            <button
              onClick={() => handleSaveSettings(settings)}
              className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              Save Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
