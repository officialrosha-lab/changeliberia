'use client';

import { motion } from 'framer-motion';

interface DataPoint {
  date: string;
  signatures: number;
  comments: number;
  views: number;
}

interface AnalyticsStat {
  label: string;
  value: number | string;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon: string;
}

interface AnalyticsDashboardProps {
  petitionTitle: string;
  stats: AnalyticsStat[];
  chartData: DataPoint[];
  topReferrers?: Array<{ source: string; count: number }>;
  demographics?: {
    locations: Array<{ location: string; count: number }>;
    ageGroups?: Array<{ group: string; count: number }>;
  };
}

export function AnalyticsDashboard({
  petitionTitle,
  stats,
  chartData,
  topReferrers = [],
  demographics,
}: AnalyticsDashboardProps) {
  const maxSignatures = Math.max(...chartData.map(d => d.signatures), 1);

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
        <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          Analytics Dashboard
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400 mt-2">
          {petitionTitle}
        </p>
      </motion.div>

      {/* Key Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 + index * 0.05 }}
            className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-2xl">{stat.icon}</span>
              {stat.trend && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`flex items-center gap-1 text-xs font-semibold ${
                    stat.trend === 'up'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : stat.trend === 'down'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {stat.trend === 'up' && (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414-1.414L13.586 7H12z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  {stat.trend === 'down' && (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M12 13a1 1 0 110 2H7a1 1 0 01-1-1V9a1 1 0 112 0v3.586l4.293-4.293a1 1 0 011.414 1.414L9.414 13H12z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  {stat.change && `${stat.change > 0 ? '+' : ''}${stat.change}%`}
                </motion.div>
              )}
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 + index * 0.05 + 0.1 }}
              className="text-2xl font-bold text-zinc-900 dark:text-zinc-100"
            >
              {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
            </motion.p>

            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Signature Chart */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 space-y-4"
      >
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
          Signatures Over Time
        </h3>

        {/* Simple Bar Chart */}
        <div className="flex items-end justify-between h-48 gap-2">
          {chartData.map((point, index) => {
            const height = (point.signatures / maxSignatures) * 100;
            return (
              <motion.div
                key={index}
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{
                  delay: 0.2 + index * 0.03,
                  type: 'spring',
                  stiffness: 100,
                  damping: 15,
                }}
                whileHover={{ scale: 1.05, originY: 'bottom' }}
                className="flex-1 bg-gradient-to-t from-emerald-500 to-emerald-400 dark:from-emerald-600 dark:to-emerald-500 rounded-t-lg transition-all group relative"
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs py-1 px-2 rounded whitespace-nowrap pointer-events-none font-semibold"
                >
                  {point.signatures}
                </motion.div>
              </motion.div>
            );
          })}
        </div>

        {/* Date Labels */}
        <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-400 px-1">
          {chartData.map((point, index) => (
            <span key={index} className={index === 0 || index === chartData.length - 1 ? 'visible' : 'hidden'}>
              {point.date}
            </span>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 text-sm border-t border-zinc-200 dark:border-zinc-800 pt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-emerald-500" />
            <span className="text-zinc-700 dark:text-zinc-300">Signatures</span>
          </div>
        </div>
      </motion.div>

      {/* Two Column Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Referrers */}
        {topReferrers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 space-y-4"
          >
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Top Referral Sources
            </h3>

            <div className="space-y-3">
              {topReferrers.map((referrer, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + index * 0.05 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex-1">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                      {referrer.source}
                    </p>
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden origin-left"
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${(referrer.count / Math.max(...topReferrers.map(r => r.count))) * 100}%`,
                        }}
                        transition={{ delay: 0.25 + index * 0.05 + 0.1, duration: 0.5 }}
                        className="h-full bg-blue-500"
                      />
                    </motion.div>
                  </div>
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300 min-w-fit">
                    {referrer.count}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Demographics */}
        {demographics?.locations && demographics.locations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 space-y-4"
          >
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Top Locations
            </h3>

            <div className="space-y-3">
              {demographics.locations.slice(0, 5).map((location, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + index * 0.05 }}
                  className="flex items-center justify-between"
                >
                  <span className="text-zinc-700 dark:text-zinc-300">{location.location}</span>
                  <motion.span
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-bold rounded-full"
                  >
                    {location.count}
                  </motion.span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
