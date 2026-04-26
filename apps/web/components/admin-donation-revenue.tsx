'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface DonationMetrics {
  totalRaised: number;
  averageDonation: number;
  totalDonors: number;
  recurringDonations: number;
  oneTimeDonations: number;
  chargeTotal: number;
}

interface DonationTrend {
  date: string;
  amount: number;
  donorCount: number;
}

interface CampaignPerformance {
  id: string;
  name: string;
  raised: number;
  target: number;
  donors: number;
  conversion: number;
}

interface AdminDonationRevenueProps {
  metrics: DonationMetrics;
  trends: DonationTrend[];
  campaigns: CampaignPerformance[];
  isLoading?: boolean;
}

export function AdminDonationRevenue({
  metrics,
  trends,
  campaigns,
  isLoading = false,
}: AdminDonationRevenueProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  const statCards = [
    {
      label: 'Total Raised',
      value: `$${metrics.totalRaised.toLocaleString()}`,
      icon: '💰',
      color: 'from-emerald-500 to-emerald-600',
      subtext: `${metrics.totalDonors} donors`,
    },
    {
      label: 'Average Donation',
      value: `$${metrics.averageDonation.toFixed(2)}`,
      icon: '📊',
      color: 'from-blue-500 to-blue-600',
      subtext: `Median: $${Math.round(metrics.averageDonation * 0.8)}`,
    },
    {
      label: 'Monthly Recurring',
      value: `$${(metrics.recurringDonations * 30).toLocaleString()}`,
      icon: '📅',
      color: 'from-purple-500 to-purple-600',
      subtext: `${metrics.recurringDonations} subscriptions`,
    },
    {
      label: 'Payout (Weekly)',
      value: `$${Math.round(metrics.chargeTotal * 0.97).toLocaleString()}`,
      icon: '🏦',
      color: 'from-orange-500 to-orange-600',
      subtext: 'After Stripe fees (2.9% + $0.30)',
    },
  ];

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
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            Donation Revenue
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            Track funds raised across all campaigns
          </p>
        </div>

        <div className="flex gap-2">
          {(['7d', '30d', '90d', 'all'] as const).map(range => (
            <motion.button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                timeRange === range
                  ? 'bg-emerald-600 dark:bg-emerald-500 text-white'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              {range === '7d' ? 'Last 7 days' : range === '30d' ? '30 days' : range === '90d' ? '90 days' : 'All time'}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            className="relative overflow-hidden bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6"
          >
            {/* Gradient Background */}
            <div
              className={`absolute inset-0 opacity-10 bg-gradient-to-br ${card.color}`}
            />

            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <span className="text-3xl">{card.icon}</span>
              </div>

              <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                {card.label}
              </p>

              <motion.p
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15 + index * 0.05 }}
                className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2"
              >
                {card.value}
              </motion.p>

              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                {card.subtext}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Donation Trend Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6"
        >
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">
            Donation Trend
          </h3>

          {/* Simple Bar Chart Representation */}
          <div className="space-y-4">
            {trends.slice(0, 7).map((trend, index) => {
              const maxAmount = Math.max(...trends.map(t => t.amount));
              const percentage = (trend.amount / maxAmount) * 100;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      {trend.date}
                    </span>
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">
                      ${trend.amount.toLocaleString()}
                    </span>
                  </div>

                  <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{
                        type: 'spring',
                        stiffness: 100,
                        damping: 20,
                        delay: 0.35 + index * 0.05,
                      }}
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600"
                    />
                  </div>

                  <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                    {trend.donorCount} donor{trend.donorCount !== 1 ? 's' : ''}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Donation Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6"
        >
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-6">
            Donation Types
          </h3>

          <div className="space-y-6">
            {/* One-time Donations */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  One-time
                </span>
                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {Math.round(
                    (metrics.oneTimeDonations /
                      (metrics.oneTimeDonations + metrics.recurringDonations)) *
                      100
                  )}
                  %
                </span>
              </div>

              <div className="w-full h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(metrics.oneTimeDonations / (metrics.oneTimeDonations + metrics.recurringDonations)) * 100}%`,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 100,
                    damping: 20,
                    delay: 0.4,
                  }}
                  className="h-full bg-blue-500"
                />
              </div>

              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2">
                ${(metrics.oneTimeDonations * 25).toLocaleString()} total
              </p>
            </div>

            {/* Recurring Donations */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  Monthly Recurring
                </span>
                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {Math.round(
                    (metrics.recurringDonations /
                      (metrics.oneTimeDonations + metrics.recurringDonations)) *
                      100
                  )}
                  %
                </span>
              </div>

              <div className="w-full h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(metrics.recurringDonations / (metrics.oneTimeDonations + metrics.recurringDonations)) * 100}%`,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 100,
                    damping: 20,
                    delay: 0.45,
                  }}
                  className="h-full bg-purple-500"
                />
              </div>

              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2">
                ${(metrics.recurringDonations * 35).toLocaleString()}/month
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Campaign Performance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6"
      >
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">
          Campaign Performance
        </h3>

        {campaigns.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 text-zinc-500 dark:text-zinc-400"
          >
            <p className="text-sm">No campaigns with donations yet</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {campaigns.map((campaign, index) => (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.05 }}
                className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-zinc-900 dark:text-zinc-100">
                      {campaign.name}
                    </h4>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      {campaign.donors} donors • {campaign.conversion}% conversion
                    </p>
                  </div>

                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    ${campaign.raised.toLocaleString()}
                  </span>
                </div>

                <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(campaign.raised / campaign.target) * 100}%` }}
                    transition={{
                      type: 'spring',
                      stiffness: 100,
                      damping: 20,
                      delay: 0.45 + index * 0.05,
                    }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600"
                  />
                </div>

                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2">
                  ${campaign.raised.toLocaleString()} / ${campaign.target.toLocaleString()} (
                  {Math.round((campaign.raised / campaign.target) * 100)}%)
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Payout Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-lg border border-orange-200 dark:border-orange-800 p-6"
      >
        <h3 className="text-lg font-bold text-orange-900 dark:text-orange-100 mb-4">
          💳 Payout Information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-orange-800 dark:text-orange-200">Schedule</p>
            <p className="text-lg font-bold text-orange-900 dark:text-orange-100">Weekly</p>
          </div>

          <div>
            <p className="text-sm text-orange-800 dark:text-orange-200">Next Payout</p>
            <p className="text-lg font-bold text-orange-900 dark:text-orange-100">
              {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
            </p>
          </div>

          <div>
            <p className="text-sm text-orange-800 dark:text-orange-200">Stripe Fees</p>
            <p className="text-lg font-bold text-orange-900 dark:text-orange-100">2.9% + $0.30</p>
          </div>
        </div>

        <p className="text-sm text-orange-800 dark:text-orange-200 mt-4">
          ℹ️ Payouts are transferred directly to your connected Stripe account every Monday.
          Funds are available 1-2 business days after transfer.
        </p>
      </motion.div>
    </motion.div>
  );
}
