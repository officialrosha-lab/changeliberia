'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Send } from 'lucide-react';

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

interface PixelEvent {
  id: string;
  eventType: string;
  eventData: string;
  createdAt: string;
}

interface PixelConfig {
  pixelId: string;
  apiVersion: string;
  active: boolean;
}

export function AdminFacebookPixel() {
  const [events, setEvents] = useState<PixelEvent[]>([]);
  const [config, setConfig] = useState<PixelConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => {
    Promise.all([fetchEvents(), fetchConfig()]);
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/v1/api/admin/facebook/pixel-events', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch pixel events');
      const result = await response.json();
      setEvents(result.events?.slice(0, 10) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/v1/api/admin/facebook/pixel-config', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch pixel config');
      const result = await response.json();
      setConfig(result);
    } catch (err) {
      console.error('Config error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestEvent = async () => {
    setSendingTest(true);
    try {
      const response = await fetch('/api/v1/api/admin/facebook/pixel/test-event', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to send test event');
      await fetchEvents();
      alert('Test event sent successfully');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error sending test event');
    } finally {
      setSendingTest(false);
    }
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
    <div className="space-y-4">
      {config && (
        <Card>
          <CardHeader>
            <CardTitle>Pixel Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pixel ID</p>
                <p className="font-mono text-sm">{config.pixelId}</p>
              </div>
              <Badge className={config.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {config.active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600">API Version</p>
              <p className="font-mono text-sm">{config.apiVersion}</p>
            </div>
            <button
              onClick={handleTestEvent}
              disabled={sendingTest || !config.active}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {sendingTest ? 'Sending...' : 'Send Test Event'}
            </button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No events recorded yet</p>
          ) : (
            <div className="space-y-2">
              {events.map((event) => (
                <div key={event.id} className="border rounded p-3 text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="outline">{event.eventType}</Badge>
                    <span className="text-xs text-gray-500">
                      {new Date(event.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-24">
                    {JSON.stringify(JSON.parse(event.eventData), null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
