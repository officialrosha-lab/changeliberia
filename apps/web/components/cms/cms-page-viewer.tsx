'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiGet } from '../../lib/api';

interface CMSPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  metaDescription: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  publishedAt: string | null;
}

function sanitizeHtml(html: string) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/on[a-z]+="[^"]*"/gi, '')
    .replace(/javascript:/gi, '#');
}

export function CMSPageViewer() {
  const params = useParams();
  const slug = params?.slug as string;
  const [page, setPage] = useState<CMSPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    const loadPage = async () => {
      try {
        setLoading(true);
        const data = await apiGet<CMSPage>(`/cms/public/pages/${slug}`);
        if (!cancelled) {
          setPage(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load page');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadPage();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return <div className="text-center py-12">Loading content…</div>;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center text-red-700">
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="mt-3 text-zinc-600">{error}</p>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center text-zinc-600">
        No content is available for this page.
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-5xl px-4 py-12 space-y-8">
      <header className="space-y-3">
        <div className="text-sm uppercase tracking-[0.24em] text-emerald-700">CMS Page</div>
        <h1 className="text-4xl font-bold text-zinc-900">{page.title}</h1>
        {page.publishedAt && (
          <p className="text-sm text-zinc-500">Published {new Date(page.publishedAt).toLocaleDateString()}</p>
        )}
      </header>

      <section className="prose prose-zinc max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.content) }} />
    </article>
  );
}
