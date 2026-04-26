'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SEOMetadata {
  id: string;
  pageId: string;
  title: string;
  description: string;
  slug: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  keywords?: string[];
  schemaType?: 'Article' | 'BlogPosting' | 'NewsArticle' | 'CreativeWork' | 'LocalBusiness' | 'Organization';
  schemaData?: Record<string, any>;
  robotsMeta?: string;
  language?: string;
}

interface CMSSEOManagerProps {
  pages: Array<{ id: string; title: string; slug: string }>;
  defaultMetadata?: { domain: string; twitterHandle?: string; siteName?: string };
  onSaveMetadata?: (metadata: SEOMetadata) => Promise<void>;
  onDeleteMetadata?: (metadataId: string) => Promise<void>;
  isLoading?: boolean;
}

export function CMSSEOManager({
  pages,
  defaultMetadata = { domain: 'example.com', siteName: 'Change Liberia' },
  onSaveMetadata,
  onDeleteMetadata,
}: CMSSEOManagerProps) {
  const [selectedPageId, setSelectedPageId] = useState<string>(pages[0]?.id || '');
  const [metadata, setMetadata] = useState<SEOMetadata>({
    id: `seo-${Date.now()}`,
    pageId: selectedPageId,
    title: '',
    description: '',
    slug: '',
  });
  const [showPreview, setShowPreview] = useState<'google' | 'twitter' | 'facebook' | null>(null);
  const [saving, setSaving] = useState(false);
  const [keywords, setKeywords] = useState<string>('');

  const selectedPage = pages.find(p => p.id === selectedPageId);
  const fullUrl = `https://${defaultMetadata.domain}/${metadata.slug || selectedPage?.slug || ''}`;

  const handleMetadataChange = (key: string, value: any) => {
    setMetadata(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveMetadata = async () => {
    setSaving(true);
    try {
      const updatedMetadata = {
        ...metadata,
        keywords: keywords
          .split(',')
          .map(k => k.trim())
          .filter(Boolean),
      };
      await onSaveMetadata?.(updatedMetadata);
    } finally {
      setSaving(false);
    }
  };

  const getSEOScore = () => {
    let score = 0;
    if (metadata.title && metadata.title.length >= 30 && metadata.title.length <= 60) score += 20;
    if (metadata.description && metadata.description.length >= 120 && metadata.description.length <= 160) score += 20;
    if (metadata.ogImage) score += 15;
    if (metadata.canonicalUrl) score += 15;
    if (keywords) score += 15;
    if (metadata.schemaType) score += 15;
    return score;
  };

  const seoScore = getSEOScore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="w-full space-y-6"
    >
      {/* Page Selector */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6"
      >
        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
          Select Page
        </label>
        <select
          value={selectedPageId}
          onChange={e => {
            setSelectedPageId(e.target.value);
            handleMetadataChange('pageId', e.target.value);
          }}
          className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
        >
          {pages.map(page => (
            <option key={page.id} value={page.id}>
              {page.title} ({page.slug})
            </option>
          ))}
        </select>
      </motion.div>

      {/* SEO Score */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800 p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">
              SEO Score
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Complete your SEO setup to improve visibility
            </p>
          </div>

          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="relative w-24 h-24"
          >
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-emerald-200 dark:text-emerald-900"
              />
              <motion.circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={`${2.51 * 40} ${2.51 * 40}`}
                strokeDashoffset={2.51 * 40 * (1 - seoScore / 100)}
                animate={{ strokeDashoffset: 2.51 * 40 * (1 - seoScore / 100) }}
                className="text-emerald-600 dark:text-emerald-400 transition-all"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {seoScore}
              </span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core SEO Settings */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 space-y-4"
        >
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              Page Title & Meta
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Page Title {metadata.title.length < 30 || metadata.title.length > 60 ? '⚠️' : '✓'}
                </label>
                <input
                  type="text"
                  maxLength={60}
                  value={metadata.title}
                  onChange={e => handleMetadataChange('title', e.target.value)}
                  placeholder="Your page title (30-60 characters)"
                  className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                  {metadata.title.length}/60 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Meta Description {metadata.description.length < 120 || metadata.description.length > 160 ? '⚠️' : '✓'}
                </label>
                <textarea
                  maxLength={160}
                  value={metadata.description}
                  onChange={e => handleMetadataChange('description', e.target.value)}
                  placeholder="Compelling description (120-160 characters)"
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                  {metadata.description.length}/160 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Keywords
                </label>
                <input
                  type="text"
                  value={keywords}
                  onChange={e => setKeywords(e.target.value)}
                  placeholder="keyword1, keyword2, keyword3"
                  className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                  Comma-separated keywords
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  URL Slug
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    https://{defaultMetadata.domain}/
                  </span>
                  <input
                    type="text"
                    value={metadata.slug}
                    onChange={e => handleMetadataChange('slug', e.target.value)}
                    placeholder={selectedPage?.slug}
                    className="flex-1 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Canonical URL
                </label>
                <input
                  type="url"
                  value={metadata.canonicalUrl || fullUrl}
                  onChange={e => handleMetadataChange('canonicalUrl', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                  Specify if this page is a duplicate of another URL
                </p>
              </div>
            </div>
          </div>

          {/* Open Graph */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              Open Graph (Social Sharing)
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  OG Title
                </label>
                <input
                  type="text"
                  value={metadata.ogTitle || metadata.title}
                  onChange={e => handleMetadataChange('ogTitle', e.target.value)}
                  placeholder={metadata.title}
                  className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  OG Description
                </label>
                <textarea
                  value={metadata.ogDescription || metadata.description}
                  onChange={e => handleMetadataChange('ogDescription', e.target.value)}
                  placeholder={metadata.description}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  OG Image URL {metadata.ogImage ? '✓' : ''}
                </label>
                <input
                  type="url"
                  value={metadata.ogImage || ''}
                  onChange={e => handleMetadataChange('ogImage', e.target.value)}
                  placeholder="https://example.com/image.jpg (1200x630px)"
                  className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                  Recommended: 1200x630px
                </p>
              </div>
            </div>
          </div>

          {/* Twitter Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              Twitter Card
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Card Type
                </label>
                <select
                  value={metadata.twitterCard || 'summary'}
                  onChange={e =>
                    handleMetadataChange('twitterCard', e.target.value as SEOMetadata['twitterCard'])
                  }
                  className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="summary">Summary</option>
                  <option value="summary_large_image">Summary with Large Image</option>
                  <option value="app">App Card</option>
                  <option value="player">Player Card</option>
                </select>
              </div>

              {defaultMetadata.twitterHandle && (
                <div className="text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800 p-3 rounded">
                  🐦 @{defaultMetadata.twitterHandle}
                </div>
              )}
            </div>
          </div>

          {/* Structured Data */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              Structured Data (Schema.org)
            </h3>

            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Schema Type
              </label>
              <select
                value={metadata.schemaType || ''}
                onChange={e => handleMetadataChange('schemaType', e.target.value || undefined)}
                className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="">None</option>
                <option value="Article">Article</option>
                <option value="BlogPosting">Blog Post</option>
                <option value="NewsArticle">News Article</option>
                <option value="CreativeWork">Creative Work</option>
                <option value="LocalBusiness">Local Business</option>
                <option value="Organization">Organization</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Preview */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
          className="lg:col-span-1 space-y-4"
        >
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 sticky top-6">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              Preview
            </h3>

            <div className="space-y-2">
              {(['google', 'twitter', 'facebook'] as const).map(platform => (
                <motion.button
                  key={platform}
                  onClick={() => setShowPreview(showPreview === platform ? null : platform)}
                  className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all font-semibold ${
                    showPreview === platform
                      ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                      : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                  }`}
                >
                  {platform === 'google' && '🔍 Google Search'}
                  {platform === 'twitter' && '𝕏 Twitter/X'}
                  {platform === 'facebook' && '👍 Facebook'}
                </motion.button>
              ))}
            </div>

            <AnimatePresence>
              {showPreview === 'google' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg space-y-2"
                >
                  <p className="text-blue-600 dark:text-blue-400 font-semibold underline text-sm">
                    {metadata.title || 'Page Title'}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 text-xs">{fullUrl}</p>
                  <p className="text-gray-700 dark:text-gray-300 text-xs line-clamp-2">
                    {metadata.description || 'Page description will appear here'}
                  </p>
                </motion.div>
              )}

              {showPreview === 'twitter' && metadata.ogImage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 border border-zinc-300 dark:border-zinc-700 rounded-lg overflow-hidden"
                >
                  <img
                    src={metadata.ogImage}
                    alt="Twitter preview"
                    className="w-full h-32 object-cover"
                  />
                  <div className="p-3 bg-white dark:bg-zinc-900">
                    <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100 line-clamp-2">
                      {metadata.ogTitle || metadata.title}
                    </p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      {defaultMetadata.domain}
                    </p>
                  </div>
                </motion.div>
              )}

              {showPreview === 'facebook' && metadata.ogImage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 border border-zinc-300 dark:border-zinc-700 rounded-lg overflow-hidden"
                >
                  <img
                    src={metadata.ogImage}
                    alt="Facebook preview"
                    className="w-full h-40 object-cover"
                  />
                  <div className="p-3 bg-white dark:bg-zinc-900">
                    <p className="text-xs text-zinc-500 dark:text-zinc-500 uppercase">
                      {defaultMetadata.domain}
                    </p>
                    <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100 line-clamp-2">
                      {metadata.ogTitle || metadata.title}
                    </p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">
                      {metadata.ogDescription || metadata.description}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Save Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSaveMetadata}
              disabled={saving}
              className="w-full mt-6 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white rounded-lg font-semibold transition-all disabled:opacity-60"
            >
              {saving ? '💾 Saving...' : '💾 Save SEO Settings'}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
