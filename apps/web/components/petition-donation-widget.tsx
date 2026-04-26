'use client';

import { motion } from 'framer-motion';

interface PetitionDonationWidgetProps {
  petitionId: string;
  petitionTitle: string;
  fundingGoal: number;
  amountRaised: number;
  donorCount: number;
  daysLeft?: number;
  onDonate?: () => void;
  compactMode?: boolean;
}

export function PetitionDonationWidget({
  petitionTitle,
  fundingGoal,
  amountRaised,
  donorCount,
  daysLeft,
  onDonate,
  compactMode = false,
}: PetitionDonationWidgetProps) {
  const progressPercent = Math.min((amountRaised / fundingGoal) * 100, 100);
  const remaining = Math.max(fundingGoal - amountRaised, 0);

  if (compactMode) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold text-emerald-900 dark:text-emerald-100">
            Help fund this petition
          </h4>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onDonate}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold transition-all"
          >
            💝 Donate
          </motion.button>
        </div>

        <div className="space-y-2">
          <div className="w-full h-2 bg-emerald-200 dark:bg-emerald-900/50 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ type: 'spring', stiffness: 100, damping: 20 }}
              className="h-full bg-emerald-500"
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-emerald-900 dark:text-emerald-100">
              ${amountRaised.toLocaleString()} raised
            </span>
            <span className="text-emerald-700 dark:text-emerald-300">
              {Math.round(progressPercent)}%
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-300">
            <span>{donorCount} supporters</span>
            {daysLeft && <span>{daysLeft}d left</span>}
          </div>
        </div>
      </motion.div>
    );
  }

  // Full mode
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 shadow-lg"
    >
      {/* Header */}
      <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">
        💰 Support This Petition
      </h3>

      {/* Progress Bar */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Funding Progress
          </span>
          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
            {Math.round(progressPercent)}%
          </span>
        </div>

        <div className="w-full h-4 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{
              type: 'spring',
              stiffness: 100,
              damping: 20,
              delay: 0.1,
            }}
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600"
          />
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            ${amountRaised.toLocaleString()} raised
          </span>
          <span className="text-zinc-600 dark:text-zinc-400">
            Goal: ${fundingGoal.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6 pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-center"
        >
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {donorCount}
          </p>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">Supporters</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            ${remaining.toLocaleString()}
          </p>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">To Goal</p>
        </motion.div>
      </div>

      {/* Call to Action */}
      {daysLeft && daysLeft > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-6 text-xs text-amber-800 dark:text-amber-200"
        >
          ⏰ Only {daysLeft} day{daysLeft !== 1 ? 's' : ''} left to support this petition!
        </motion.div>
      )}

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onDonate}
        className="w-full px-6 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 dark:from-emerald-500 dark:to-emerald-600 hover:from-emerald-700 hover:to-emerald-800 dark:hover:from-emerald-600 dark:hover:to-emerald-700 text-white rounded-lg font-bold text-lg transition-all shadow-lg"
      >
        💝 Make a Donation
      </motion.button>

      {/* Security Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center mt-4"
      >
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          🔒 Secured by Stripe • 100% transparent
        </p>
      </motion.div>
    </motion.div>
  );
}
