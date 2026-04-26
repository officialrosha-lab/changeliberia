'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DonationSuccessModalProps {
  isOpen: boolean;
  donationAmount: number;
  donationType: 'once' | 'monthly';
  campaignTitle: string;
  email: string;
  transactionId: string;
  onClose?: () => void;
  onShare?: () => void;
}

export function DonationSuccessModal({
  isOpen,
  donationAmount,
  donationType,
  campaignTitle,
  email,
  transactionId,
  onClose,
  onShare,
}: DonationSuccessModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyTransactionId = () => {
    navigator.clipboard.writeText(transactionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out this campaign!',
          text: `I just donated $${donationAmount} to ${campaignTitle}`,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    }
    onShare?.();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-2xl p-8 border border-zinc-200 dark:border-zinc-800"
          >
            {/* Success Animation */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
                delay: 0.2,
              }}
              className="text-center mb-6"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/30 dark:to-emerald-800/20 rounded-full mb-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="text-4xl"
                >
                  🎉
                </motion.div>
              </div>

              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                Thank You!
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Your donation has been processed successfully
              </p>
            </motion.div>

            {/* Donation Details */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-6 mb-6"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">Amount</span>
                  <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    ${donationAmount}
                  </span>
                </div>

                <div className="border-t border-emerald-200 dark:border-emerald-700 pt-4 flex items-center justify-between">
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">Type</span>
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {donationType === 'once' ? '🎁 One-time' : '📅 Monthly'}
                  </span>
                </div>

                <div className="border-t border-emerald-200 dark:border-emerald-700 pt-4 flex items-center justify-between">
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">Campaign</span>
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 max-w-xs truncate text-right">
                    {campaignTitle}
                  </span>
                </div>

                <div className="border-t border-emerald-200 dark:border-emerald-700 pt-4">
                  <span className="text-sm text-zinc-700 dark:text-zinc-300 block mb-1">
                    Confirmation Email
                  </span>
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    {email}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Receipt Information */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 mb-6"
            >
              <div>
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  Transaction ID
                </p>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-xs font-mono text-zinc-600 dark:text-zinc-400 truncate">
                    {transactionId}
                  </code>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCopyTransactionId}
                    className="px-2 py-1 text-xs font-semibold bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-all"
                  >
                    {copied ? '✓ Copied' : '📋 Copy'}
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* Key Points */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="space-y-2 mb-6"
            >
              <div className="flex items-start gap-2 text-sm">
                <span className="text-emerald-600 dark:text-emerald-400 mt-0.5">✓</span>
                <span className="text-zinc-700 dark:text-zinc-300">
                  Receipt sent to your email
                </span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <span className="text-emerald-600 dark:text-emerald-400 mt-0.5">✓</span>
                <span className="text-zinc-700 dark:text-zinc-300">
                  Your donation helps this campaign
                </span>
              </div>
              {donationType === 'monthly' && (
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-emerald-600 dark:text-emerald-400 mt-0.5">✓</span>
                  <span className="text-zinc-700 dark:text-zinc-300">
                    Your payment will renew monthly
                  </span>
                </div>
              )}
            </motion.div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleShare}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-semibold transition-all"
              >
                📢 Share This Campaign
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="w-full px-4 py-3 border-2 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
              >
                Close
              </motion.button>
            </div>

            {/* Security Badge */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center mt-4"
            >
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                🔒 Transaction secured by Stripe
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
