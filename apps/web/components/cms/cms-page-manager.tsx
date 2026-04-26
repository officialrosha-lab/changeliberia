'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost, apiPatch, apiDelete } from '../../lib/api';
import { useAuthStore } from '../../lib/store';

interface CMSPage {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  publishedAt: string | null;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export function CMSPageManager() {
  const token = useAuthStore((s) => s.token);
  const [pages, setPages] = useState<CMSPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageSlug, setNewPageSlug] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPublished, setFilterPublished] = useState<'all' | 'published' | 'draft'>('all');

  useEffect(() => {
    if (!token) return;
    loadPages();
  }, [token]);

  async function loadPages() {
    try {
      setLoading(true);
      const data = await apiGet<CMSPage[]>('/cms/pages', token!);
      setPages(data as CMSPage[]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pages');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreatePage() {
    if (!token || !newPageTitle.trim() || !newPageSlug.trim()) {
      setError('Title and slug are required');
      return;
    }

    try {
      const newPage = await apiPost<CMSPage>(
        '/cms/pages',
        { title: newPageTitle, slug: newPageSlug, content: '' },
        token
      );
      setPages([newPage as CMSPage, ...pages]);
      setNewPageTitle('');
      setNewPageSlug('');
      setShowCreateForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create page');
    }
  }

  async function handlePublish(pageId: string, published: boolean) {
    if (!token) return;
    try {
      const updated = await apiPatch<CMSPage>(
        `/cms/pages/${pageId}`,
        { published },
        token
      );
      setPages(pages.map((p) => (p.id === pageId ? updated as CMSPage : p)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update page');
    }
  }

  async function handleDelete(pageId: string) {
    if (!token || !confirm('Are you sure you want to delete this page?')) return;
    try {
      await apiDelete(`/cms/pages/${pageId}`, token);
      setPages(pages.filter((p) => p.id !== pageId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete page');
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading pages...</div>;
  }

  const filtered = pages.filter((p) => {
    if (searchTerm && !p.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterPublished === 'published' && !p.published) return false;
    if (filterPublished === 'draft' && p.published) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Create Form */}
      {showCreateForm && (
        <div className="border border-zinc-200 rounded-lg p-4 bg-blue-50 space-y-3">
          <p className="font-semibold">Create New Page</p>
          <input
            type="text"
            placeholder="Page title..."
            value={newPageTitle}
            onChange={(e) => {
              setNewPageTitle(e.target.value);
              // Auto-generate slug from title
              setNewPageSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
            }}
            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <input
            type="text"
            placeholder="Page slug (URL-friendly)..."
            value={newPageSlug}
            onChange={(e) => setNewPageSlug(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreatePage}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
            >
              Create Page
            </button>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setNewPageTitle('');
                setNewPageSlug('');
              }}
              className="px-4 py-2 bg-zinc-300 text-zinc-900 rounded-lg hover:bg-zinc-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!showCreateForm && (
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
        >
          + Create New Page
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
          placeholder="Search pages..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 min-w-48 px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <select
          value={filterPublished}
          onChange={(e) => setFilterPublished(e.target.value as 'all' | 'published' | 'draft')}
          className="px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="all">All Pages</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
        </select>
      </div>

      {/* Pages Table */}
      <div className="overflow-x-auto bg-white rounded-lg border border-zinc-200">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Title</th>
              <th className="px-4 py-3 text-left font-semibold">Slug</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Views</th>
              <th className="px-4 py-3 text-left font-semibold">Modified</th>
              <th className="px-4 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((page) => (
              <tr key={page.id} className="border-b border-zinc-200 hover:bg-zinc-50">
                <td className="px-4 py-3 font-medium">{page.title}</td>
                <td className="px-4 py-3 text-zinc-600 font-mono text-xs">{page.slug}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2 py-1 text-xs rounded-full font-medium ${
                      page.published
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {page.published ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td className="px-4 py-3">{page.viewCount}</td>
                <td className="px-4 py-3 text-xs text-zinc-600">
                  {new Date(page.updatedAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 space-x-2">
                  <a
                    href={`/cms/editor/${page.id}`}
                    className="text-emerald-600 hover:underline font-medium"
                  >
                    Edit
                  </a>
                  <button
                    onClick={() => handlePublish(page.id, !page.published)}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    {page.published ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    onClick={() => handleDelete(page.id)}
                    className="text-red-600 hover:underline font-medium"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-zinc-600">No pages found</div>
      )}
    </div>
  );
}
