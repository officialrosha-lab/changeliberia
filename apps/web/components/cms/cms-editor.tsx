'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiGet, apiPatch } from '../../lib/api';
import { useAuthStore } from '../../lib/store';

interface CMSPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  metaDescription: string | null;
  metaKeywords: string | null;
  ogImage: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  published: boolean;
  publishedAt: string | null;
}

export function CMSEditor() {
  const router = useRouter();
  const params = useParams();
  const pageId = params?.id as string;
  const token = useAuthStore((s) => s.token);

  const [page, setPage] = useState<CMSPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !pageId) return;
    loadPage();
  }, [token, pageId]);

  async function loadPage() {
    try {
      setLoading(true);
      const data = await apiGet<CMSPage>(`/cms/pages/${pageId}`, token!);
      setPage(data as CMSPage);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load page');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!token || !page) return;
    try {
      setSaving(true);
      const updated = await apiPatch<CMSPage>(`/cms/pages/${pageId}`, page, token);
      setPage(updated as CMSPage);
      setSuccess('Page saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save page');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading page...</div>;
  }

  if (!page) {
    return <div className="text-center py-8 text-red-600">Page not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{page.title}</h1>
          <p className="text-sm text-zinc-600 mt-1">/{page.slug}</p>
        </div>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-zinc-300 text-zinc-900 rounded-lg hover:bg-zinc-400"
        >
          Back
        </button>
      </div>

      {/* Messages */}
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

      {/* Main Content Editor */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-2">Page Title</label>
          <input
            type="text"
            value={page.title}
            onChange={(e) => setPage({ ...page, title: e.target.value })}
            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Page Slug</label>
          <input
            type="text"
            value={page.slug}
            onChange={(e) => setPage({ ...page, slug: e.target.value })}
            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="URL-friendly page slug"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Content (HTML)</label>
          <textarea
            value={page.content}
            onChange={(e) => setPage({ ...page, content: e.target.value })}
            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm"
            rows={12}
            placeholder="Enter HTML content..."
          />
          <p className="text-xs text-zinc-500 mt-1">
            Supports HTML. Use &lt;h1&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;a&gt;, etc.
          </p>
        </div>
      </div>

      {/* SEO Metadata */}
      <div className="border border-zinc-200 rounded-lg p-4 bg-blue-50">
        <h3 className="font-semibold text-lg mb-4">SEO & Social Metadata</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Meta Description</label>
            <textarea
              value={page.metaDescription || ''}
              onChange={(e) => setPage({ ...page, metaDescription: e.target.value })}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Description for search engines (160 chars max)"
            />
            <p className="text-xs text-zinc-500 mt-1">
              {page.metaDescription?.length || 0} / 160 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Meta Keywords</label>
            <input
              type="text"
              value={page.metaKeywords || ''}
              onChange={(e) => setPage({ ...page, metaKeywords: e.target.value })}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="keyword1, keyword2, keyword3"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">OG Title (Social Share)</label>
            <input
              type="text"
              value={page.ogTitle || ''}
              onChange={(e) => setPage({ ...page, ogTitle: e.target.value })}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">OG Description (Social Share)</label>
            <textarea
              value={page.ogDescription || ''}
              onChange={(e) => setPage({ ...page, ogDescription: e.target.value })}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">OG Image URL (Social Share)</label>
            <input
              type="text"
              value={page.ogImage || ''}
              onChange={(e) => setPage({ ...page, ogImage: e.target.value })}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://..."
            />
          </div>
        </div>
      </div>

      {/* Publishing Status */}
      <div className="border border-zinc-200 rounded-lg p-4 bg-purple-50">
        <h3 className="font-semibold text-lg mb-4">Publishing</h3>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={page.published}
              onChange={(e) => setPage({ ...page, published: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span className="font-medium">Publish this page</span>
          </label>
          {page.publishedAt && (
            <span className="text-sm text-zinc-600">
              Published {new Date(page.publishedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Page'}
        </button>
        <button
          onClick={() => router.back()}
          className="px-4 py-3 bg-zinc-300 text-zinc-900 rounded-lg hover:bg-zinc-400 font-semibold"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
