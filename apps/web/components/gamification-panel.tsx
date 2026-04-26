'use client';

import { motion, AnimatePresence } from 'framer-motion';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: Date;
  progress?: number;
  maxProgress?: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  unlockedAt?: Date;
  isUnlocked: boolean;
}

interface GamificationPanelProps {
  badges: Badge[];
  achievements: Achievement[];
  totalPoints: number;
  userLevel: number;
  levelProgress: number;
  levelMaxProgress: number;
}

const rarityColors: Record<Badge['rarity'], { bg: string; border: string; text: string }> = {
  common: {
    bg: 'bg-gray-100 dark:bg-gray-800',
    border: 'border-gray-300 dark:border-gray-600',
    text: 'text-gray-700 dark:text-gray-300',
  },
  uncommon: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    border: 'border-green-300 dark:border-green-600',
    text: 'text-green-700 dark:text-green-300',
  },
  rare: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    border: 'border-blue-300 dark:border-blue-600',
    text: 'text-blue-700 dark:text-blue-300',
  },
  epic: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    border: 'border-purple-300 dark:border-purple-600',
    text: 'text-purple-700 dark:text-purple-300',
  },
  legendary: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    border: 'border-yellow-300 dark:border-yellow-600',
    text: 'text-yellow-700 dark:text-yellow-300',
  },
};

export function GamificationPanel({
  badges,
  achievements,
  totalPoints,
  userLevel,
  levelProgress,
  levelMaxProgress,
}: GamificationPanelProps) {
  const levelPercentage = (levelProgress / levelMaxProgress) * 100;
  const unlockedBadges = badges.filter(b => b.unlockedAt);
  const unlockedAchievements = achievements.filter(a => a.isUnlocked);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="w-full space-y-6"
    >
      {/* Header with Level and Points */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white md:p-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm font-semibold opacity-90 mb-1">Current Level</p>
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="flex items-baseline gap-2"
            >
              <span className="text-5xl font-bold">{userLevel}</span>
              <span className="text-lg opacity-75">Activist</span>
            </motion.div>
          </div>

          <motion.div
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            className="text-right"
          >
            <p className="text-sm font-semibold opacity-90">Total Points</p>
            <p className="text-3xl font-bold">{totalPoints.toLocaleString()}</p>
          </motion.div>
        </div>

        {/* Level Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress to Level {userLevel + 1}</span>
            <span>{levelProgress.toLocaleString()} / {levelMaxProgress.toLocaleString()}</span>
          </div>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            className="w-full bg-white/30 rounded-full h-2 overflow-hidden"
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${levelPercentage}%` }}
              transition={{ delay: 0.3, duration: 1, type: 'spring', stiffness: 50, damping: 20 }}
              className="h-full bg-white rounded-full"
            />
          </motion.div>
        </div>
      </motion.div>

      {/* Badges Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Badges ({unlockedBadges.length}/{badges.length})
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          <AnimatePresence>
            {badges.map((badge, index) => {
              const isUnlocked = !!badge.unlockedAt;
              const colors = rarityColors[badge.rarity];

              return (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, scale: 0.8, rotate: -180 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.8, rotate: 180 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={isUnlocked ? { scale: 1.1, rotate: 5 } : {}}
                  className={`relative rounded-lg border-2 p-4 text-center cursor-pointer transition-all group ${
                    colors.bg
                  } ${colors.border} ${!isUnlocked ? 'opacity-50 grayscale' : ''}`}
                >
                  <div className="text-3xl mb-2">{badge.icon}</div>

                  <h4 className={`text-sm font-bold ${colors.text}`}>{badge.name}</h4>

                  <p className="text-xs opacity-75 mt-1 line-clamp-2">{badge.description}</p>

                  {/* Unlock Date */}
                  {isUnlocked && badge.unlockedAt && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute top-2 right-2"
                    >
                      <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </motion.div>
                  )}

                  {/* Progress Bar for In-Progress Badges */}
                  {!isUnlocked && badge.progress !== undefined && badge.maxProgress !== undefined && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-1.5 mt-2 overflow-hidden"
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${(badge.progress / badge.maxProgress) * 100}%`,
                        }}
                        transition={{ duration: 0.5 }}
                        className="h-full bg-purple-500"
                      />
                    </motion.div>
                  )}

                  {/* Hover Tooltip */}
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    whileHover={{ opacity: 1, y: 0 }}
                    className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-zinc-900 dark:bg-zinc-800 text-white text-xs rounded whitespace-nowrap pointer-events-none"
                  >
                    {badge.rarity.charAt(0).toUpperCase() + badge.rarity.slice(1)}
                  </motion.div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Achievements Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Achievements ({unlockedAchievements.length}/{achievements.length})
        </h3>

        <div className="space-y-3">
          <AnimatePresence>
            {achievements.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className={`rounded-lg border-2 p-4 transition-all ${
                  achievement.isUnlocked
                    ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900'
                    : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 opacity-50 grayscale'
                }`}
              >
                <div className="flex items-start gap-4">
                  <motion.div
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: index * 0.05 + 0.1 }}
                    className="text-3xl flex-shrink-0"
                  >
                    {achievement.icon}
                  </motion.div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-bold text-zinc-900 dark:text-zinc-100">
                        {achievement.title}
                      </h4>
                      {achievement.isUnlocked && achievement.unlockedAt && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-xs text-amber-600 dark:text-amber-400 font-semibold"
                        >
                          ✓ Unlocked
                        </motion.span>
                      )}
                    </div>

                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                      {achievement.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <motion.span
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="inline-block px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-sm font-bold rounded-full"
                      >
                        +{achievement.points} pts
                      </motion.span>

                      {achievement.isUnlocked && achievement.unlockedAt && (
                        <span className="text-xs text-zinc-500 dark:text-zinc-500">
                          {achievement.unlockedAt.toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Stats Summary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-3 gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-800"
      >
        {[
          { label: 'Badges', value: unlockedBadges.length, total: badges.length },
          {
            label: 'Achievements',
            value: unlockedAchievements.length,
            total: achievements.length,
          },
          { label: 'Level', value: userLevel, total: '∞' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + index * 0.05 }}
            className="text-center"
          >
            <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {stat.value}
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              {stat.label} {stat.total !== '∞' && `(of ${stat.total})`}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
