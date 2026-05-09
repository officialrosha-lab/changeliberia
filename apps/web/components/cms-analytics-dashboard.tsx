'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '../lib/api';

interface BlockMetric {
  blockId: string;
  blockType: string;
  views: number;
  clicks: number;
  engagementRate: number;
}

interface PageAnalytics {
  pageId: string;
  pageTitle: string;
  totalViews: number;
  totalClicks: number;
  avgEngagementRate: number;
  blocks: BlockMetric[];
}

interface VariantComparison {
  variantId: string;
  views: number;
  clicks: number;
  engagementRate: number;
  conversionRate: number;
}

interface DailyTrend {
  date: string;
  views: number;
  clicks: number;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

/**
 * Simple SVG line chart for trends
 */
function TrendChart({ data }: { data: DailyTrend[] }) {
  if (data.length === 0) return null;

  const maxViews = Math.max(...data.map((d) => d.views), 1);
  const maxClicks = Math.max(...data.map((d) => d.clicks), 1);
  const max = Math.max(maxViews, maxClicks);

  const width = 400;
  const height = 200;
  const padding = 40;
  const chartWidth = width - 2 * padding;
  const chartHeight = height - 2 * padding;

  const xStep = chartWidth / (data.length - 1 || 1);
  const yScale = chartHeight / max || 1;

  const viewsPath = data
    .map((d, i) => `${padding + i * xStep},${height - padding - (d.views * yScale)}`)
    .join('L');

  const clicksPath = data
    .map((d, i) => `${padding + i * xStep},${height - padding - (d.clicks * yScale)}`)
    .join('L');

  return (
    <svg width="100%" height="300" viewBox={`0 0 ${width} ${height}`} className="border border-zinc-200 rounded dark:border-neutral-700">
      {/* Grid */}
      {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
        <line
          key={`hgrid-${fraction}`}
          x1={padding}
          y1={padding + (1 - fraction) * chartHeight}
          x2={width - padding}
          y2={padding + (1 - fraction) * chartHeight}
          stroke="#e5e7eb"
          strokeDasharray="4"
          className="dark:stroke-neutral-700"
        />
      ))}

      {/* Views Line */}
      <polyline points={viewsPath} fill="none" stroke="#3b82f6" strokeWidth="2" />

      {/* Clicks Line */}
      <polyline points={clicksPath} fill="none" stroke="#10b981" strokeWidth="2" />

      {/* Legend */}
      <rect x={padding} y="10" width="12" height="12" fill="#3b82f6" />
      <text x={padding + 20} y="20" fontSize="12" fill="#1f2937" className="dark:fill-neutral-300">
        Views
      </text>

      <rect x={padding + 80} y="10" width="12" height="12" fill="#10b981" />
      <text x={padding + 100} y="20" fontSize="12" fill="#1f2937" className="dark:fill-neutral-300">
        Clicks
      </text>
    </svg>
  );
}

/**
 * Simple SVG bar chart for variants
 */
function VariantChart({ data }: { data: VariantComparison[] }) {
  if (data.length === 0) return null;

  const maxValue = Math.max(...data.flatMap((d) => [d.views, d.clicks]), 1);

  const width = 400;
  const height = 250;
  const padding = 40;
  const barWidth = Math.max(20, (width - 2 * padding) / (data.length * 3));
  const chartHeight = height - 2 * padding;
  const yScale = chartHeight / maxValue;

  return (
    <svg width="100%" height="300" viewBox={`0 0 ${width} ${height}`} className="border border-zinc-200 rounded dark:border-neutral-700">
      {data.map((variant, idx) => {
        const x = padding + idx * (barWidth * 2.5);
        return (
          <g key={variant.variantId}>
            {/* Views Bar */}
            <rect
              x={x}
              y={height - padding - variant.views * yScale}
              width={barWidth}
              height={variant.views * yScale}
              fill="#3b82f6"
            />
            {/* Clicks Bar */}
            <rect
              x={x + barWidth + 5}
              y={height - padding - variant.clicks * yScale}
              width={barWidth}
              height={variant.clicks * yScale}
              fill="#10b981"
            />
            {/* Label */}
            <text x={x + barWidth} y={height - padding + 20} fontSize="11" fill="#6b7280" textAnchor="middle" className="dark:fill-neutral-400">
              {variant.variantId.substring(0, 6)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function CMSAnalyticsDashboard({ pageId, token }: { pageId: string; token: string }) {
  const [analytics, setAnalytics] = useState<PageAnalytics | null>(null);
  const [variants, setVariants] = useState<VariantComparison[]>([]);
  const [trends, setTrends] = useState<DailyTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);

  useEffect(() => {
    if (!pageId || !token) return;

    const loadAnalytics = async () => {
      try {
        setLoading(true);
        const [analyticsData, variantsData, trendsData] = await Promise.all([
          apiGet<PageAnalytics>(`/api/v1/cms/pages/${pageId}/analytics`, token),
          apiGet<VariantComparison[]>(`/api/v1/cms/pages/${pageId}/analytics/variants`, token).catch(() => []),
          apiGet<DailyTrend[]>(`/api/v1/cms/pages/${pageId}/analytics/trends`, token).catch(() => []),
        ]);

        setAnalytics(analyticsData);
        setVariants(variantsData || []);
        setTrends(trendsData || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    void loadAnalytics();
  }, [pageId, token]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-zinc-200 rounded animate-pulse" />
        <div className="h-64 bg-zinc-200 rounded animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700 font-semibold">Analytics Error</p>
        <p className="text-red-600 text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-amber-700">No analytics data available yet</p>
      </div>
    );
  }

  const selectedBlockData = selectedBlock ? analytics.blocks.find((b) => b.blockId === selectedBlock) : null;

  return (
    <div className="space-y-6">
      {/* Page Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-zinc-200 rounded-lg p-4 dark:bg-neutral-800 dark:border-neutral-700">
          <div className="text-sm text-zinc-600 dark:text-neutral-400 font-semibold">Total Views</div>
          <div className="text-3xl font-bold text-zinc-900 dark:text-neutral-50 mt-2">{analytics.totalViews.toLocaleString()}</div>
          <p className="text-xs text-zinc-500 dark:text-neutral-500 mt-1">Page impressions</p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-lg p-4 dark:bg-neutral-800 dark:border-neutral-700">
          <div className="text-sm text-zinc-600 dark:text-neutral-400 font-semibold">Total Clicks</div>
          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{analytics.totalClicks.toLocaleString()}</div>
          <p className="text-xs text-zinc-500 dark:text-neutral-500 mt-1">CTA interactions</p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-lg p-4 dark:bg-neutral-800 dark:border-neutral-700">
          <div className="text-sm text-zinc-600 dark:text-neutral-400 font-semibold">Avg Engagement</div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{(analytics.avgEngagementRate * 100).toFixed(1)}%</div>
          <p className="text-xs text-zinc-500 dark:text-neutral-500 mt-1">Clicks per view</p>
        </div>
      </div>

      {/* Daily Trends */}
      {trends.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-lg p-4 dark:bg-neutral-800 dark:border-neutral-700">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-neutral-50 mb-4">7-Day Trends</h3>
          <TrendChart data={trends} />
          <div className="mt-4 grid grid-cols-2 gap-2">
            {trends.map((trend) => (
              <div key={trend.date} className="text-xs p-2 bg-zinc-50 rounded dark:bg-neutral-700">
                <div className="font-semibold text-zinc-900 dark:text-neutral-50">{trend.date}</div>
                <div className="text-zinc-600 dark:text-neutral-400">
                  {trend.views} views · {trend.clicks} clicks
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Block Performance */}
      <div className="bg-white border border-zinc-200 rounded-lg p-4 dark:bg-neutral-800 dark:border-neutral-700">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-neutral-50 mb-4">Block Performance</h3>

        {analytics.blocks.length > 0 ? (
          <div className="space-y-4">
            {/* Block Selection */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {analytics.blocks.map((block) => (
                <button
                  key={block.blockId}
                  onClick={() => setSelectedBlock(selectedBlock === block.blockId ? null : block.blockId)}
                  className={`p-3 rounded-lg border transition-colors ${
                    selectedBlock === block.blockId
                      ? 'bg-blue-50 border-blue-300 dark:bg-blue-900 dark:border-blue-600'
                      : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300 dark:bg-neutral-700 dark:border-neutral-600 dark:hover:border-neutral-500'
                  }`}
                >
                  <div className="text-xs font-semibold text-zinc-600 dark:text-neutral-300 uppercase">{block.blockType}</div>
                  <div className="text-sm font-bold text-zinc-900 dark:text-neutral-50 mt-1">{block.views} views</div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400">{block.clicks} clicks</div>
                </button>
              ))}
            </div>

            {/* Block Details */}
            {selectedBlockData && (
              <div className="border-t border-zinc-200 pt-4 dark:border-neutral-700">
                <h4 className="text-sm font-bold text-zinc-900 dark:text-neutral-50 mb-3">
                  {selectedBlockData.blockType.charAt(0).toUpperCase() + selectedBlockData.blockType.slice(1)} Block Details
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-blue-50 p-3 rounded dark:bg-blue-900">
                    <div className="text-xs text-blue-600 dark:text-blue-300 font-semibold">Views</div>
                    <div className="text-lg font-bold text-blue-900 dark:text-blue-50">{selectedBlockData.views}</div>
                  </div>
                  <div className="bg-emerald-50 p-3 rounded dark:bg-emerald-900">
                    <div className="text-xs text-emerald-600 dark:text-emerald-300 font-semibold">Clicks</div>
                    <div className="text-lg font-bold text-emerald-900 dark:text-emerald-50">{selectedBlockData.clicks}</div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded dark:bg-purple-900">
                    <div className="text-xs text-purple-600 dark:text-purple-300 font-semibold">Engagement</div>
                    <div className="text-lg font-bold text-purple-900 dark:text-purple-50">{(selectedBlockData.engagementRate * 100).toFixed(1)}%</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-zinc-500 dark:text-neutral-400 text-sm">No block data available</p>
        )}
      </div>

      {/* Variant Comparison (A/B Testing) */}
      {variants.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-lg p-4 dark:bg-neutral-800 dark:border-neutral-700">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-neutral-50 mb-4">A/B Test Variants</h3>
          <VariantChart data={variants} />

          <div className="mt-4 space-y-2">
            {variants.map((variant, idx) => (
              <div key={variant.variantId} className="flex items-center justify-between p-3 bg-zinc-50 rounded dark:bg-neutral-700">
                <div>
                  <div className="font-semibold text-zinc-900 dark:text-neutral-50">{variant.variantId}</div>
                  <div className="text-xs text-zinc-600 dark:text-neutral-400">
                    {variant.views} views · {variant.clicks} clicks · {(variant.engagementRate * 100).toFixed(1)}% engagement
                  </div>
                </div>
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export & Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            const csv = generateCSV(analytics, trends);
            downloadCSV(csv, `analytics-${pageId}-${new Date().toISOString().split('T')[0]}.csv`);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors dark:bg-blue-700 dark:hover:bg-blue-800"
        >
          Export as CSV
        </button>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-zinc-200 text-zinc-900 rounded-lg font-semibold hover:bg-zinc-300 transition-colors dark:bg-neutral-700 dark:text-neutral-50 dark:hover:bg-neutral-600"
        >
          Print Report
        </button>
      </div>
    </div>
  );
}

/**
 * Generate CSV data from analytics
 */
function generateCSV(analytics: PageAnalytics, trends: DailyTrend[]): string {
  let csv = 'Change Liberia CMS Analytics Report\n';
  csv += `Page: ${analytics.pageTitle}\n`;
  csv += `Generated: ${new Date().toLocaleString()}\n\n`;

  csv += 'Page Summary\n';
  csv += 'Metric,Value\n';
  csv += `Total Views,${analytics.totalViews}\n`;
  csv += `Total Clicks,${analytics.totalClicks}\n`;
  csv += `Avg Engagement Rate,${(analytics.avgEngagementRate * 100).toFixed(2)}%\n\n`;

  csv += 'Block Performance\n';
  csv += 'Block ID,Type,Views,Clicks,Engagement Rate\n';
  analytics.blocks.forEach((block) => {
    csv += `${block.blockId},${block.blockType},${block.views},${block.clicks},${(block.engagementRate * 100).toFixed(2)}%\n`;
  });

  if (trends.length > 0) {
    csv += '\nDaily Trends\n';
    csv += 'Date,Views,Clicks\n';
    trends.forEach((trend) => {
      csv += `${trend.date},${trend.views},${trend.clicks}\n`;
    });
  }

  return csv;
}

/**
 * Download CSV file
 */
function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}
