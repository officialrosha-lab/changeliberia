'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ContentBlock } from './cms-content-blocks';

interface PageBuilderBlock extends ContentBlock {
  order: number;
}

interface PageEditorState {
  title: string;
  slug: string;
  description: string;
  blocks: PageBuilderBlock[];
  status: 'draft' | 'review' | 'published';
  publishedAt?: Date;
  scheduledAt?: Date;
}

const availableBlocks = [
  { id: 'hero', name: 'Hero Section', icon: '🏞️', description: 'Large banner with title and CTA' },
  { id: 'text', name: 'Text Content', icon: '📝', description: 'Rich text paragraph' },
  { id: 'image', name: 'Image', icon: '🖼️', description: 'Single image with optional caption' },
  { id: 'grid', name: 'Grid Items', icon: '⌗', description: '2-4 column grid of cards' },
  { id: 'cta', name: 'Call to Action', icon: '⚡', description: 'Highlighted CTA section' },
  { id: 'testimonial', name: 'Testimonials', icon: '💬', description: 'Quote and attribution' },
  { id: 'divider', name: 'Divider', icon: '∿', description: 'Space or line separator' },
];

interface PageBuilderProps {
  initialState?: PageEditorState;
  onPublish?: (page: PageEditorState) => Promise<void>;
  onSaveDraft?: (page: PageEditorState) => Promise<void>;
  isLoading?: boolean;
}

export function PageBuilder({
  initialState = {
    title: '',
    slug: '',
    description: '',
    blocks: [],
    status: 'draft',
  },
  onPublish,
  onSaveDraft,
  isLoading = false,
}: PageBuilderProps) {
  const [pageState, setPageState] = useState<PageEditorState>(initialState);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [showBlockLibrary, setShowBlockLibrary] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleAddBlock = (blockType: string) => {
    const newBlock: PageBuilderBlock = {
      id: `${blockType}-${Date.now()}`,
      type: blockType,
      order: pageState.blocks.length,
      props: getDefaultProps(blockType),
    };

    setPageState({
      ...pageState,
      blocks: [...pageState.blocks, newBlock],
    });
  };

  const handleUpdateBlock = (blockId: string, props: Record<string, any>) => {
    setPageState({
      ...pageState,
      blocks: pageState.blocks.map(b => (b.id === blockId ? { ...b, props } : b)),
    });
  };

  const handleRemoveBlock = (blockId: string) => {
    setPageState({
      ...pageState,
      blocks: pageState.blocks.filter(b => b.id !== blockId),
    });
  };

  const handleReorderBlocks = (blockId: string, direction: 'up' | 'down') => {
    const index = pageState.blocks.findIndex(b => b.id === blockId);
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === pageState.blocks.length - 1))
      return;

    const newBlocks = [...pageState.blocks];
    if (direction === 'up') {
      [newBlocks[index], newBlocks[index - 1]] = [newBlocks[index - 1], newBlocks[index]];
    } else {
      [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
    }

    setPageState({
      ...pageState,
      blocks: newBlocks.map((b, i) => ({ ...b, order: i })),
    });
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      if (onSaveDraft) {
        await onSaveDraft({ ...pageState, status: 'draft' });
      }
      setSaveMessage({ type: 'success', text: 'Draft saved successfully!' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      setSaveMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to save' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!pageState.title.trim()) {
      setSaveMessage({ type: 'error', text: 'Please enter a page title' });
      return;
    }

    if (pageState.blocks.length === 0) {
      setSaveMessage({ type: 'error', text: 'Please add at least one block' });
      return;
    }

    setIsSaving(true);
    try {
      if (onPublish) {
        await onPublish({ ...pageState, status: 'published', publishedAt: new Date() });
      }
      setSaveMessage({ type: 'success', text: 'Page published successfully!' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      setSaveMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to publish' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Left Sidebar: Block Library */}
      <motion.div
        initial={{ opacity: 0, x: -300 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-72 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 overflow-y-auto flex flex-col"
      >
        {/* Page Settings */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">Page Settings</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Title *</label>
              <input
                type="text"
                value={pageState.title}
                onChange={e => setPageState({ ...pageState, title: e.target.value })}
                placeholder="e.g., Featured Campaign"
                className="w-full mt-1 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Description</label>
              <textarea
                value={pageState.description}
                onChange={e => setPageState({ ...pageState, description: e.target.value })}
                placeholder="Page description..."
                className="w-full mt-1 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all h-20 resize-none"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Status</label>
              <div className="mt-1 inline-block px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-sm font-semibold rounded-full">
                {pageState.status.charAt(0).toUpperCase() + pageState.status.slice(1)}
              </div>
            </div>
          </div>
        </div>

        {/* Block Library */}
        <div className="flex-1 p-4">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-3">Add Blocks</h3>
          <div className="space-y-2">
            {availableBlocks.map(block => (
              <motion.button
                key={block.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleAddBlock(block.id)}
                className="w-full text-left p-3 rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all"
              >
                <div className="flex items-start gap-2">
                  <span className="text-xl">{block.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{block.name}</p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">{block.description}</p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
          {saveMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-2 rounded-lg text-sm font-medium text-center ${
                saveMessage.type === 'success'
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
              }`}
            >
              {saveMessage.text}
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSaveDraft}
            disabled={isSaving || isLoading}
            className="w-full px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Draft'}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePublish}
            disabled={isSaving || isLoading || !pageState.title.trim()}
            className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white rounded-lg font-semibold transition-all disabled:opacity-50"
          >
            {isSaving ? 'Publishing...' : 'Publish Page'}
          </motion.button>
        </div>
      </motion.div>

      {/* Main Canvas */}
      <div className="flex-1 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-4xl mx-auto py-12"
        >
          <AnimatePresence>
            {pageState.blocks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="h-96 flex items-center justify-center mx-4 rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900"
              >
                <div className="text-center">
                  <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                    No blocks yet
                  </p>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    Add blocks from the left sidebar to build your page
                  </p>
                </div>
              </motion.div>
            ) : (
              pageState.blocks.map((block, index) => (
                <motion.div
                  key={block.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`relative mx-4 mb-4 rounded-lg border-2 transition-all ${
                    selectedBlockId === block.id
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20'
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-emerald-300'
                  }`}
                  onClick={() => setSelectedBlockId(block.id)}
                >
                  {/* Block Header */}
                  <div className="flex items-center justify-between p-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {availableBlocks.find(b => b.id === block.type)?.icon}
                      </span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {availableBlocks.find(b => b.id === block.type)?.name || block.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={e => {
                          e.stopPropagation();
                          handleReorderBlocks(block.id, 'up');
                        }}
                        disabled={index === 0}
                        className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded disabled:opacity-50"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={e => {
                          e.stopPropagation();
                          handleReorderBlocks(block.id, 'down');
                        }}
                        disabled={index === pageState.blocks.length - 1}
                        className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded disabled:opacity-50"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={e => {
                          e.stopPropagation();
                          handleRemoveBlock(block.id);
                        }}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </motion.button>
                    </div>
                  </div>

                  {/* Block Content */}
                  <div className="p-4">
                    <BlockPropsEditor
                      blockType={block.type}
                      props={block.props}
                      onChange={props => handleUpdateBlock(block.id, props)}
                    />
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

interface BlockPropsEditorProps {
  blockType: string;
  props: Record<string, any>;
  onChange: (props: Record<string, any>) => void;
}

function BlockPropsEditor({ blockType, props, onChange }: BlockPropsEditorProps) {
  const handleChange = (key: string, value: any) => {
    onChange({ ...props, [key]: value });
  };

  const renderEditor = () => {
    switch (blockType) {
      case 'hero':
        return (
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Title"
              value={props.title || ''}
              onChange={e => handleChange('title', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500"
            />
            <textarea
              placeholder="Subtitle (optional)"
              value={props.subtitle || ''}
              onChange={e => handleChange('subtitle', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 h-16"
            />
          </div>
        );
      case 'text':
        return (
          <textarea
            placeholder="Enter text content..."
            value={props.content || ''}
            onChange={e => handleChange('content', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 h-24"
          />
        );
      case 'image':
        return (
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Image URL"
              value={props.src || ''}
              onChange={e => handleChange('src', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500"
            />
            <input
              type="text"
              placeholder="Alt text"
              value={props.alt || ''}
              onChange={e => handleChange('alt', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500"
            />
          </div>
        );
      case 'cta':
        return (
          <div className="space-y-3">
            <input
              type="text"
              placeholder="CTA Title"
              value={props.title || ''}
              onChange={e => handleChange('title', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500"
            />
            <input
              type="text"
              placeholder="Button label"
              value={props.primaryCta?.label || ''}
              onChange={e =>
                handleChange('primaryCta', { ...props.primaryCta, label: e.target.value })
              }
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500"
            />
            <input
              type="text"
              placeholder="Button URL"
              value={props.primaryCta?.href || ''}
              onChange={e => handleChange('primaryCta', { ...props.primaryCta, href: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500"
            />
          </div>
        );
      default:
        return <p className="text-sm text-zinc-600 dark:text-zinc-400">No properties to edit</p>;
    }
  };

  return <div>{renderEditor()}</div>;
}

function getDefaultProps(blockType: string): Record<string, any> {
  switch (blockType) {
    case 'hero':
      return {
        title: 'Your Title Here',
        subtitle: 'Optional subtitle',
        align: 'center',
      };
    case 'text':
      return {
        content: 'Enter your text content here...',
        align: 'left',
        size: 'md',
      };
    case 'image':
      return {
        src: '',
        alt: 'Image description',
        caption: 'Optional caption',
      };
    case 'grid':
      return {
        items: [
          { title: 'Item 1', description: 'Description' },
          { title: 'Item 2', description: 'Description' },
          { title: 'Item 3', description: 'Description' },
        ],
        columns: 3,
      };
    case 'cta':
      return {
        title: 'Ready to make a difference?',
        primaryCta: { label: 'Get Started', href: '#' },
      };
    case 'testimonial':
      return {
        testimonials: [
          {
            quote: 'This is an amazing initiative that changed my life.',
            author: 'John Doe',
            role: 'Community Member',
          },
        ],
      };
    case 'divider':
      return {
        variant: 'line',
      };
    default:
      return {};
  }
}
