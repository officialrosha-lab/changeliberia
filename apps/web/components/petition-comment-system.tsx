'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FormTextarea } from './form-textarea';

interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: Date;
  likes: number;
  replies?: Comment[];
  isModeratorApproved?: boolean;
  isPending?: boolean;
}

interface CommentSystemProps {
  petitionId: string;
  comments: Comment[];
  onAddComment: (content: string) => Promise<void>;
  onLikeComment?: (commentId: string) => Promise<void>;
  onReplyComment?: (commentId: string, content: string) => Promise<void>;
  isAuthenticated?: boolean;
  currentUserName?: string;
  totalComments?: number;
}

export function CommentSystem({
  petitionId,
  comments,
  onAddComment,
  onLikeComment,
  onReplyComment,
  isAuthenticated = false,
  currentUserName = 'Anonymous',
  totalComments = 0,
}: CommentSystemProps) {
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmitComment = async () => {
    if (!commentText.trim()) {
      setSubmitError('Comment cannot be empty');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await onAddComment(commentText);
      setCommentText('');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (commentId: string) => {
    if (likedComments.has(commentId)) {
      setLikedComments(prev => {
        const newSet = new Set(prev);
        newSet.delete(commentId);
        return newSet;
      });
    } else {
      setLikedComments(prev => new Set([...prev, commentId]));
    }

    if (onLikeComment) {
      try {
        await onLikeComment(commentId);
      } catch (error) {
        console.error('Failed to like comment:', error);
      }
    }
  };

  const toggleExpanded = (commentId: string) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
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
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">
          Comments
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          {totalComments} {totalComments === 1 ? 'comment' : 'comments'}
        </p>
      </motion.div>

      {/* Comment Input */}
      {isAuthenticated ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-900 p-4 space-y-3"
        >
          <div>
            <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
              Share your thoughts
            </label>
            <FormTextarea
              ref={undefined}
              placeholder="What do you think about this petition?"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              maxLength={500}
              rows={3}
            />
          </div>

          {submitError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded p-2 text-sm text-red-600 dark:text-red-400"
            >
              {submitError}
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmitComment}
            disabled={isSubmitting || !commentText.trim()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white rounded-lg font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="h-5 w-5 border-2 border-current border-t-transparent rounded-full mx-auto"
              />
            ) : (
              'Post Comment'
            )}
          </motion.button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900 p-4 text-center"
        >
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Sign in to post a comment
          </p>
        </motion.div>
      )}

      {/* Comments List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        <AnimatePresence>
          {comments.map((comment, index) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 space-y-3"
            >
              {/* Comment Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold text-sm"
                  >
                    {comment.author.charAt(0).toUpperCase()}
                  </motion.div>
                  <div>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {comment.author}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-500">
                      {comment.timestamp.toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {comment.isPending && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 px-2 py-1 rounded"
                  >
                    Pending review
                  </motion.span>
                )}
                {comment.isModeratorApproved && (
                  <motion.span
                    initial={{ opacity: 0, rotate: -45 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Verified
                  </motion.span>
                )}
              </div>

              {/* Comment Content */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className={`text-zinc-700 dark:text-zinc-300 ${
                  comment.isPending ? 'opacity-75' : ''
                }`}
              >
                {comment.content}
              </motion.p>

              {/* Comment Actions */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="flex items-center gap-4 pt-2"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleLike(comment.id)}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-all ${
                    likedComments.has(comment.id)
                      ? 'bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400'
                      : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                  </svg>
                  <span className="text-sm font-medium">{comment.likes}</span>
                </motion.button>

                {isAuthenticated && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-all text-sm font-medium"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5z" />
                      <path d="M5 8.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
                      <path d="M15 8.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
                    </svg>
                    Reply
                  </motion.button>
                )}

                {comment.replies && comment.replies.length > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleExpanded(comment.id)}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-all text-sm font-medium"
                  >
                    <motion.svg
                      animate={{ rotate: expandedComments.has(comment.id) ? 180 : 0 }}
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM7.707 9.293a1 1 0 010 1.414L10 13.414l2.293-2.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </motion.svg>
                    {comment.replies.length} replies
                  </motion.button>
                )}
              </motion.div>

              {/* Reply Form */}
              {replyingTo === comment.id && isAuthenticated && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2"
                >
                  <FormTextarea
                    ref={undefined}
                    placeholder="Write a reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    maxLength={280}
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyText('');
                      }}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all text-sm font-medium"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={async () => {
                        if (onReplyComment && replyText.trim()) {
                          await onReplyComment(comment.id, replyText);
                          setReplyText('');
                          setReplyingTo(null);
                        }
                      }}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white transition-all text-sm font-medium"
                    >
                      Reply
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Expanded Replies */}
              {expandedComments.has(comment.id) && comment.replies && comment.replies.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3 ml-4"
                >
                  <AnimatePresence>
                    {comment.replies.map((reply, replyIndex) => (
                      <motion.div
                        key={reply.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ delay: replyIndex * 0.03 }}
                        className="bg-zinc-50 dark:bg-zinc-800/50 rounded p-3 space-y-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            {reply.author}
                          </span>
                          <span className="text-xs text-zinc-500 dark:text-zinc-500">
                            {reply.timestamp.toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-700 dark:text-zinc-300">
                          {reply.content}
                        </p>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {comments.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center py-12"
        >
          <p className="text-zinc-500 dark:text-zinc-400">
            No comments yet. Be the first to share your thoughts!
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
