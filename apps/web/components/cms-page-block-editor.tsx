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
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [copiedBlock, setCopiedBlock] = useState<CMSBlock | null>(null);

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

  async function handleDuplicateBlock(block: CMSBlock) {
    if (!selectedPage || !token) return;
    try {
      const order = (selectedPage.blocks?.length ?? 0) + 1;
      const newBlock = await apiPost<CMSBlock>(
        `/cms/pages/${selectedPage.id}/blocks`,
        { type: block.type, props: block.props, order },
        token
      );
      setSelectedPage({
        ...selectedPage,
        blocks: [...(selectedPage.blocks || []), newBlock],
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate block');
    }
  }

  function handleCopyBlock(block: CMSBlock) {
    setCopiedBlock(block);
    setError(null);
  }

  async function handlePasteBlock() {
    if (!selectedPage || !token || !copiedBlock) return;
    try {
      const order = (selectedPage.blocks?.length ?? 0) + 1;
      const newBlock = await apiPost<CMSBlock>(
        `/cms/pages/${selectedPage.id}/blocks`,
        { type: copiedBlock.type, props: copiedBlock.props, order },
        token
      );
      setSelectedPage({
        ...selectedPage,
        blocks: [...(selectedPage.blocks || []), newBlock],
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to paste block');
    }
  }

  async function handleReorderBlocks(sourceIndex: number, destIndex: number) {
    if (!selectedPage || !token) return;
    const blocks = [...(selectedPage.blocks || [])];
    const [movedBlock] = blocks.splice(sourceIndex, 1);
    blocks.splice(destIndex, 0, movedBlock);

    // Update local state
    setSelectedPage({
      ...selectedPage,
      blocks,
    });

    // Update order in database for all affected blocks
    try {
      const updates = blocks.map((block, idx) =>
        apiPatch(`/cms/blocks/${block.id}`, { order: idx + 1 }, token!)
      );
      await Promise.all(updates);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder blocks');
      // Refresh page on error
      loadPageWithBlocks(selectedPage.id);
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
                    <CMSBlockRenderer key={block.id} block={block} pageId={selectedPage.id} />
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
                
                {copiedBlock && (
                  <div className="mb-4 flex items-center justify-between rounded-lg bg-blue-50 p-3 dark:bg-blue-950/30">
                    <span className="text-sm text-blue-700 dark:text-blue-300">
                      Copied: {copiedBlock.type.toUpperCase()}
                    </span>
                    <button
                      onClick={handlePasteBlock}
                      className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
                    >
                      Paste
                    </button>
                  </div>
                )}

                <div className="space-y-2">
                  {(selectedPage.blocks || []).map((block, idx) => (
                    <div
                      key={block.id}
                      draggable
                      onDragStart={() => setDraggedBlockId(block.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (draggedBlockId && draggedBlockId !== block.id) {
                          const draggedIdx = (selectedPage.blocks || []).findIndex((b) => b.id === draggedBlockId);
                          handleReorderBlocks(draggedIdx, idx);
                        }
                        setDraggedBlockId(null);
                      }}
                      className={`flex items-center justify-between rounded-lg border-2 p-3 transition ${
                        draggedBlockId === block.id
                          ? 'border-blue-400 bg-blue-50 dark:border-blue-600 dark:bg-blue-950/30'
                          : 'border-zinc-200 bg-zinc-50 dark:border-neutral-700 dark:bg-neutral-900'
                      }`}
                      style={{ cursor: 'move' }}
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-zinc-900 dark:text-neutral-50">
                          Block {idx + 1}: {block.type.toUpperCase()}
                        </p>
                        {block.props?.title && (
                          <p className="text-xs text-zinc-500 dark:text-neutral-400">{block.props.title}</p>
                        )}
                      </div>
                      <div className="ml-2 flex gap-1">
                        <button
                          onClick={() => {
                            setEditingBlock(block);
                            setBlockProps(block.props || {});
                          }}
                          className="rounded px-2 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950"
                          title="Edit block"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleCopyBlock(block)}
                          className="rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
                          title="Copy block for pasting"
                        >
                          Copy
                        </button>
                        <button
                          onClick={() => handleDuplicateBlock(block)}
                          className="rounded px-2 py-1 text-xs font-medium text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-950"
                          title="Duplicate block on this page"
                        >
                          Dup
                        </button>
                        <button
                          onClick={() => handleDeleteBlock(block.id)}
                          className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                          title="Delete block"
                        >
                          Delete
                        </button>
                      </div>
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
            type="url"
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
      {type === 'image' && (
        <>
          <input
            type="url"
            placeholder="Image URL"
            value={props.url || ''}
            onChange={(e) => updateProp('url', e.target.value)}
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800"
          />
          <input
            type="text"
            placeholder="Alt text (for accessibility)"
            value={props.alt || ''}
            onChange={(e) => updateProp('alt', e.target.value)}
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800"
          />
          <textarea
            placeholder="Caption (optional)"
            value={props.caption || ''}
            onChange={(e) => updateProp('caption', e.target.value)}
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800"
            rows={2}
          />
          <select
            value={props.size || 'full'}
            onChange={(e) => updateProp('size', e.target.value)}
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800"
          >
            <option value="small">Small (50%)</option>
            <option value="medium">Medium (66%)</option>
            <option value="full">Full width</option>
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
            type="url"
            placeholder="Primary button URL"
            value={props.primaryUrl || ''}
            onChange={(e) => updateProp('primaryUrl', e.target.value)}
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800"
          />
        </>
      )}
      {type === 'testimonial' && (
        <>
          <textarea
            placeholder="Quote text"
            value={props.quote || ''}
            onChange={(e) => updateProp('quote', e.target.value)}
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800"
            rows={3}
          />
          <input
            type="text"
            placeholder="Author name"
            value={props.author || ''}
            onChange={(e) => updateProp('author', e.target.value)}
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800"
          />
          <input
            type="text"
            placeholder="Author role/title"
            value={props.role || ''}
            onChange={(e) => updateProp('role', e.target.value)}
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800"
          />
          <input
            type="url"
            placeholder="Avatar image URL (optional)"
            value={props.avatar || ''}
            onChange={(e) => updateProp('avatar', e.target.value)}
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800"
          />
          <select
            value={props.rating || 5}
            onChange={(e) => updateProp('rating', parseInt(e.target.value))}
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800"
          >
            <option value={5}>⭐ 5 stars</option>
            <option value={4}>⭐ 4 stars</option>
            <option value={3}>⭐ 3 stars</option>
            <option value={2}>⭐ 2 stars</option>
            <option value={1}>⭐ 1 star</option>
          </select>
        </>
      )}
      {type === 'faq' && (
        <>
          <div className="space-y-3">
            {(props.items || []).map((item: any, idx: number) => (
              <div key={idx} className="space-y-2 rounded border border-zinc-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-500 dark:text-neutral-400">Question {idx + 1}</span>
                  <button
                    onClick={() => {
                      const newItems = props.items?.filter((_: any, i: number) => i !== idx) || [];
                      updateProp('items', newItems);
                    }}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Question"
                  value={item.question || ''}
                  onChange={(e) => {
                    const newItems = [...(props.items || [])];
                    newItems[idx] = { ...item, question: e.target.value };
                    updateProp('items', newItems);
                  }}
                  className="w-full rounded border border-zinc-300 px-2 py-1 text-sm dark:border-neutral-600 dark:bg-neutral-700"
                />
                <textarea
                  placeholder="Answer"
                  value={item.answer || ''}
                  onChange={(e) => {
                    const newItems = [...(props.items || [])];
                    newItems[idx] = { ...item, answer: e.target.value };
                    updateProp('items', newItems);
                  }}
                  className="w-full rounded border border-zinc-300 px-2 py-1 text-sm dark:border-neutral-600 dark:bg-neutral-700"
                  rows={2}
                />
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              updateProp('items', [...(props.items || []), { question: '', answer: '' }]);
            }}
            className="w-full rounded border border-dashed border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-neutral-600 dark:text-neutral-400"
          >
            + Add FAQ Item
          </button>
        </>
      )}
      {type === 'grid' && (
        <>
          <select
            value={props.columns || 3}
            onChange={(e) => updateProp('columns', parseInt(e.target.value))}
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800"
          >
            <option value={2}>2 columns</option>
            <option value={3}>3 columns</option>
            <option value={4}>4 columns</option>
          </select>
          <div className="space-y-3">
            {(props.items || []).map((item: any, idx: number) => (
              <div key={idx} className="space-y-2 rounded border border-zinc-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-500 dark:text-neutral-400">Grid Item {idx + 1}</span>
                  <button
                    onClick={() => {
                      const newItems = props.items?.filter((_: any, i: number) => i !== idx) || [];
                      updateProp('items', newItems);
                    }}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Title"
                  value={item.title || ''}
                  onChange={(e) => {
                    const newItems = [...(props.items || [])];
                    newItems[idx] = { ...item, title: e.target.value };
                    updateProp('items', newItems);
                  }}
                  className="w-full rounded border border-zinc-300 px-2 py-1 text-sm dark:border-neutral-600 dark:bg-neutral-700"
                />
                <textarea
                  placeholder="Description"
                  value={item.description || ''}
                  onChange={(e) => {
                    const newItems = [...(props.items || [])];
                    newItems[idx] = { ...item, description: e.target.value };
                    updateProp('items', newItems);
                  }}
                  className="w-full rounded border border-zinc-300 px-2 py-1 text-sm dark:border-neutral-600 dark:bg-neutral-700"
                  rows={2}
                />
                <input
                  type="text"
                  placeholder="Icon (emoji or icon name, e.g. 📱 or 'download')"
                  value={item.icon || ''}
                  onChange={(e) => {
                    const newItems = [...(props.items || [])];
                    newItems[idx] = { ...item, icon: e.target.value };
                    updateProp('items', newItems);
                  }}
                  className="w-full rounded border border-zinc-300 px-2 py-1 text-sm dark:border-neutral-600 dark:bg-neutral-700"
                />
                <input
                  type="url"
                  placeholder="Link URL (optional)"
                  value={item.link || ''}
                  onChange={(e) => {
                    const newItems = [...(props.items || [])];
                    newItems[idx] = { ...item, link: e.target.value };
                    updateProp('items', newItems);
                  }}
                  className="w-full rounded border border-zinc-300 px-2 py-1 text-sm dark:border-neutral-600 dark:bg-neutral-700"
                />
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              updateProp('items', [...(props.items || []), { title: '', description: '', icon: '', link: '' }]);
            }}
            className="w-full rounded border border-dashed border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-neutral-600 dark:text-neutral-400"
          >
            + Add Grid Item
          </button>
        </>
      )}
      {type === 'features' && (
        <>
          <div className="space-y-3">
            {(props.items || []).map((item: any, idx: number) => (
              <div key={idx} className="space-y-2 rounded border border-zinc-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-500 dark:text-neutral-400">Feature {idx + 1}</span>
                  <button
                    onClick={() => {
                      const newItems = props.items?.filter((_: any, i: number) => i !== idx) || [];
                      updateProp('items', newItems);
                    }}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Feature title"
                  value={item.title || ''}
                  onChange={(e) => {
                    const newItems = [...(props.items || [])];
                    newItems[idx] = { ...item, title: e.target.value };
                    updateProp('items', newItems);
                  }}
                  className="w-full rounded border border-zinc-300 px-2 py-1 text-sm dark:border-neutral-600 dark:bg-neutral-700"
                />
                <textarea
                  placeholder="Feature description"
                  value={item.description || ''}
                  onChange={(e) => {
                    const newItems = [...(props.items || [])];
                    newItems[idx] = { ...item, description: e.target.value };
                    updateProp('items', newItems);
                  }}
                  className="w-full rounded border border-zinc-300 px-2 py-1 text-sm dark:border-neutral-600 dark:bg-neutral-700"
                  rows={2}
                />
                <input
                  type="text"
                  placeholder="Icon (emoji or icon name, e.g. ✅ or 'check')"
                  value={item.icon || ''}
                  onChange={(e) => {
                    const newItems = [...(props.items || [])];
                    newItems[idx] = { ...item, icon: e.target.value };
                    updateProp('items', newItems);
                  }}
                  className="w-full rounded border border-zinc-300 px-2 py-1 text-sm dark:border-neutral-600 dark:bg-neutral-700"
                />
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              updateProp('items', [...(props.items || []), { title: '', description: '', icon: '' }]);
            }}
            className="w-full rounded border border-dashed border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-neutral-600 dark:text-neutral-400"
          >
            + Add Feature
          </button>
        </>
      )}
      {type === 'divider' && (
        <>
          <select
            value={props.style || 'solid'}
            onChange={(e) => updateProp('style', e.target.value)}
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800"
          >
            <option value="solid">Solid line</option>
            <option value="dashed">Dashed line</option>
            <option value="dotted">Dotted line</option>
          </select>
          <select
            value={props.size || 'md'}
            onChange={(e) => updateProp('size', e.target.value)}
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800"
          >
            <option value="sm">Small spacing</option>
            <option value="md">Medium spacing</option>
            <option value="lg">Large spacing</option>
          </select>
        </>
      )}
    </div>
  );
}
