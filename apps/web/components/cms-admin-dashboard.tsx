'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CMSPage {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  createdAt: Date;
  publishedAt?: Date;
  author: string;
  views: number;
}

interface ContentType {
  id: string;
  name: string;
  slug: string;
  fields: Array<{ name: string; type: string; required: boolean }>;
  createdAt: Date;
  usageCount: number;
}

interface CMSAdminDashboardProps {
  pages: CMSPage[];
  contentTypes: ContentType[];
  onCreatePage?: (title: string, contentType: string) => Promise<void>;
  onEditPage?: (pageId: string) => void;
  onDeletePage?: (pageId: string) => Promise<void>;
  onCreateContentType?: (name: string, fields: any[]) => Promise<void>;
  isLoading?: boolean;
}

export function CMSAdminDashboard({
  pages,
  contentTypes,
  onCreatePage,
  onEditPage,
  onDeletePage,
  onCreateContentType,
  isLoading = false,
}: CMSAdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'pages' | 'content-types' | 'analytics'>('pages');
  const [showCreatePageModal, setShowCreatePageModal] = useState(false);
  const [showCreateTypeModal, setShowCreateTypeModal] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageType, setNewPageType] = useState('');
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeFields, setNewTypeFields] = useState<Array<{ name: string; type: string; required: boolean }>>([]);
  const [filterStatus, setFilterStatus] = useState<string | 'all'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filteredPages = filterStatus === 'all' ? pages : pages.filter(p => p.status === filterStatus);

  const handleCreatePage = async () => {
    if (!newPageTitle.trim() || !newPageType) return;

    setActionLoading('create-page');
    try {
      await onCreatePage?.(newPageTitle, newPageType);
      setNewPageTitle('');
      setNewPageType('');
      setShowCreatePageModal(false);
    } catch (error) {
      console.error('Failed to create page:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddField = () => {
    setNewTypeFields([...newTypeFields, { name: '', type: 'text', required: false }]);
  };

  const handleRemoveField = (index: number) => {
    setNewTypeFields(newTypeFields.filter((_, i) => i !== index));
  };

  const handleCreateContentType = async () => {
    if (!newTypeName.trim()) return;

    setActionLoading('create-type');
    try {
      await onCreateContentType?.(newTypeName, newTypeFields);
      setNewTypeName('');
      setNewTypeFields([]);
      setShowCreateTypeModal(false);
    } catch (error) {
      console.error('Failed to create content type:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: CMSPage['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
      case 'published':
        return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300';
      case 'scheduled':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
      case 'archived':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="w-full space-y-6"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">CMS Dashboard</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            Manage pages, content types, and publishing workflow
          </p>
        </div>

        <div className="flex gap-3">
          {activeTab === 'pages' && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreatePageModal(true)}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white rounded-lg font-semibold transition-all shadow-lg"
            >
              + New Page
            </motion.button>
          )}

          {activeTab === 'content-types' && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateTypeModal(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-semibold transition-all shadow-lg"
            >
              + New Type
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-zinc-200 dark:border-zinc-800">
        {(['pages', 'content-types', 'analytics'] as const).map(tab => (
          <motion.button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-semibold transition-all border-b-2 ${
              activeTab === tab
                ? 'border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            {tab === 'pages' && 'Pages'}
            {tab === 'content-types' && 'Content Types'}
            {tab === 'analytics' && 'Analytics'}
          </motion.button>
        ))}
      </div>

      {/* Pages Tab */}
      <AnimatePresence>
        {activeTab === 'pages' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Filters */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex gap-2 items-center flex-wrap"
            >
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Filter:</span>
              {['all', 'draft', 'published', 'scheduled', 'archived'].map(status => (
                <motion.button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-1 rounded-full text-sm font-medium transition-all ${
                    filterStatus === status
                      ? 'bg-emerald-600 dark:bg-emerald-500 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')}
                </motion.button>
              ))}
            </motion.div>

            {/* Pages List */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="space-y-3"
            >
              {filteredPages.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 text-zinc-500 dark:text-zinc-400"
                >
                  <p className="text-lg font-semibold mb-2">No pages found</p>
                  <p>Create your first page to get started</p>
                </motion.div>
              ) : (
                filteredPages.map((page, index) => (
                  <motion.div
                    key={page.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 hover:shadow-md transition-shadow flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                        {page.title}
                      </h3>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs text-zinc-600 dark:text-zinc-400">
                          /{page.slug}
                        </span>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getStatusColor(page.status)}`}
                        >
                          {page.status.charAt(0).toUpperCase() + page.status.slice(1)}
                        </span>
                        <span className="text-xs text-zinc-600 dark:text-zinc-400">
                          By {page.author}
                        </span>
                        <span className="text-xs text-zinc-600 dark:text-zinc-400">
                          {page.views.toLocaleString()} views
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onEditPage?.(page.id)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-all"
                      >
                        Edit
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onDeletePage?.(page.id)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition-all"
                      >
                        Delete
                      </motion.button>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content Types Tab */}
      <AnimatePresence>
        {activeTab === 'content-types' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {contentTypes.map((type, index) => (
                <motion.div
                  key={type.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 hover:shadow-md transition-shadow"
                >
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                    {type.name}
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                    /{type.slug}
                  </p>

                  <div className="space-y-2 mb-4">
                    <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                      Fields ({type.fields.length})
                    </p>
                    {type.fields.map((field, fieldIndex) => (
                      <div
                        key={fieldIndex}
                        className="flex items-center justify-between text-xs bg-zinc-50 dark:bg-zinc-800 p-2 rounded"
                      >
                        <span className="text-zinc-900 dark:text-zinc-100 font-medium">
                          {field.name}
                        </span>
                        <span className="text-zinc-600 dark:text-zinc-400">
                          {field.type}
                          {field.required && <span className="text-red-600 ml-1">*</span>}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">
                      {type.usageCount} pages using this type
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Edit
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analytics Tab */}
      <AnimatePresence>
        {activeTab === 'analytics' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {[
              { label: 'Total Pages', value: pages.length, icon: '📄' },
              { label: 'Published', value: pages.filter(p => p.status === 'published').length, icon: '🚀' },
              { label: 'Drafts', value: pages.filter(p => p.status === 'draft').length, icon: '✏️' },
              {
                label: 'Total Views',
                value: pages.reduce((sum, p) => sum + p.views, 0).toLocaleString(),
                icon: '👁️',
              },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                      {stat.label}
                    </p>
                    <motion.p
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.05 + 0.1 }}
                      className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mt-2"
                    >
                      {stat.value}
                    </motion.p>
                  </div>
                  <span className="text-4xl">{stat.icon}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Page Modal */}
      {showCreatePageModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center z-50 bg-black/50"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-2xl p-6 border border-zinc-200 dark:border-zinc-800"
          >
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              Create New Page
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  Page Title *
                </label>
                <input
                  type="text"
                  value={newPageTitle}
                  onChange={e => setNewPageTitle(e.target.value)}
                  placeholder="e.g., Featured Campaign"
                  className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  Content Type *
                </label>
                <select
                  value={newPageType}
                  onChange={e => setNewPageType(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">Select a content type...</option>
                  {contentTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowCreatePageModal(false)}
                className="flex-1 px-4 py-2 border-2 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreatePage}
                disabled={actionLoading === 'create-page' || !newPageTitle.trim() || !newPageType}
                className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white rounded-lg font-semibold transition-all disabled:opacity-60"
              >
                {actionLoading === 'create-page' ? 'Creating...' : 'Create'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Create Content Type Modal */}
      {showCreateTypeModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-2xl p-6 border border-zinc-200 dark:border-zinc-800 max-h-96 overflow-y-auto"
          >
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              Create Content Type
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  Type Name *
                </label>
                <input
                  type="text"
                  value={newTypeName}
                  onChange={e => setNewTypeName(e.target.value)}
                  placeholder="e.g., Blog Post"
                  className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    Fields
                  </label>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAddField}
                    className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded"
                  >
                    + Add Field
                  </motion.button>
                </div>

                {newTypeFields.map((field, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={field.name}
                      onChange={e =>
                        setNewTypeFields(
                          newTypeFields.map((f, i) =>
                            i === index ? { ...f, name: e.target.value } : f
                          )
                        )
                      }
                      placeholder="Field name"
                      className="flex-1 px-2 py-1 text-sm rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                    />
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleRemoveField(index)}
                      className="px-2 py-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                    >
                      ✕
                    </motion.button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowCreateTypeModal(false)}
                className="flex-1 px-4 py-2 border-2 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreateContentType}
                disabled={actionLoading === 'create-type' || !newTypeName.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-semibold transition-all disabled:opacity-60"
              >
                {actionLoading === 'create-type' ? 'Creating...' : 'Create'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
