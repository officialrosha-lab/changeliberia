'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PerformanceReport, WebVitals } from '../lib/performance-monitor';
import performanceMonitor from '../lib/performance-monitor';

interface AdminPerformanceDashboardProps {
  isDarkMode?: boolean;
}

export function AdminPerformanceDashboard({
  isDarkMode = false,
}: AdminPerformanceDashboardProps) {
  const [metrics, setMetrics] = useState<PerformanceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'vitals' | 'resources' | 'custom'>('vitals');
  const [performanceScore, setPerformanceScore] = useState<number>(0);

  useEffect(() => {
    // Wait for metrics to be collected
    const timer = setTimeout(() => {
      const data = performanceMonitor.getMetrics();
      setMetrics(data);
      setPerformanceScore(calculateScore(data.vitals));
      setLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const calculateScore = (vitals: WebVitals): number => {
    let score = 100;

    if (vitals.lcp) {
      const lcp = vitals.lcp.value;
      if (lcp > 4000) score -= 25;
      else if (lcp > 2500) score -= 10;
    }

    if (vitals.cls) {
      const cls = vitals.cls.value;
      if (cls > 0.25) score -= 20;
      else if (cls > 0.1) score -= 8;
    }

    if (vitals.inp) {
      const inp = vitals.inp.value;
      if (inp > 500) score -= 20;
      else if (inp > 200) score -= 8;
    }

    if (vitals.fcp) {
      const fcp = vitals.fcp.value;
      if (fcp > 3000) score -= 15;
      else if (fcp > 1800) score -= 5;
    }

    if (vitals.ttfb) {
      const ttfb = vitals.ttfb.value;
      if (ttfb > 1200) score -= 10;
      else if (ttfb > 600) score -= 5;
    }

    return Math.max(0, Math.round(score));
  };

  const getMetricColor = (rating: string): string => {
    switch (rating) {
      case 'good':
        return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20';
      case 'needs improvement':
        return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20';
      case 'poor':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      default:
        return '';
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'from-emerald-500 to-emerald-600';
    if (score >= 70) return 'from-amber-500 to-amber-600';
    return 'from-red-500 to-red-600';
  };

  if (loading || !metrics) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center py-12"
      >
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="text-4xl mb-4"
          >
            ⚡
          </motion.div>
          <p className="text-zinc-600 dark:text-zinc-400">Collecting performance metrics...</p>
        </div>
      </motion.div>
    );
  }

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
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Performance</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-2">
          Monitor Core Web Vitals and optimize your site
        </p>
      </motion.div>

      {/* Performance Score */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15 }}
        className={`relative overflow-hidden bg-gradient-to-br ${getScoreColor(performanceScore)} rounded-lg p-8 text-white shadow-lg`}
      >
        <div className="relative z-10 max-w-sm">
          <h2 className="text-lg font-semibold mb-2 opacity-90">Performance Score</h2>

          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.25, type: 'spring', stiffness: 200, damping: 20 }}
            className="mb-4"
          >
            <span className="text-6xl font-bold">{performanceScore}</span>
            <span className="text-2xl opacity-75">/100</span>
          </motion.div>

          <p className="text-sm opacity-90">
            {performanceScore >= 90 && '✅ Excellent performance'}
            {performanceScore >= 70 && performanceScore < 90 && '⚠️ Good, but room for improvement'}
            {performanceScore < 70 && '🔴 Needs optimization'}
          </p>
        </div>

        {/* Animated background */}
        <motion.div
          className="absolute inset-0 opacity-20"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent" />
        </motion.div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg p-4">
        {(['vitals', 'resources', 'custom'] as const).map((tab) => (
          <motion.button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-semibold transition-all border-b-2 ${
              activeTab === tab
                ? 'border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            {tab === 'vitals' && '📊 Core Web Vitals'}
            {tab === 'resources' && '📦 Resources'}
            {tab === 'custom' && '⚙️ Custom Metrics'}
          </motion.button>
        ))}
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        {activeTab === 'vitals' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                metrics.vitals.lcp,
                metrics.vitals.fcp,
                metrics.vitals.cls,
                metrics.vitals.inp,
                metrics.vitals.fid,
                metrics.vitals.ttfb,
              ]
                .filter(Boolean)
                .map((metric, index) => (
                  <motion.div
                    key={metric?.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`rounded-lg p-6 border border-zinc-200 dark:border-zinc-800 ${getMetricColor(metric!.rating)}`}
                  >
                    <p className="text-sm font-semibold opacity-75 mb-2">{metric!.name}</p>

                    <motion.p
                      initial={{ scale: 0.5 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.05 + 0.2 }}
                      className="text-3xl font-bold mb-2"
                    >
                      {metric!.value.toFixed(0)}
                      {metric!.id === 'cls' ? '' : 'ms'}
                    </motion.p>

                    <div className="flex items-center justify-between text-xs opacity-75">
                      <span>
                        {metric!.rating === 'good' && '✅'}
                        {metric!.rating === 'needs improvement' && '⚠️'}
                        {metric!.rating === 'poor' && '❌'}
                        {' '}
                        {metric!.rating.charAt(0).toUpperCase() + metric!.rating.slice(1)}
                      </span>
                      <span>
                        {metric!.id === 'lcp' && '≤2500ms'}
                        {metric!.id === 'fcp' && '≤1800ms'}
                        {metric!.id === 'cls' && '≤0.1'}
                        {metric!.id === 'inp' && '≤200ms'}
                        {metric!.id === 'fid' && '≤100ms'}
                        {metric!.id === 'ttfb' && '≤600ms'}
                      </span>
                    </div>
                  </motion.div>
                ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'resources' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6"
              >
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">Total Resources</p>
                <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                  {metrics.resourceTiming.totalResources}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6"
              >
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">Total Size</p>
                <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                  {(metrics.resourceTiming.totalSize / 1024 / 1024).toFixed(2)}MB
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6"
              >
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">Avg Resource Size</p>
                <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                  {(metrics.resourceTiming.avgResourceSize / 1024).toFixed(1)}KB
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}

        {activeTab === 'custom' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 space-y-4"
          >
            {Object.entries(metrics.customMetrics).map(([key, value], index) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800 last:border-0"
              >
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {(value as number).toFixed(0)}ms
                </span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6"
      >
        <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-4">
          💡 Optimization Tips
        </h3>

        <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <li>✅ Minimize JavaScript for faster LCP</li>
          <li>✅ Optimize images with WebP format</li>
          <li>✅ Use lazy loading for below-fold content</li>
          <li>✅ Enable gzip compression on server</li>
          <li>✅ Implement caching headers for assets</li>
          <li>✅ Split large bundles with code splitting</li>
          <li>✅ Monitor CLS with intersection observers</li>
        </ul>
      </motion.div>

      {/* Export Metrics */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          const json = JSON.stringify(metrics, null, 2);
          const blob = new Blob([json], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `performance-metrics-${Date.now()}.json`;
          a.click();
        }}
        className="w-full px-6 py-3 bg-zinc-600 hover:bg-zinc-700 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-white rounded-lg font-semibold transition-all"
      >
        📥 Export Metrics
      </motion.button>
    </motion.div>
  );
}
