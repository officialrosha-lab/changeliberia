'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type PublishStatus = 'draft' | 'pending_review' | 'approved' | 'published' | 'scheduled' | 'archived';

export interface PublishingState {
  id: string;
  title: string;
  status: PublishStatus;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  scheduledAt?: Date;
  createdBy: string;
  lastModifiedBy: string;
  reviewComments?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
}

interface VersionHistory {
  version: number;
  timestamp: Date;
  author: string;
  status: PublishStatus;
  changes: string;
}

interface PublishingPanelProps {
  content: PublishingState;
  versions: VersionHistory[];
  onSubmitForReview?: (contentId: string) => Promise<void>;
  onApprove?: (contentId: string) => Promise<void>;
  onPublish?: (contentId: string, scheduledAt?: Date) => Promise<void>;
  onArchive?: (contentId: string) => Promise<void>;
  onRevert?: (contentId: string, version: number) => Promise<void>;
  isLoading?: boolean;
}

const statusColors: Record<PublishStatus, { bg: string; text: string; icon: string }> = {
  draft: {
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-700 dark:text-gray-300',
    icon: '✏️',
  },
  pending_review: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-300',
    icon: '👁️',
  },
  approved: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
    icon: '✔️',
  },
  published: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-300',
    icon: '🚀',
  },
  scheduled: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-700 dark:text-purple-300',
    icon: '⏱️',
  },
  archived: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
    icon: '🗑️',
  },
};

const statusLabels: Record<PublishStatus, string> = {
  draft: 'Draft',
  pending_review: 'Pending Review',
  approved: 'Approved',
  published: 'Published',
  scheduled: 'Scheduled',
  archived: 'Archived',
};

export function PublishingPanel({
  content,
  versions,
  onSubmitForReview,
  onApprove,
  onPublish,
  onArchive,
  onRevert,
  isLoading = false,
}: PublishingPanelProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'schedule'>('overview');
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const colors = statusColors[content.status];

  const handleAction = async (action: string) => {
    setActionLoading(action);
    try {
      switch (action) {
        case 'review':
          await onSubmitForReview?.(content.id);
          setActionMessage({ type: 'success', text: 'Content submitted for review' });
          break;
        case 'approve':
          await onApprove?.(content.id);
          setActionMessage({ type: 'success', text: 'Content approved' });
          break;
        case 'publish':
          await onPublish?.(content.id);
          setActionMessage({ type: 'success', text: 'Content published successfully' });
          break;
        case 'schedule':
          if (!scheduledDate) {
            setActionMessage({ type: 'error', text: 'Please select a date' });
            return;
          }
          await onPublish?.(content.id, new Date(scheduledDate));
          setActionMessage({ type: 'success', text: 'Content scheduled successfully' });
          setShowScheduler(false);
          break;
        case 'archive':
          await onArchive?.(content.id);
          setActionMessage({ type: 'success', text: 'Content archived' });
          break;
      }
      setTimeout(() => setActionMessage(null), 3000);
    } catch (error) {
      setActionMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Action failed',
      });
    } finally {
      setActionLoading(null);
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
      >
        <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
          {content.title}
        </h2>

        {/* Status Badge */}
        <div className="flex items-center gap-3 flex-wrap">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold ${colors.bg} ${colors.text}`}
          >
            <span className="text-lg">{colors.icon}</span>
            {statusLabels[content.status]}
          </motion.div>

          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            Version {content.version}
          </div>

          {content.scheduledAt && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full"
            >
              Scheduled for {new Date(content.scheduledAt).toLocaleDateString()}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Action Message */}
      {actionMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg text-sm font-medium ${
            actionMessage.type === 'success'
              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
          }`}
        >
          {actionMessage.text}
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 border-b border-zinc-200 dark:border-zinc-800">
        {(['overview', 'history', 'schedule'] as const).map(tab => (
          <motion.button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-semibold transition-all border-b-2 ${
              activeTab === tab
                ? 'border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1).replace(/_/g, ' ')}
          </motion.button>
        ))}
      </div>

      {/* Overview Tab */}
      <AnimatePresence>
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Workflow Status */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6"
            >
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                Publishing Workflow
              </h3>

              {/* Status Flow */}
              <div className="flex items-center justify-between mb-6 overflow-x-auto">
                {(['draft', 'pending_review', 'approved', 'published'] as const).map((status, index) => {
                  const isActive = ['draft', 'pending_review', 'approved', 'published'].indexOf(
                    content.status
                  ) >= index;
                  const isCurrent = content.status === status;

                  return (
                    <motion.div
                      key={status}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex-1 flex flex-col items-center"
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 transition-all ${
                          isActive
                            ? 'bg-emerald-600 dark:bg-emerald-500 text-white'
                            : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                        } ${isCurrent ? 'ring-4 ring-emerald-300 dark:ring-emerald-700' : ''}`}
                      >
                        {index + 1}
                      </div>
                      <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 text-center">
                        {statusLabels[status]}
                      </p>

                      {/* Connector Line */}
                      {index < 3 && (
                        <div
                          className={`absolute w-12 h-1 mt-12 ml-16 transition-all ${
                            isActive
                              ? 'bg-emerald-600 dark:bg-emerald-500'
                              : 'bg-zinc-200 dark:bg-zinc-800'
                          }`}
                        />
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Content Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                    Created By
                  </p>
                  <p className="text-sm text-zinc-900 dark:text-zinc-100">{content.createdBy}</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 }}
                >
                  <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                    Created
                  </p>
                  <p className="text-sm text-zinc-900 dark:text-zinc-100">
                    {content.createdAt.toLocaleDateString()}
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                    Last Modified
                  </p>
                  <p className="text-sm text-zinc-900 dark:text-zinc-100">
                    {content.updatedAt.toLocaleDateString()}
                  </p>
                </motion.div>

                {content.publishedAt && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.35 }}
                  >
                    <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                      Published
                    </p>
                    <p className="text-sm text-zinc-900 dark:text-zinc-100">
                      {content.publishedAt.toLocaleDateString()}
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Review Comments */}
            {content.status === 'pending_review' && content.reviewComments && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-6"
              >
                <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                  Reviewer Notes
                </h4>
                <p className="text-amber-800 dark:text-amber-200">{content.reviewComments}</p>
                {content.reviewedBy && (
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-3">
                    By {content.reviewedBy} on {content.reviewedAt?.toLocaleDateString()}
                  </p>
                )}
              </motion.div>
            )}

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex gap-3 flex-wrap"
            >
              {content.status === 'draft' && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAction('review')}
                  disabled={actionLoading === 'review' || isLoading}
                  className="px-6 py-2 bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white rounded-lg font-semibold transition-all disabled:opacity-60"
                >
                  {actionLoading === 'review' ? 'Submitting...' : 'Submit for Review'}
                </motion.button>
              )}

              {content.status === 'pending_review' && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAction('approve')}
                    disabled={actionLoading === 'approve' || isLoading}
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white rounded-lg font-semibold transition-all disabled:opacity-60"
                  >
                    {actionLoading === 'approve' ? 'Approving...' : 'Approve'}
                  </motion.button>
                </>
              )}

              {(content.status === 'approved' || content.status === 'draft') && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAction('publish')}
                    disabled={actionLoading === 'publish' || isLoading}
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white rounded-lg font-semibold transition-all disabled:opacity-60"
                  >
                    {actionLoading === 'publish' ? 'Publishing...' : 'Publish Now'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowScheduler(!showScheduler)}
                    className="px-6 py-2 border-2 border-purple-600 dark:border-purple-500 text-purple-600 dark:text-purple-400 rounded-lg font-semibold hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-all"
                  >
                    Schedule
                  </motion.button>
                </>
              )}

              {content.status !== 'archived' && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAction('archive')}
                  disabled={actionLoading === 'archive' || isLoading}
                  className="px-6 py-2 border-2 border-red-600 dark:border-red-500 text-red-600 dark:text-red-400 rounded-lg font-semibold hover:bg-red-50 dark:hover:bg-red-950/30 transition-all disabled:opacity-60"
                >
                  Archive
                </motion.button>
              )}
            </motion.div>

            {/* Schedule Picker */}
            {showScheduler && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900 rounded-lg p-6"
              >
                <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-4">
                  Schedule Publishing
                </h4>
                <div className="space-y-4">
                  <input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={e => setScheduledDate(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-purple-300 dark:border-purple-700 bg-white dark:bg-purple-900 text-zinc-900 dark:text-zinc-100"
                  />
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAction('schedule')}
                      disabled={actionLoading === 'schedule' || !scheduledDate}
                      className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white rounded-lg font-semibold transition-all disabled:opacity-60"
                    >
                      {actionLoading === 'schedule' ? 'Scheduling...' : 'Schedule'}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowScheduler(false)}
                      className="flex-1 px-4 py-2 border-2 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 rounded-lg font-semibold hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-all"
                    >
                      Cancel
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* History Tab */}
      <AnimatePresence>
        {activeTab === 'history' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-3"
          >
            {versions.map((version, index) => (
              <motion.div
                key={version.version}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      Version {version.version}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${statusColors[version.status].bg} ${statusColors[version.status].text}`}>
                      {statusLabels[version.status]}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                    {version.author} • {version.timestamp.toLocaleDateString()}
                  </p>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">{version.changes}</p>
                </div>

                {version.version !== content.version && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onRevert?.(content.id, version.version)}
                    className="px-4 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                  >
                    Revert
                  </motion.button>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
