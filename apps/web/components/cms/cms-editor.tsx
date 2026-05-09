'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiGet, apiPatch, apiPost } from '../../lib/api';
import { useAuthStore } from '../../lib/store';
import { CMSPageBlockEditor } from '../cms-page-block-editor';

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
  isDraft: boolean;
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
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [versions, setVersions] = useState<any[]>([]);

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

  async function handleToggleDraft() {
    if (!token || !page) return;
    try {
      setSaving(true);
      const updated = await apiPatch<CMSPage>(
        `/cms/pages/${pageId}/draft`,
        { isDraft: !page.isDraft },
        token
      );
      setPage(updated as CMSPage);
      setSuccess(`Page marked as ${updated.isDraft ? 'draft' : 'ready for publishing'}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update draft status');
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    if (!token || !page) return;
    try {
      setSaving(true);
      const updated = await apiPost(
        `/cms/pages/${pageId}/publish`,
        {},
        token
      );
      setPage(updated as CMSPage);
      setSuccess('Page published successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish page');
    } finally {
      setSaving(false);
    }
  }

  async function loadVersionHistory() {
    if (!token || !pageId) return;
    try {
      const data = await apiGet<any[]>(`/cms/pages/${pageId}/versions`, token);
      setVersions(data || []);
    } catch (err) {
      setError('Failed to load version history');
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading page...</div>;
  }

  if (!page) {
    return <div className="text-center py-8 text-red-600">Page not found</div>;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{page.title}</h1>
          <p className="text-sm text-zinc-600 mt-1">/{page.slug}</p>
          <div className="mt-2 flex gap-2 items-center">
            <span className={`inline-block px-2 py-1 text-xs rounded-full font-medium ${
              page.isDraft
                ? 'bg-amber-100 text-amber-700'
                : 'bg-emerald-100 text-emerald-700'
            }`}>
              {page.isDraft ? 'Draft' : 'Ready'}
            </span>
            {page.published && (
              <span className="inline-block px-2 py-1 text-xs rounded-full font-medium bg-blue-100 text-blue-700">
                Published
              </span>
            )}
          </div>
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

      {/* Draft/Publish Controls */}
      <div className="border border-zinc-200 rounded-lg p-4 bg-blue-50 flex justify-between items-center">
        <div>
          <p className="font-semibold">Publishing Controls</p>
          <p className="text-sm text-zinc-600 mt-1">
            {page.isDraft ? 'Mark page as ready for review before publishing' : 'Page is ready for publishing'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleToggleDraft}
            disabled={saving}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              page.isDraft
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-amber-600 text-white hover:bg-amber-700'
            } disabled:opacity-50`}
          >
            {page.isDraft ? 'Mark as Ready' : 'Back to Draft'}
          </button>
          {page.isDraft && (
            <button
              onClick={handlePublish}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50"
            >
              Publish Now
            </button>
          )}
          <button
            onClick={() => {
              setShowVersionHistory(!showVersionHistory);
              if (!showVersionHistory) loadVersionHistory();
            }}
            className="px-4 py-2 bg-zinc-300 text-zinc-900 rounded-lg hover:bg-zinc-400 font-semibold"
          >
            Version History
          </button>
        </div>
      </div>

      {/* Version History Panel */}
      {showVersionHistory && (
        <div className="border border-zinc-200 rounded-lg p-4 bg-zinc-50">
          <h3 className="font-semibold mb-3">Version History ({versions.length})</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {versions.length === 0 ? (
              <p className="text-sm text-zinc-600">No versions yet</p>
            ) : (
              versions.map((v: any, idx: number) => (
                <div key={v.id} className="flex justify-between items-center text-sm bg-white p-2 rounded">
                  <span>{new Date(v.createdAt).toLocaleString()}</span>
                  {idx > 0 && (
                    <button className="text-blue-600 hover:underline text-xs font-medium">
                      Restore
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Block Editor */}
      <div className="border border-zinc-200 rounded-lg p-6 bg-white">
        <h2 className="text-xl font-bold mb-4">Page Blocks</h2>
        <CMSPageBlockEditor />
      </div>

      {/* Basic Info */}
      <div className="space-y-4 border border-zinc-200 rounded-lg p-4 bg-white">
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
