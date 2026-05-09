'use client';

import { useEffect, useState } from 'react';
import { CMSBlock, CMSPage } from '../lib/cms';
import { apiGet, apiPost, apiPatch, apiDelete } from '../lib/api';
import { useAuthStore } from '../lib/store';
import { CMSBlockRenderer } from './cms-block-renderer';

type BlockType = 'hero' | 'text' | 'image' | 'grid' | 'cta' | 'testimonial' | 'divider' | 'faq' | 'features';

interface PageWithBlocks extends CMSPage {
  blocks?: CMSBlock[];
}

export function CMSPageBlockEditor() {
  const token = useAuthStore((s) => s.token);
  const [pages, setPages] = useState<PageWithBlocks[]>([]);
  const [selectedPage, setSelectedPage] = useState<PageWithBlocks | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingBlock, setEditingBlock] = useState<CMSBlock | null>(null);
  const [blockType, setBlockType] = useState<BlockType>('text');
  const [blockProps, setBlockProps] = useState<Record<string, any>>({});
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (!token) return;
    loadPages();
  }, [token]);

  async function loadPages() {
    try {
      setLoading(true);
      const data = await apiGet<PageWithBlocks[]>('/cms/pages', token!);
      setPages(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pages');
    } finally {
      setLoading(false);
    }
  }

  async function loadPageWithBlocks(pageId: string) {
    try {
      const data = await apiGet<PageWithBlocks>(`/cms/pages/${pageId}`, token!);
      setSelectedPage(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load page');
    }
  }

  async function handleAddBlock() {
    if (!selectedPage || !token) return;
    try {
      const order = (selectedPage.blocks?.length ?? 0) + 1;
      const newBlock = await apiPost<CMSBlock>(
        `/cms/pages/${selectedPage.id}/blocks`,
        { type: blockType, props: blockProps, order },
        token
      );
      setSelectedPage({
        ...selectedPage,
        blocks: [...(selectedPage.blocks || []), newBlock],
      });
      setBlockType('text');
      setBlockProps({});
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add block');
    }
  }

  async function handleUpdateBlock(blockId: string) {
    if (!token) return;
    try {
      const updated = await apiPatch<CMSBlock>(
        `/cms/blocks/${blockId}`,
        { props: blockProps },
        token
      );
      setSelectedPage({
        ...selectedPage!,
        blocks: (selectedPage!.blocks || []).map((b) => (b.id === blockId ? updated : b)),
      });
      setEditingBlock(null);
      setBlockProps({});
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update block');
    }
  }

  async function handleDeleteBlock(blockId: string) {
    if (!token || !confirm('Delete this block?')) return;
    try {
      await apiDelete(`/cms/blocks/${blockId}`, token);
      setSelectedPage({
        ...selectedPage!,
        blocks: (selectedPage!.blocks || []).filter((b) => b.id !== blockId),
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete block');
    }
  }

  async function handlePublishPage() {
    if (!selectedPage || !token) return;
    try {
      const updated = await apiPatch<PageWithBlocks>(
        `/cms/pages/${selectedPage.id}`,
        { published: !selectedPage.published },
        token
      );
      setSelectedPage(updated);
      setPages(pages.map((p) => (p.id === selectedPage.id ? updated : p)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish page');
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading pages...</div>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}

      {!selectedPage ? (
        <div className="space-y-4">
          <h3 className="text-lg font-bold">CMS Pages</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {pages.map((page) => (
              <button
                key={page.id}
                onClick={() => loadPageWithBlocks(page.id)}
                className="rounded-lg border border-zinc-200 bg-white p-4 text-left transition hover:border-emerald-300 hover:shadow dark:border-neutral-700 dark:bg-neutral-800"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-zinc-900 dark:text-neutral-50">{page.title}</h4>
                    <p className="text-sm text-zinc-500 dark:text-neutral-400">/{page.slug}</p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      page.published
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200'
                        : 'bg-zinc-100 text-zinc-700 dark:bg-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    {page.published ? 'Published' : 'Draft'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedPage(null)}
              className="text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
            >
              ← Back to pages
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="rounded-lg border border-zinc-300 px-3 py-1 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                {showPreview ? 'Edit' : 'Preview'}
              </button>
              <button
                onClick={handlePublishPage}
                className={`rounded-lg px-3 py-1 text-sm font-medium text-white transition ${
                  selectedPage.published
                    ? 'bg-zinc-600 hover:bg-zinc-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {selectedPage.published ? 'Unpublish' : 'Publish'}
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
            <h3 className="font-bold">{selectedPage.title}</h3>
            <p className="text-sm text-zinc-500 dark:text-neutral-400">/{selectedPage.slug}</p>
          </div>

          {showPreview ? (
            <div className="space-y-4">
              <h4 className="font-bold">Preview</h4>
              <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-900">
                {selectedPage.blocks && selectedPage.blocks.length > 0 ? (
                  selectedPage.blocks.map((block) => (
                    <CMSBlockRenderer key={block.id} block={block} />
                  ))
                ) : (
                  <p className="text-center text-zinc-500">No blocks yet</p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h4 className="mb-4 font-bold">Blocks ({selectedPage.blocks?.length ?? 0})</h4>
                <div className="space-y-2">
                  {(selectedPage.blocks || []).map((block, idx) => (
                    <div
                      key={block.id}
                      className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-neutral-700 dark:bg-neutral-900"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-zinc-900 dark:text-neutral-50">
                          Block {idx + 1}: {block.type.toUpperCase()}
                        </p>
                        {block.props?.title && (
                          <p className="text-xs text-zinc-500 dark:text-neutral-400">{block.props.title}</p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setEditingBlock(block);
                          setBlockProps(block.props || {});
                        }}
                        className="ml-2 rounded px-2 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteBlock(block.id)}
                        className="ml-1 rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {editingBlock ? (
                <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/30">
                  <h4 className="mb-4 font-bold">Edit Block: {editingBlock.type.toUpperCase()}</h4>
                  <BlockPropsEditor
                    type={editingBlock.type as BlockType}
                    props={blockProps}
                    onChange={setBlockProps}
                  />
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handleUpdateBlock(editingBlock.id)}
                      className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                    >
                      Save Block
                    </button>
                    <button
                      onClick={() => {
                        setEditingBlock(null);
                        setBlockProps({});
                      }}
                      className="rounded border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-neutral-600 dark:text-neutral-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-neutral-700 dark:bg-neutral-900">
                  <h4 className="mb-4 font-bold">Add New Block</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-neutral-300">
                        Block Type
                      </label>
                      <select
                        value={blockType}
                        onChange={(e) => setBlockType(e.target.value as BlockType)}
                        className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800"
                      >
                        <option value="hero">Hero</option>
                        <option value="text">Text</option>
                        <option value="image">Image</option>
                        <option value="grid">Grid</option>
                        <option value="cta">Call to Action</option>
                        <option value="testimonial">Testimonial</option>
                        <option value="divider">Divider</option>
                        <option value="faq">FAQ</option>
                        <option value="features">Features</option>
                      </select>
                    </div>
                    <BlockPropsEditor
                      type={blockType}
                      props={blockProps}
                      onChange={setBlockProps}
                    />
                    <button
                      onClick={handleAddBlock}
                      className="w-full rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                    >
                      Add Block
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BlockPropsEditor({
  type,
  props,
  onChange,
}: {
  type: BlockType;
  props: Record<string, any>;
  onChange: (props: Record<string, any>) => void;
}) {
  const updateProp = (key: string, value: any) => {
    onChange({ ...props, [key]: value });
  };

  return (
    <div className="space-y-3">
      {type === 'hero' && (
        <>
          <input
            type="text"
            placeholder="Title"
            value={props.title || ''}
            onChange={(e) => updateProp('title', e.target.value)}
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800"
          />
          <input
            type="text"
            placeholder="Subtitle (optional)"
            value={props.subtitle || ''}
            onChange={(e) => updateProp('subtitle', e.target.value)}
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800"
          />
          <textarea
            placeholder="Description"
            value={props.description || ''}
            onChange={(e) => updateProp('description', e.target.value)}
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800"
            rows={3}
          />
          <input
            type="text"
            placeholder="CTA Text (optional)"
            value={props.ctaText || ''}
            onChange={(e) => updateProp('ctaText', e.target.value)}
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800"
          />
          <input
            type="text"
            placeholder="CTA URL (optional)"
            value={props.ctaUrl || ''}
            onChange={(e) => updateProp('ctaUrl', e.target.value)}
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800"
          />
        </>
      )}
      {type === 'text' && (
        <>
          <input
            type="text"
            placeholder="Title (optional)"
            value={props.title || ''}
            onChange={(e) => updateProp('title', e.target.value)}
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800"
          />
          <textarea
            placeholder="Body text"
            value={props.body || ''}
            onChange={(e) => updateProp('body', e.target.value)}
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800"
            rows={4}
          />
          <select
            value={props.alignment || 'left'}
            onChange={(e) => updateProp('alignment', e.target.value)}
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800"
          >
            <option value="left">Left aligned</option>
            <option value="center">Centered</option>
            <option value="right">Right aligned</option>
          </select>
        </>
      )}
      {type === 'cta' && (
        <>
          <input
            type="text"
            placeholder="Heading"
            value={props.heading || ''}
            onChange={(e) => updateProp('heading', e.target.value)}
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800"
          />
          <textarea
            placeholder="Description"
            value={props.description || ''}
            onChange={(e) => updateProp('description', e.target.value)}
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800"
            rows={2}
          />
          <input
            type="text"
            placeholder="Primary button text"
            value={props.primaryText || ''}
            onChange={(e) => updateProp('primaryText', e.target.value)}
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800"
          />
          <input
            type="text"
            placeholder="Primary button URL"
            value={props.primaryUrl || ''}
            onChange={(e) => updateProp('primaryUrl', e.target.value)}
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800"
          />
        </>
      )}
      {(type === 'faq' || type === 'testimonial' || type === 'image' || type === 'grid' || type === 'features') && (
        <div className="rounded bg-zinc-100 p-2 text-xs text-zinc-600 dark:bg-neutral-800 dark:text-neutral-400">
          <p>Props editor coming for {type} blocks</p>
          <textarea
            placeholder="JSON props"
            value={JSON.stringify(props, null, 2)}
            onChange={(e) => {
              try {
                onChange(JSON.parse(e.target.value));
              } catch {
                // Invalid JSON, don't update
              }
            }}
            className="mt-2 w-full rounded border border-zinc-300 px-2 py-1 text-xs font-mono dark:border-neutral-600 dark:bg-neutral-700"
            rows={6}
          />
        </div>
      )}
    </div>
  );
}
