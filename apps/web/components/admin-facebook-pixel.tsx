'use client';

import { useEffect, useState, useCallback } from 'react';
import { AlertCircle, Send } from 'lucide-react';
import { apiGet, apiPatch, apiPost } from '../lib/api';
import { useToast } from '../lib/toast-context';
import { useAuthStore } from '../lib/store';
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
  const token = useAuthStore((s) => s.token);
  const [events, setEvents] = useState<PixelEvent[]>([]);
  const [config, setConfig] = useState<PixelConfig | null>(null);
  const [editedPixelId, setEditedPixelId] = useState('');
  const [editedApiVersion, setEditedApiVersion] = useState('18.0');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingTest, setSendingTest] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configMessage, setConfigMessage] = useState<string | null>(null);
  const { show: showToast } = useToast();

  const fetchEvents = useCallback(async () => {
    if (!token) return;
    try {
      const result = await apiGet<{ events: PixelEvent[] }>('/admin/facebook/pixel-events', token);
      setEvents(result.events?.slice(0, 10) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [token]);

  const fetchConfig = useCallback(async () => {
    if (!token) return;
    try {
      const result = await apiGet<PixelConfig>('/admin/facebook/pixel-config', token);
      setConfig(result);
      setEditedPixelId(result.pixelId === 'NOT_SET' ? '' : result.pixelId);
      setEditedApiVersion(result.apiVersion || '18.0');
    } catch (err) {
      console.error('Config error:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const handleSaveConfig = async () => {
    if (!token) return;
    setSavingConfig(true);
    setConfigMessage(null);
    try {
      await apiPatch('/admin/facebook/pixel-config', {
        pixelId: editedPixelId,
        apiVersion: editedApiVersion,
      }, token);
      setConfigMessage('Pixel settings saved successfully.');
      showToast('Pixel settings saved successfully.', 'success');
      await fetchConfig();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save pixel settings';
      setConfigMessage(msg);
      showToast(msg, 'error');
    } finally {
      setSavingConfig(false);
    }
  };

  useEffect(() => {
    Promise.all([fetchEvents(), fetchConfig()]);
  }, [fetchEvents, fetchConfig]);

  const handleTestEvent = async () => {
    if (!token) return;
    setSendingTest(true);
    try {
      await apiPost('/admin/facebook/pixel/test-event', {}, token);
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
            {configMessage ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {configMessage}
              </div>
            ) : null}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pixel ID</p>
                <input
                  type="text"
                  value={editedPixelId}
                  onChange={(event) => setEditedPixelId(event.target.value)}
                  placeholder="Enter Pixel ID"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                />
              </div>
              <Badge className={config.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {config.active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600">API Version</p>
              <input
                type="text"
                value={editedApiVersion}
                onChange={(event) => setEditedApiVersion(event.target.value)}
                placeholder="18.0"
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              />
            </div>
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <button
                type="button"
                onClick={handleSaveConfig}
                disabled={savingConfig || !editedPixelId.trim()}
                className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {savingConfig ? 'Saving…' : 'Save Pixel Settings'}
              </button>
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
