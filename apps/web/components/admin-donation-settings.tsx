'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DonationCampaign {
  id: string;
  petitionId?: string;
  title: string;
  description: string;
  currentAmount: number;
  donorCount: number;
  enabled: boolean;
  createdAt: Date;
  endsAt?: Date;
  customAmounts: number[];
  recurringEnabled: boolean;
}

interface AdminDonationSettingsProps {
  campaigns: DonationCampaign[];
  globalDonationsEnabled: boolean;
  stripeAccountConnected: boolean;
  onToggleGlobal?: (enabled: boolean) => Promise<void>;
  onCreateCampaign?: (campaign: Omit<DonationCampaign, 'id' | 'createdAt' | 'currentAmount' | 'donorCount'>) => Promise<void>;
  onUpdateCampaign?: (campaignId: string, updates: Partial<DonationCampaign>) => Promise<void>;
  onDeleteCampaign?: (campaignId: string) => Promise<void>;
  onConnectStripe?: () => Promise<void>;
  isLoading?: boolean;
}

export function AdminDonationSettings({
  campaigns,
  globalDonationsEnabled,
  stripeAccountConnected,
  onToggleGlobal,
  onCreateCampaign,
  onUpdateCampaign,
  onDeleteCampaign,
  onConnectStripe,
}: AdminDonationSettingsProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<DonationCampaign | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [connectingStripe, setConnectingStripe] = useState(false);

  const [formData, setFormData] = useState<Partial<DonationCampaign>>({
    title: '',
    description: '',
    enabled: true,
    customAmounts: [5, 10, 25, 50, 100],
    recurringEnabled: true,
  });

  const handleToggleGlobal = async (enabled: boolean) => {
    setSaving(true);
    try {
      await onToggleGlobal?.(enabled);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCampaign = async () => {
    if (!formData.title?.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      await onCreateCampaign?.(formData as any);
      setFormData({
        title: '',
        description: '',
        enabled: true,
        customAmounts: [5, 10, 25, 50, 100],
        recurringEnabled: true,
      });
      setShowCreateForm(false);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCampaign = async (campaignId: string, updates: Partial<DonationCampaign>) => {
    setSaving(true);
    try {
      await onUpdateCampaign?.(campaignId, updates);
      setSelectedCampaign(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    setSaving(true);
    try {
      await onDeleteCampaign?.(campaignId);
      setShowDeleteConfirm(null);
      setSelectedCampaign(null);
    } finally {
      setSaving(false);
    }
  };

  const handleConnectStripe = async () => {
    setConnectingStripe(true);
    try {
      await onConnectStripe?.();
    } finally {
      setConnectingStripe(false);
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
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Donation Settings</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-2">
          Configure fundraising campaigns and donation options
        </p>
      </motion.div>

      {/* Stripe Connection */}
      {!stripeAccountConnected && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-2 border-orange-300 dark:border-orange-700 rounded-lg p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-orange-900 dark:text-orange-100 mb-1">
                ⚠️ Stripe Not Connected
              </h3>
              <p className="text-sm text-orange-800 dark:text-orange-200 mb-3">
                Connect your Stripe account to enable donations. Payouts will be sent to your account weekly.
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleConnectStripe}
              disabled={connectingStripe}
              className="px-6 py-2 bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 text-white rounded-lg font-semibold transition-all whitespace-nowrap disabled:opacity-60"
            >
              {connectingStripe ? '⏳ Connecting...' : '🔗 Connect Stripe'}
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Global Donations Toggle */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Global Donations
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              Enable/disable donations across all campaigns
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleToggleGlobal(!globalDonationsEnabled)}
            disabled={saving}
            className={`relative w-14 h-8 rounded-full transition-all ${
              globalDonationsEnabled
                ? 'bg-emerald-600 dark:bg-emerald-500'
                : 'bg-zinc-300 dark:bg-zinc-700'
            }`}
          >
            <motion.div
              initial={false}
              animate={{
                x: globalDonationsEnabled ? 28 : 4,
              }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
            />
          </motion.button>
        </div>

        {!stripeAccountConnected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800 p-2 rounded"
          >
            💡 Connect Stripe to enable donations
          </motion.div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campaigns List */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Campaigns ({campaigns.length})
              </h3>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateForm(true)}
                disabled={!globalDonationsEnabled}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-60"
              >
                + New Campaign
              </motion.button>
            </div>

            {campaigns.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 text-zinc-500 dark:text-zinc-400"
              >
                <p className="text-sm">No campaigns created yet</p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {campaigns.map((campaign, index) => (
                  <motion.div
                    key={campaign.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setSelectedCampaign(campaign)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedCampaign?.id === campaign.id
                        ? 'border-emerald-500 dark:border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-bold text-zinc-900 dark:text-zinc-100">
                        {campaign.title}
                      </h4>
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          campaign.enabled
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        {campaign.enabled ? '🟢 Active' : '⚫ Disabled'}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2">
                      {campaign.description}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-zinc-500 dark:text-zinc-500">Raised</p>
                        <p className="font-bold text-zinc-900 dark:text-zinc-100">
                          ${campaign.currentAmount.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-zinc-500 dark:text-zinc-500">Donors</p>
                        <p className="font-bold text-zinc-900 dark:text-zinc-100">
                          {campaign.donorCount}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Campaign Details */}
        {selectedCampaign && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="lg:col-span-1"
          >
            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 sticky top-6 space-y-4">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Campaign Details
              </h3>

              {/* Status Toggle */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    onClick={() =>
                      handleUpdateCampaign(selectedCampaign.id, {
                        enabled: !selectedCampaign.enabled,
                      })
                    }
                    className={`relative w-12 h-7 rounded-full transition-all ${
                      selectedCampaign.enabled
                        ? 'bg-emerald-600 dark:bg-emerald-500'
                        : 'bg-zinc-300 dark:bg-zinc-700'
                    }`}
                  >
                    <motion.div
                      initial={false}
                      animate={{
                        x: selectedCampaign.enabled ? 24 : 3,
                      }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-lg"
                    />
                  </motion.button>
                  <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    {selectedCampaign.enabled ? 'Active' : 'Disabled'}
                  </span>
                </label>
              </div>

              {/* Stats */}
              <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <div>
                  <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                    Flexible Amounts
                  </p>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-1">
                    {selectedCampaign.customAmounts.join(', ')}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                    Recurring
                  </p>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-1">
                    {selectedCampaign.recurringEnabled ? '✅ Enabled' : '❌ Disabled'}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDeleteConfirm(selectedCampaign.id)}
                  className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition-all"
                >
                  🗑️ Delete
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Create Campaign Modal */}
      {showCreateForm && (
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
            className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-2xl p-6 border border-zinc-200 dark:border-zinc-800"
          >
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              Create Campaign
            </h2>

            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Campaign Title *
                </label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Emergency Relief Fund"
                  className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What is this campaign for?"
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.recurringEnabled || false}
                  onChange={e =>
                    setFormData({ ...formData, recurringEnabled: e.target.checked })
                  }
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  Allow monthly recurring donations
                </span>
              </label>
            </div>

            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowCreateForm(false)}
                className="flex-1 px-4 py-2 border-2 border-zinc-300 dark:border-zinc-700 rounded-lg font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreateCampaign}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white rounded-lg font-semibold transition-all disabled:opacity-60"
              >
                {saving ? '⏳ Creating...' : '✅ Create'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
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
            className="bg-white dark:bg-zinc-900 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800 max-w-sm"
          >
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              Delete Campaign?
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
              This will remove the campaign and disable donations for it.
            </p>

            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border-2 border-zinc-300 dark:border-zinc-700 rounded-lg font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleDeleteCampaign(showDeleteConfirm)}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white rounded-lg font-semibold transition-all disabled:opacity-60"
              >
                {saving ? '⏳ Deleting...' : '✅ Delete'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
