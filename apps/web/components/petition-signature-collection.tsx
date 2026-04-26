'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FormInput } from './form-input';

interface Signature {
  id: string;
  name: string;
  location?: string;
  timestamp: Date;
  message?: string;
}

interface SignatureCollectionProps {
  petitionId: string;
  goal: number;
  currentCount: number;
  recentSignatures: Signature[];
  onSign: (data: { name: string; location?: string; message?: string }) => Promise<void>;
  isLoading?: boolean;
  canSign?: boolean;
}

export function SignatureCollection({
  petitionId,
  goal,
  currentCount,
  recentSignatures,
  onSign,
  isLoading = false,
  canSign = true,
}: SignatureCollectionProps) {
  const [isSigningModalOpen, setIsSigningModalOpen] = useState(false);
  const [signingFormData, setSigningFormData] = useState({
    name: '',
    location: '',
    message: '',
  });
  const [isSigning, setIsSigning] = useState(false);
  const [signError, setSignError] = useState<string | null>(null);

  const progress = Math.min((currentCount / goal) * 100, 100);
  const percentage = Math.round(progress);
  const remaining = goal - currentCount;

  const handleSign = async () => {
    if (!signingFormData.name.trim()) {
      setSignError('Name is required');
      return;
    }

    setIsSigning(true);
    setSignError(null);

    try {
      await onSign(signingFormData);
      setIsSigningModalOpen(false);
      setSigningFormData({ name: '', location: '', message: '' });
    } catch (error) {
      setSignError(error instanceof Error ? error.message : 'Failed to sign petition');
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="w-full"
    >
      {/* Header with Progress */}
      <div className="bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-950/30 dark:to-blue-950/30 rounded-xl p-6 border border-emerald-200 dark:border-emerald-900 mb-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-between mb-4"
        >
          <div>
            <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100 mb-1">
              Signatures Needed
            </p>
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="flex items-baseline gap-2"
            >
              <span className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                {currentCount.toLocaleString()}
              </span>
              <span className="text-lg text-emerald-700 dark:text-emerald-300">
                of {goal.toLocaleString()}
              </span>
            </motion.div>
          </div>

          {remaining > 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-right"
            >
              <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
                {remaining.toLocaleString()} to go
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                {percentage}% complete
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm font-bold">Goal Reached!</span>
            </motion.div>
          )}
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.2 }}
          className="w-full bg-emerald-200 dark:bg-emerald-900/50 rounded-full h-3 overflow-hidden"
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ delay: 0.3, duration: 1, type: 'spring', stiffness: 50, damping: 20 }}
            className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full"
          />
        </motion.div>
      </div>

      {/* Sign Button */}
      {canSign && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsSigningModalOpen(true)}
          disabled={isLoading || isSigning}
          className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed mb-6"
        >
          {isLoading || isSigning ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="h-5 w-5 border-2 border-current border-t-transparent rounded-full mx-auto"
            />
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.5 1.5H5.75A2.25 2.25 0 003.5 3.75v12.5A2.25 2.25 0 005.75 18.5h8.5a2.25 2.25 0 002.25-2.25V9.5" />
                <path d="M9.5 11l2 2 4-5" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </svg>
              Sign This Petition
            </span>
          )}
        </motion.button>
      )}

      {/* Recent Signers */}
      {recentSignatures.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">
            Recent Signatures
          </h3>
          <div className="space-y-3">
            <AnimatePresence>
              {recentSignatures.map((signature, index) => (
                <motion.div
                  key={signature.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-blue-400 flex items-center justify-center text-white font-bold"
                    >
                      {signature.name.charAt(0).toUpperCase()}
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {signature.name}
                      </p>
                      {signature.location && (
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          {signature.location}
                        </p>
                      )}
                      {signature.message && (
                        <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-1 italic">
                          "{signature.message}"
                        </p>
                      )}
                      <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                        {signature.timestamp.toLocaleDateString()}
                      </p>
                    </div>
                    <motion.div
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="text-emerald-600 dark:text-emerald-400"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Signing Modal */}
      <AnimatePresence>
        {isSigningModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSigningModalOpen(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md mx-4 z-50"
            >
              <div className="bg-white dark:bg-zinc-950 rounded-xl shadow-2xl p-6 border border-zinc-200 dark:border-zinc-800">
                <motion.h2
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4"
                >
                  Add Your Signature
                </motion.h2>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="space-y-4 mb-6"
                >
                  <div>
                    <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                      Full Name <span className="text-red-600">*</span>
                    </label>
                    <FormInput
                      type="text"
                      placeholder="Your name"
                      value={signingFormData.name}
                      onChange={(e) => setSigningFormData({ ...signingFormData, name: e.target.value })}
                      ref={undefined}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                      Location (Optional)
                    </label>
                    <FormInput
                      type="text"
                      placeholder="City, State"
                      value={signingFormData.location}
                      onChange={(e) => setSigningFormData({ ...signingFormData, location: e.target.value })}
                      ref={undefined}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                      Message (Optional)
                    </label>
                    <textarea
                      placeholder="Why are you signing? (max 280 characters)"
                      value={signingFormData.message}
                      onChange={(e) =>
                        setSigningFormData({
                          ...signingFormData,
                          message: e.target.value.slice(0, 280),
                        })
                      }
                      maxLength={280}
                      className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none h-20"
                    />
                    <p className="text-xs text-zinc-500 mt-1">
                      {signingFormData.message?.length || 0} / 280
                    </p>
                  </div>

                  {signError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-3 text-sm text-red-600 dark:text-red-400"
                    >
                      {signError}
                    </motion.div>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex gap-3"
                >
                  <button
                    onClick={() => setIsSigningModalOpen(false)}
                    className="flex-1 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSign}
                    disabled={isSigning || !signingFormData.name.trim()}
                    className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white rounded-lg font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSigning ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="h-5 w-5 border-2 border-current border-t-transparent rounded-full mx-auto"
                      />
                    ) : (
                      'Sign'
                    )}
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
