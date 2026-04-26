'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface BundleChunk {
  name: string;
  size: number;
  gzipped: number;
  percentage: number;
}

interface BundleAnalysis {
  totalSize: number;
  totalGzipped: number;
  chunks: BundleChunk[];
  timestamp: number;
}

const CHUNK_COLORS = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
];

export function AdminBundleAnalyzer() {
  const [analysis, setAnalysis] = useState<BundleAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeChunk, setActiveChunk] = useState<string | null>(null);
  const [history, setHistory] = useState<{ timestamp: number; totalSize: number }[]>([]);

  useEffect(() => {
    // Simulate bundle analysis
    const timer = setTimeout(() => {
      const chunks: BundleChunk[] = [
        {
          name: 'main',
          size: 245000,
          gzipped: 65000,
          percentage: 0,
        },
        {
          name: 'auth',
          size: 124000,
          gzipped: 32000,
          percentage: 0,
        },
        {
          name: 'cms-content',
          size: 156000,
          gzipped: 41000,
          percentage: 0,
        },
        {
          name: 'donations',
          size: 98000,
          gzipped: 26000,
          percentage: 0,
        },
        {
          name: 'petitions',
          size: 187000,
          gzipped: 49000,
          percentage: 0,
        },
        {
          name: 'admin-dashboard',
          size: 142000,
          gzipped: 37000,
          percentage: 0,
        },
        {
          name: 'shared-components',
          size: 89000,
          gzipped: 23000,
          percentage: 0,
        },
        {
          name: 'analytics',
          size: 76000,
          gzipped: 20000,
          percentage: 0,
        },
      ];

      const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
      const chunksWithPercentage = chunks.map((chunk) => ({
        ...chunk,
        percentage: Math.round((chunk.size / totalSize) * 100),
      }));

      const data: BundleAnalysis = {
        totalSize,
        totalGzipped: chunks.reduce((sum, chunk) => sum + chunk.gzipped, 0),
        chunks: chunksWithPercentage,
        timestamp: Date.now(),
      };

      setAnalysis(data);
      setHistory([
        { timestamp: Date.now() - 86400000, totalSize: totalSize * 1.15 },
        { timestamp: Date.now() - 72000000, totalSize: totalSize * 1.08 },
        { timestamp: Date.now() - 60000000, totalSize: totalSize * 1.02 },
        { timestamp: Date.now(), totalSize },
      ]);
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const formatBytes = (bytes: number): string => {
    return (bytes / 1024).toFixed(1) + 'KB';
  };

  const formatBytesLarge = (bytes: number): string => {
    return (bytes / 1024 / 1024).toFixed(2) + 'MB';
  };

  if (loading || !analysis) {
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
            📦
          </motion.div>
          <p className="text-zinc-600 dark:text-zinc-400">Analyzing bundle...</p>
        </div>
      </motion.div>
    );
  }

  const chartData = analysis.chunks.map((chunk) => ({
    name: chunk.name,
    size: chunk.size,
    gzipped: chunk.gzipped,
  }));

  const historyData = history.map((item) => ({
    timestamp: new Date(item.timestamp).toLocaleDateString().slice(0, 5),
    size: item.totalSize / 1024,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="w-full space-y-6"
    >
      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Bundle Analysis</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-2">
          Visualize and optimize your code bundle
        </p>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800 p-6"
        >
          <p className="text-sm text-blue-700 dark:text-blue-300 mb-2 font-semibold">Total Size</p>
          <motion.p
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.25 }}
            className="text-4xl font-bold text-blue-900 dark:text-blue-100"
          >
            {formatBytesLarge(analysis.totalSize)}
          </motion.p>
          <p className="text-xs text-blue-600 dark:text-blue-300 mt-2">
            {analysis.chunks.length} chunks
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/30 dark:to-emerald-900/10 rounded-lg border border-emerald-200 dark:border-emerald-800 p-6"
        >
          <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-2 font-semibold">
            Gzipped
          </p>
          <motion.p
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-bold text-emerald-900 dark:text-emerald-100"
          >
            {formatBytesLarge(analysis.totalGzipped)}
          </motion.p>
          <p className="text-xs text-emerald-600 dark:text-emerald-300 mt-2">
            ~
            {Math.round(
              ((analysis.totalSize - analysis.totalGzipped) / analysis.totalSize) * 100
            )}
            % reduction
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-900/10 rounded-lg border border-purple-200 dark:border-purple-800 p-6"
        >
          <p className="text-sm text-purple-700 dark:text-purple-300 mb-2 font-semibold">
            Largest Chunk
          </p>
          <motion.p
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.35 }}
            className="text-4xl font-bold text-purple-900 dark:text-purple-100"
          >
            {formatBytes(Math.max(...analysis.chunks.map((c) => c.size)))}
          </motion.p>
          <p className="text-xs text-purple-600 dark:text-purple-300 mt-2">
            {analysis.chunks.find((c) => c.size === Math.max(...analysis.chunks.map((c) => c.size)))
              ?.name || 'N/A'}
          </p>
        </motion.div>
      </div>

      {/* Size Comparison Chart */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6"
      >
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">
          Uncompressed vs Gzipped
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="name"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
              }}
              formatter={(value: any) => formatBytes(Number(value))}
            />
            <Legend />
            <Bar dataKey="size" fill="#3b82f6" name="Uncompressed" />
            <Bar dataKey="gzipped" fill="#10b981" name="Gzipped" />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Pie Chart */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.35 }}
        className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6"
      >
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">
          Bundle Distribution
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={analysis.chunks}
              dataKey="size"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name, value }: any) => {
                const total = analysis.totalSize;
                const percent = Math.round((value / total) * 100);
                return `${name} (${percent}%)`;
              }}
            >
              {analysis.chunks.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CHUNK_COLORS[index % CHUNK_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: any) => formatBytes(Number(value))} />
          </PieChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Bundle Size Trend */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6"
      >
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">Size Trend</h2>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={historyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="timestamp" tick={{ fill: '#6b7280', fontSize: 12 }} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
              }}
              formatter={(value: any) => (value / 1024).toFixed(2) + 'MB'}
            />
            <Line
              type="monotone"
              dataKey="size"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Chunk Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden"
      >
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 p-6 border-b border-zinc-200 dark:border-zinc-800">
          Chunk Details
        </h2>

        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {analysis.chunks.map((chunk, index) => (
            <motion.div
              key={chunk.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.05 }}
              onClick={() => setActiveChunk(activeChunk === chunk.name ? null : chunk.name)}
              className="p-6 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{chunk.name}</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{chunk.percentage}% of bundle</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-zinc-900 dark:text-zinc-100">{formatBytes(chunk.size)}</p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">
                    {formatBytes(chunk.gzipped)} gzipped
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2 overflow-hidden">
                <motion.div
                  layoutId={`progress-${chunk.name}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${chunk.percentage}%` }}
                  transition={{ delay: 0.5 + index * 0.05 + 0.1, type: 'spring' }}
                  className={`h-full ${CHUNK_COLORS[index % CHUNK_COLORS.length]}`}
                  style={{ backgroundColor: CHUNK_COLORS[index % CHUNK_COLORS.length] }}
                />
              </div>

              {/* Expanded details */}
              {activeChunk === chunk.name && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700 space-y-2 text-sm"
                >
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Compression ratio</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {Math.round(
                        ((chunk.size - chunk.gzipped) / chunk.size) * 100
                      )}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Estimated download time (4G)</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {((chunk.gzipped / 1024) / 4).toFixed(1)}s
                    </span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Optimization Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6"
      >
        <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100 mb-4">
          🎯 Optimization Opportunities
        </h3>

        <ul className="space-y-2 text-sm text-amber-800 dark:text-amber-200">
          {analysis.chunks
            .sort((a, b) => b.size - a.size)
            .slice(0, 3)
            .map((chunk) => (
              <li key={chunk.name}>
                ✏️ <strong>{chunk.name}</strong> is {chunk.percentage}% of your bundle. Consider code
                splitting or lazy loading this module.
              </li>
            ))}
        </ul>
      </motion.div>
    </motion.div>
  );
}
