'use client';

import { useEffect, useState } from 'react';
import { CMSBlock, CMSPage } from '@/lib/cms';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { CMSPageBlockEditor } from './cms-page-block-editor';
import {
  Clock,
  History,
  FileText,
  Eye,
  EyeOff,
  Save,
  MoreVertical,
  AlertCircle,
} from 'lucide-react';

interface PageVersion {
  id: string;
  title: string;
  createdAt: string;
  author?: { id: string; fullName: string };
  description?: string;
}

interface ScheduledAction {
  id: string;
  action: 'publish' | 'unpublish' | 'update';
  scheduledFor: string;
  createdAt: string;
}

interface CMSPageEnhanced extends CMSPage {
  isDraft?: boolean;
  versions?: PageVersion[];
  schedules?: ScheduledAction[];
}

export function CMSPageEditorEnhanced() {
  const token = useAuthStore((s) => s.token);
  const [selectedPage, setSelectedPage] = useState<CMSPageEnhanced | null>(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showScheduling, setShowScheduling] = useState(false);
  const [versions, setVersions] = useState<PageVersion[]>([]);
  const [schedules, setSchedules] = useState<ScheduledAction[]>([]);
  const [scheduledFor, setScheduledFor] = useState<string>('');
  const [scheduleAction, setScheduleAction] = useState<'publish' | 'unpublish' | 'update'>(
    'publish',
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const loadVersionHistory = async (pageId: string) => {
    if (!token) return;
    try {
      const data = await apiGet<PageVersion[]>(`/cms/pages/${pageId}/versions`, token);
      setVersions(data);
    } catch (err) {
      console.error('Failed to load versions:', err);
    }
  };

  const loadSchedules = async (pageId: string) => {
    if (!token) return;
    try {
      const data = await apiGet<ScheduledAction[]>(`/cms/pages/${pageId}/schedules`, token);
      setSchedules(data);
    } catch (err) {
      console.error('Failed to load schedules:', err);
    }
  };

  const handleToggleDraft = async (pageId: string) => {
    if (!selectedPage || !token) return;

    try {
      setIsSaving(true);
      setSaveStatus('saving');

      const newIsDraft = !selectedPage.isDraft;
      const updated = await apiPatch<CMSPageEnhanced>(
        `/cms/pages/${pageId}/draft`,
        { isDraft: newIsDraft },
        token,
      );

      setSelectedPage(updated);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to toggle draft:', err);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async (pageId: string) => {
    if (!token) return;

    try {
      setIsSaving(true);
      setSaveStatus('saving');

      const updated = await apiPost<CMSPageEnhanced>(
        `/cms/pages/${pageId}/publish`,
        {},
        token,
      );

      setSelectedPage(updated);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to publish:', err);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSchedule = async (pageId: string) => {
    if (!token || !scheduledFor) return;

    try {
      const newSchedule = await apiPost<ScheduledAction>(
        `/cms/pages/${pageId}/schedule`,
        {
          action: scheduleAction,
          scheduledFor: new Date(scheduledFor).toISOString(),
        },
        token,
      );

      setSchedules([...schedules, newSchedule]);
      setScheduledFor('');
      setShowScheduling(false);
    } catch (err) {
      console.error('Failed to schedule:', err);
    }
  };

  const handleCancelSchedule = async (scheduleId: string) => {
    if (!token || !confirm('Cancel this scheduled action?')) return;

    try {
      await apiDelete(`/cms/schedules/${scheduleId}`, token);
      setSchedules(schedules.filter((s) => s.id !== scheduleId));
    } catch (err) {
      console.error('Failed to cancel schedule:', err);
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    if (!selectedPage || !token || !confirm('Restore to this version?')) return;

    try {
      await apiPost(`/cms/versions/${versionId}/restore`, {}, token);
      await loadVersionHistory(selectedPage.id);
      // Reload page
      const updated = await apiGet<CMSPageEnhanced>(`/cms/pages/${selectedPage.id}`, token);
      setSelectedPage(updated);
    } catch (err) {
      console.error('Failed to restore version:', err);
    }
  };

  // Main editor component
  const mainEditor = <CMSPageBlockEditor />;

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      {selectedPage && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Draft Badge */}
              <div
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${
                  selectedPage.isDraft
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                {selectedPage.isDraft ? (
                  <>
                    <FileText className="w-4 h-4" />
                    Draft
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    Published
                  </>
                )}
              </div>

              {/* Status */}
              {saveStatus === 'saving' && (
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  Saving...
                </span>
              )}
              {saveStatus === 'saved' && (
                <span className="text-sm text-green-600 flex items-center gap-2">
                  ✓ Saved
                </span>
              )}
              {saveStatus === 'error' && (
                <span className="text-sm text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Error saving
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {/* Toggle Draft */}
              <button
                onClick={() => handleToggleDraft(selectedPage.id)}
                disabled={isSaving}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
                  selectedPage.isDraft
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {selectedPage.isDraft ? 'Mark as Ready' : 'Back to Draft'}
              </button>

              {/* Publish Button */}
              {selectedPage.isDraft && (
                <button
                  onClick={() => handlePublish(selectedPage.id)}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <Eye className="w-4 h-4" />
                  Publish Now
                </button>
              )}

              {/* Schedule Button */}
              <button
                onClick={() => setShowScheduling(!showScheduling)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                <Clock className="w-4 h-4" />
                Schedule
              </button>

              {/* Version History */}
              <button
                onClick={() => {
                  setShowVersionHistory(!showVersionHistory);
                  if (!showVersionHistory) {
                    loadVersionHistory(selectedPage.id);
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
              >
                <History className="w-4 h-4" />
                History
              </button>
            </div>
          </div>

          {/* Scheduling Panel */}
          {showScheduling && (
            <div className="border-t border-gray-200 pt-4 space-y-3">
              <h3 className="font-semibold">Schedule Content Action</h3>
              <div className="flex gap-3">
                <select
                  value={scheduleAction}
                  onChange={(e) => setScheduleAction(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="publish">Publish</option>
                  <option value="unpublish">Unpublish</option>
                  <option value="update">Update</option>
                </select>

                <input
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm flex-1"
                />

                <button
                  onClick={() => handleSchedule(selectedPage.id)}
                  disabled={!scheduledFor}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  Schedule
                </button>
              </div>

              {/* Scheduled Actions List */}
              {schedules.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  {schedules.map((schedule) => (
                    <div
                      key={schedule.id}
                      className="flex items-center justify-between bg-white p-2 rounded border border-gray-200"
                    >
                      <div className="text-sm">
                        <span className="font-semibold">{schedule.action}</span> on{' '}
                        {new Date(schedule.scheduledFor).toLocaleString()}
                      </div>
                      <button
                        onClick={() => handleCancelSchedule(schedule.id)}
                        className="text-red-600 hover:text-red-800 font-semibold text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Version History Panel */}
          {showVersionHistory && (
            <div className="border-t border-gray-200 pt-4 space-y-3">
              <h3 className="font-semibold">Version History</h3>
              {versions.length === 0 ? (
                <p className="text-sm text-gray-500">No versions yet</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {versions.map((version) => (
                    <div
                      key={version.id}
                      className="flex items-center justify-between bg-gray-50 p-3 rounded border border-gray-200"
                    >
                      <div className="text-sm">
                        <div className="font-semibold">{version.description}</div>
                        <div className="text-gray-600">
                          {new Date(version.createdAt).toLocaleString()} by{' '}
                          {version.author?.fullName}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRestoreVersion(version.id)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-700 transition-colors"
                      >
                        Restore
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Main Editor */}
      {mainEditor}
    </div>
  );
}
