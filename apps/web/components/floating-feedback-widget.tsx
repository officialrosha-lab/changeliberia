'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { apiPost } from '../lib/api';

type FeedbackState = 'idle' | 'collapsed' | 'expanded' | 'submitting' | 'success' | 'error';

interface FloatingFeedbackWidgetProps {
  enabled?: boolean;
}

export function FloatingFeedbackWidget({ enabled = true }: FloatingFeedbackWidgetProps) {
  const [state, setState] = useState<FeedbackState>('collapsed');
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);

    // Handle click outside to collapse
    function handleClickOutside(event: MouseEvent) {
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        if (state === 'expanded') {
          setState('collapsed');
        }
      }
    }

    if (state === 'expanded') {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [state]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');

    if (!message.trim()) {
      setErrorMsg('Please enter your feedback or suggestion');
      return;
    }

    if (!name.trim()) {
      setErrorMsg('Please enter your name');
      return;
    }

    setState('submitting');

    try {
      await apiPost('/feedback', {
        name: name.trim(),
        email: email.trim() || undefined,
        message: message.trim(),
        source: 'floating-widget',
        timestamp: new Date().toISOString(),
      });

      setState('success');
      setName('');
      setEmail('');
      setMessage('');

      // Auto-collapse after 3 seconds
      setTimeout(() => {
        setState('collapsed');
      }, 3000);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Failed to submit feedback');
      setState('error');
    }
  }

  if (!enabled || !mounted) {
    return null;
  }

  const portal = createPortal(
    <div ref={widgetRef} className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 safe-bottom">
      <AnimatePresence mode="wait">
        {/* Collapsed state - just icon button */}
        {state === 'collapsed' && (
          <motion.button
            key="collapsed"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={() => setState('expanded')}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center"
            aria-label="Open feedback form"
            title="Send us feedback"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-6 h-6"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <circle cx="9" cy="10" r="1" />
              <circle cx="12" cy="10" r="1" />
              <circle cx="15" cy="10" r="1" />
            </svg>
          </motion.button>
        )}

        {/* Expanded state - form */}
        {(state === 'expanded' || state === 'submitting' || state === 'success' || state === 'error') && (
          <motion.div
            key="expanded"
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="absolute bottom-0 right-0 w-80 max-w-[calc(100vw-1rem)] bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-neutral-800 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Send us feedback</h3>
              <button
                onClick={() => setState('collapsed')}
                className="text-white hover:text-emerald-100 transition"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Success state */}
            {state === 'success' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-8 h-8 text-emerald-600 dark:text-emerald-400"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h4 className="font-semibold text-zinc-900 dark:text-white mb-2">Thank you!</h4>
                <p className="text-sm text-zinc-600 dark:text-neutral-400">
                  Your feedback helps us improve. We appreciate your input!
                </p>
              </motion.div>
            )}

            {/* Error state */}
            {state === 'error' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-8 h-8 text-red-600 dark:text-red-400"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h4 className="font-semibold text-zinc-900 dark:text-white mb-2">Oops!</h4>
                <p className="text-sm text-red-600 dark:text-red-400 mb-4">{errorMsg}</p>
                <button
                  onClick={() => setState('expanded')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-sm transition"
                >
                  Try Again
                </button>
              </motion.div>
            )}

            {/* Form state */}
            {(state === 'expanded' || state === 'submitting') && (
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Name field */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-neutral-300 mb-1.5">
                    Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={state === 'submitting'}
                    placeholder="Your name"
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Email field */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-neutral-300 mb-1.5">
                    Email (optional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={state === 'submitting'}
                    placeholder="your@email.com"
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Message field */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-neutral-300 mb-1.5">
                    Your feedback
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={state === 'submitting'}
                    placeholder="Tell us what you think..."
                    rows={4}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Error message */}
                {errorMsg && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-lg"
                  >
                    <p className="text-sm text-red-600 dark:text-red-400">{errorMsg}</p>
                  </motion.div>
                )}

                {/* Buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setState('collapsed')}
                    disabled={state === 'submitting'}
                    className="flex-1 px-4 py-2 border border-zinc-300 dark:border-neutral-700 text-zinc-700 dark:text-neutral-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-neutral-800 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={state === 'submitting'}
                    className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {state === 'submitting' ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" />
                          <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Sending...
                      </>
                    ) : (
                      'Send Feedback'
                    )}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body,
  );

  return portal;
}
