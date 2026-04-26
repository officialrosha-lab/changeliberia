'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost, apiPatch, apiDelete } from '../../lib/api';
import { useAuthStore } from '../../lib/store';

interface CMSTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  titleHint: string | null;
  descriptionHint: string | null;
  suggestedTags: string;
  suggestedCategory: string | null;
  active: boolean;
  createdAt: string;
}

export function CMSTemplateManager() {
  const token = useAuthStore((s) => s.token);
  const [templates, setTemplates] = useState<CMSTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    titleHint: '',
    descriptionHint: '',
    suggestedTags: '',
    suggestedCategory: '',
  });

  useEffect(() => {
    if (!token) return;
    loadTemplates();
  }, [token]);

  async function loadTemplates() {
    try {
      setLoading(true);
      const data = await apiGet<CMSTemplate[]>('/cms/templates', token!);
      setTemplates(data as CMSTemplate[]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!token || !formData.name.trim() || !formData.category.trim()) {
      setError('Name and category are required');
      return;
    }

    try {
      if (editingId) {
        const updated = await apiPatch<CMSTemplate>(`/cms/templates/${editingId}`, formData, token);
        setTemplates(templates.map((t) => (t.id === editingId ? updated as CMSTemplate : t)));
      } else {
        const created = await apiPost<CMSTemplate>('/cms/templates', formData, token);
        setTemplates([created as CMSTemplate, ...templates]);
      }
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save template');
    }
  }

  async function handleDelete(templateId: string) {
    if (!token || !confirm('Delete this template?')) return;
    try {
      await apiDelete(`/cms/templates/${templateId}`, token);
      setTemplates(templates.filter((t) => t.id !== templateId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete template');
    }
  }

  async function handleToggleActive(templateId: string, active: boolean) {
    if (!token) return;
    try {
      const updated = await apiPatch<CMSTemplate>(`/cms/templates/${templateId}`, { active }, token);
      setTemplates(templates.map((t) => (t.id === templateId ? updated as CMSTemplate : t)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update template');
    }
  }

  function resetForm() {
    setFormData({
      name: '',
      description: '',
      category: '',
      titleHint: '',
      descriptionHint: '',
      suggestedTags: '',
      suggestedCategory: '',
    });
    setEditingId(null);
    setShowCreateForm(false);
  }

  function editTemplate(template: CMSTemplate) {
    setFormData({
      name: template.name,
      description: template.description || '',
      category: template.category,
      titleHint: template.titleHint || '',
      descriptionHint: template.descriptionHint || '',
      suggestedTags: template.suggestedTags,
      suggestedCategory: template.suggestedCategory || '',
    });
    setEditingId(template.id);
    setShowCreateForm(true);
  }

  if (loading) {
    return <div className="text-center py-8">Loading templates...</div>;
  }

  const filtered = templates.filter((t) => {
    if (searchTerm && !t.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
    return true;
  });

  const categories = Array.from(new Set(templates.map((t) => t.category)));

  return (
    <div className="space-y-6">
      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="border border-zinc-200 rounded-lg p-4 bg-blue-50 space-y-3">
          <p className="font-semibold">{editingId ? 'Edit Template' : 'Create New Template'}</p>

          <input
            type="text"
            placeholder="Template name..."
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />

          <textarea
            placeholder="Description..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            rows={2}
          />

          <input
            type="text"
            placeholder="Category (e.g., health, infrastructure, education)..."
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />

          <input
            type="text"
            placeholder="Title hint (e.g., 'Improve X by doing Y')..."
            value={formData.titleHint}
            onChange={(e) => setFormData({ ...formData, titleHint: e.target.value })}
            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />

          <textarea
            placeholder="Description hint..."
            value={formData.descriptionHint}
            onChange={(e) => setFormData({ ...formData, descriptionHint: e.target.value })}
            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            rows={2}
          />

          <input
            type="text"
            placeholder="Suggested tags (comma-separated)..."
            value={formData.suggestedTags}
            onChange={(e) => setFormData({ ...formData, suggestedTags: e.target.value })}
            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />

          <input
            type="text"
            placeholder="Suggested category..."
            value={formData.suggestedCategory}
            onChange={(e) => setFormData({ ...formData, suggestedCategory: e.target.value })}
            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
            >
              Save Template
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-2 bg-zinc-300 text-zinc-900 rounded-lg hover:bg-zinc-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!showCreateForm && (
        <button
          onClick={() => {
            resetForm();
            setShowCreateForm(true);
          }}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
        >
          + Create New Template
        </button>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Search templates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 min-w-48 px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((template) => (
          <div key={template.id} className="border border-zinc-200 rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{template.name}</h3>
                <p className="text-sm text-zinc-600">{template.description}</p>
              </div>
              <span
                className={`inline-block px-2 py-1 text-xs rounded-full font-medium whitespace-nowrap ${
                  template.active
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {template.active ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="space-y-1 text-sm">
              <p>
                <span className="font-medium text-zinc-700">Category:</span> {template.category}
              </p>
              {template.titleHint && (
                <p>
                  <span className="font-medium text-zinc-700">Title Hint:</span> {template.titleHint}
                </p>
              )}
              {template.suggestedTags && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {JSON.parse(template.suggestedTags || '[]').map((tag: string, i: number) => (
                    <span key={i} className="px-2 py-1 text-xs rounded bg-zinc-100 text-zinc-700">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2 border-t border-zinc-200">
              <button
                onClick={() => editTemplate(template)}
                className="flex-1 text-emerald-600 hover:underline font-medium text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => handleToggleActive(template.id, !template.active)}
                className="flex-1 text-blue-600 hover:underline font-medium text-sm"
              >
                {template.active ? 'Deactivate' : 'Activate'}
              </button>
              <button
                onClick={() => handleDelete(template.id)}
                className="flex-1 text-red-600 hover:underline font-medium text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-zinc-600">No templates found</div>
      )}
    </div>
  );
}
