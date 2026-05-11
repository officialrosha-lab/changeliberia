'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DonationWidgetProps {
  onDonate?: (
    amount: number,
    frequency: 'once' | 'monthly',
    email: string,
    paymentMethod: 'CARD' | 'MOBILE_MONEY',
    phoneNumber?: string,
  ) => Promise<void>;
  isEnabled?: boolean;
  customAmounts?: number[];
}

export function DonationWidget({
  onDonate,
  isEnabled = true,
  customAmounts = [5, 10, 25, 50, 100],
}: DonationWidgetProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [frequency, setFrequency] = useState<'once' | 'monthly'>('once');
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'MOBILE_MONEY'>('CARD');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const finalAmount = selectedAmount || (customAmount ? parseInt(customAmount) : 0);

  const handleDonate = async () => {
    if (!finalAmount || !email.trim()) {
      setError('Please select an amount and enter your email');
      return;
    }

    if (paymentMethod === 'MOBILE_MONEY' && !phoneNumber.trim()) {
      setError('Please enter your mobile money phone number');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onDonate?.(finalAmount, frequency, email, paymentMethod, phoneNumber);
      setSelectedAmount(null);
      setCustomAmount('');
      setEmail('');
      setPhoneNumber('');
      setPaymentMethod('CARD');
      setShowForm(false);
    } catch (err) {
      setError('Donation failed. Please try again.');
      console.error('Donation error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isEnabled) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 text-center"
      >
        <p className="text-zinc-600 dark:text-zinc-400">Donations are currently disabled</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      data-testid="donation-widget"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 space-y-6"
    >
      {/* Header */}
      <div>
        <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          Support This Campaign
        </h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Help keep Change Liberia free and independent
        </p>
      </div>

      {/* Donation Amount Selection */}
      {!showForm ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="space-y-4"
        >
          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Select an amount:
          </p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {customAmounts.map((amount, index) => (
              <motion.button
                key={amount}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 + index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setSelectedAmount(amount);
                  setCustomAmount('');
                  setShowForm(true);
                }}
                className={`py-3 rounded-lg font-bold transition-all border-2 ${
                  selectedAmount === amount
                    ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                    : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-emerald-400 dark:hover:border-emerald-500'
                }`}
              >
                ${amount}
              </motion.button>
            ))}
          </div>

          {/* Custom Amount */}
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-zinc-600 dark:text-zinc-400">$</span>
            <input
              name="customAmount"
              type="number"
              value={customAmount}
              onChange={e => {
                setCustomAmount(e.target.value);
                setSelectedAmount(null);
              }}
              onFocus={() => setShowForm(true)}
              placeholder="Custom amount"
              min="1"
              className="w-full pl-7 px-4 py-3 rounded-lg border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </motion.div>
      ) : null}

      {/* Donation Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-800"
          >
            {/* Donation Type */}
            <div>
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                Donation Type:
              </p>
              <div className="grid grid-cols-2 gap-3">
                {(['once', 'monthly'] as const).map(type => (
                  <motion.button
                    key={type}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setFrequency(type)}
                    className={`py-2 rounded-lg font-semibold transition-all border-2 ${
                      frequency === type
                        ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-blue-400'
                    }`}
                  >
                    {type === 'once' ? '🎁 One-time' : '📅 Monthly'}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                Email Address *
              </label>
              <input
                name="email"
                type="email"
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="your@email.com"
                className="w-full px-4 py-3 rounded-lg border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            {/* Payment Method */}
            <div>
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                Payment Method
              </p>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { id: 'CARD', label: 'Credit/Debit Card' },
                  { id: 'MOBILE_MONEY', label: 'MTN Mobile Money' },
                ] as const).map((option) => (
                  <motion.button
                    key={option.id}
                    data-testid={`payment-method-${option.id.toLowerCase()}`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setPaymentMethod(option.id)}
                    className={`py-2 rounded-lg font-semibold transition-all border-2 ${
                      paymentMethod === option.id
                        ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                        : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-emerald-400 dark:hover:border-emerald-500'
                    }`}
                  >
                    {option.label}
                  </motion.button>
                ))}
              </div>
            </div>

            {paymentMethod === 'MOBILE_MONEY' && (
              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  Mobile Money Phone Number *
                </label>
                <input
                  data-testid="momo-phone-input"
                  name="phoneNumber"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    setError('');
                  }}
                  placeholder="+231 770 000 000"
                  className="w-full px-4 py-3 rounded-lg border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
                <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                  You will receive a mobile money prompt on your phone to complete the payment.
                </p>
              </div>
            )}

            {/* Amount Summary */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {frequency === 'once' ? 'One-time donation:' : 'Monthly donation:'}
                </span>
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  ${finalAmount}
                </span>
              </div>
              {frequency === 'monthly' && (
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-2">
                  💳 Billed monthly to your card on file
                </p>
              )}
            </motion.div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3"
              >
                <p className="text-sm text-red-700 dark:text-red-300">❌ {error}</p>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setShowForm(false);
                  setSelectedAmount(null);
                  setCustomAmount('');
                  setEmail('');
                  setError('');
                }}
                className="flex-1 px-4 py-3 border-2 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
              >
                Change Amount
              </motion.button>

                <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDonate}
                disabled={loading || !finalAmount || !email.trim() || (paymentMethod === 'MOBILE_MONEY' && !phoneNumber.trim())}
                className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white rounded-lg font-semibold transition-all disabled:opacity-60"
              >
                {loading ? (
                  <>⏳ Processing...</>
                ) : (
                  <>{paymentMethod === 'MOBILE_MONEY' ? '📱 Send MoMo Request' : `💳 Donate $${finalAmount}`}</>
                )}
              </motion.button>
            </div>

            {/* Security Badge */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                🔒 Secured by Stripe • No spam
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Call to Action */}
      {!showForm && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowForm(true)}
          className="w-full px-6 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 dark:from-emerald-500 dark:to-emerald-600 hover:from-emerald-700 hover:to-emerald-800 dark:hover:from-emerald-600 dark:hover:to-emerald-700 text-white rounded-lg font-bold text-lg transition-all shadow-lg"
        >
          💝 Make a Donation
        </motion.button>
      )}
    </motion.div>
  );
}
