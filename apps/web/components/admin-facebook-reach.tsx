'use client';

import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';

// UI Components (inline)
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-lg border border-zinc-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>
);

const CardTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>
);

const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 pt-0 ${className}`}>{children}</div>
);

const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse rounded-md bg-gradient-to-r from-zinc-200 to-zinc-100 dark:from-neutral-700 dark:to-neutral-800 ${className}`} />
);

const Badge = ({ children, className = '', variant = 'default' }: { children: React.ReactNode; className?: string; variant?: 'default' | 'outline' }) => {
  const baseStyles = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold';
  const variantStyles = variant === 'outline' ? 'border border-zinc-200 bg-transparent text-zinc-900 dark:border-neutral-700' : 'bg-zinc-200 text-zinc-900 dark:bg-neutral-700';
  return <span className={`${baseStyles} ${variantStyles} ${className}`}>{children}</span>;
};

interface ShareLink {
  id: string;
  shortUrl: string;
  reach: number;
  clicks: number;
  conversions: number;
  createdAt: string;
  petition?: {
    title: string;
  };
}

export function AdminFacebookReach() {
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const response = await fetch('/api/v1/admin/facebook/share-links', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch share links');
        const result = await response.json();
        setLinks(result.links || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchLinks();
  }, []);

  const getConversionRate = (link: ShareLink) => {
    if (link.clicks === 0) return 0;
    return ((link.conversions / link.clicks) * 100).toFixed(1);
  };

  if (error) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="flex items-center gap-2 pt-6">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-800">{error}</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Share Link Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr>
                <th className="text-left py-2 px-2">Petition</th>
                <th className="text-left py-2 px-2">Reach</th>
                <th className="text-left py-2 px-2">Clicks</th>
                <th className="text-left py-2 px-2">Conversions</th>
                <th className="text-left py-2 px-2">Conv. Rate</th>
                <th className="text-left py-2 px-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-2 px-2">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="py-2 px-2">
                      <Skeleton className="h-4 w-12" />
                    </td>
                    <td className="py-2 px-2">
                      <Skeleton className="h-4 w-12" />
                    </td>
                    <td className="py-2 px-2">
                      <Skeleton className="h-4 w-12" />
                    </td>
                    <td className="py-2 px-2">
                      <Skeleton className="h-4 w-12" />
                    </td>
                    <td className="py-2 px-2">
                      <Skeleton className="h-4 w-20" />
                    </td>
                  </tr>
                ))
              ) : links.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-gray-500">
                    No share links found
                  </td>
                </tr>
              ) : (
                links.map((link) => (
                  <tr key={link.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-2">
                      <div>
                        <div className="font-medium">{link.petition?.title || 'Unknown'}</div>
                        <div className="text-xs font-mono text-gray-500">{link.shortUrl}</div>
                      </div>
                    </td>
                    <td className="py-2 px-2 font-medium">{link.reach.toLocaleString()}</td>
                    <td className="py-2 px-2">{link.clicks.toLocaleString()}</td>
                    <td className="py-2 px-2">{link.conversions.toLocaleString()}</td>
                    <td className="py-2 px-2">
                      <Badge variant="outline">{getConversionRate(link)}%</Badge>
                    </td>
                    <td className="py-2 px-2 text-xs text-gray-500">
                      {new Date(link.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
