'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '../lib/store';
import { apiGet, apiPost } from '../lib/api';
import { Send, Users, AlertCircle, CheckCircle } from 'lucide-react';

interface StakeholderGroup {
  id: string;
  groupType: string;
  memberCount: number;
}

interface BroadcastResult {
  success: boolean;
  recipientCount: number;
  successCount: number;
  failedCount: number;
  message?: string;
}

export function BroadcastPanel({ petitionId }: { petitionId: string }) {
  const { token } = useAuthStore();
  const [groups, setGroups] = useState<StakeholderGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<BroadcastResult | null>(null);
  const [selectedGroupType, setSelectedGroupType] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('broadcast');

  // Load stakeholder groups
  useEffect(() => {
    loadGroups();
  }, [petitionId]);

  const loadGroups = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiGet<{ groups: StakeholderGroup[] }>(
        `/admin/stakeholder-groups/petition/${petitionId}`,
        token!,
      );

      setGroups(data.groups || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load stakeholder groups');
    } finally {
      setLoading(false);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedGroupType) {
      setError('Please select a stakeholder group');
      return;
    }

    if (!subject.trim() || !content.trim()) {
      setError('Subject and message content are required');
      return;
    }

    setSending(true);
    setError(null);
    setSuccess(null);

    try {
      const selectedGroup = groups.find((g) => g.groupType === selectedGroupType);
      if (!selectedGroup) {
        throw new Error('Selected group not found');
      }

      const result = await apiPost<BroadcastResult>(
        `/admin/broadcast/group/${selectedGroup.id}`,
        {
          subject,
          content,
          category,
        },
        token!,
      );

      if (result.success || result.successCount > 0) {
        setSuccess(result);
        setSubject('');
        setContent('');
        setSelectedGroupType('');

        // Auto-clear success after 5 seconds
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError('Failed to send broadcast message');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send broadcast');
    } finally {
      setSending(false);
    }
  };

  const selectedGroup = groups.find((g) => g.groupType === selectedGroupType);
  const selectedMemberCount = selectedGroup?.memberCount || 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Send className="w-6 h-6" />
        <h2 className="text-2xl font-bold">Broadcast Message</h2>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium">Error</h3>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-200 rounded-lg">
          <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium">Success!</h3>
            <p className="text-sm">
              Message sent to {success.successCount} of {success.recipientCount}{' '}
              recipients
            </p>
            {success.failedCount > 0 && (
              <p className="text-sm mt-1">
                ({success.failedCount} failed to send)
              </p>
            )}
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSendBroadcast} className="space-y-4">
        {/* Group Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Stakeholder Group
          </label>
          {loading ? (
            <div className="text-gray-500">Loading groups...</div>
          ) : groups.length === 0 ? (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-200 rounded-lg text-sm">
              No stakeholder groups found for this petition. Groups are created
              when a petition is published.
            </div>
          ) : (
            <select
              value={selectedGroupType}
              onChange={(e) => setSelectedGroupType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="">-- Select a group --</option>
              {groups.map((group) => (
                <option key={group.id} value={group.groupType}>
                  {group.groupType.replace(/_/g, ' ')} ({group.memberCount})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Group Info Card */}
        {selectedGroup && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900 dark:text-blue-100">
                  {selectedGroup.groupType.replace(/_/g, ' ')}
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  This message will be sent to{' '}
                  <strong>{selectedMemberCount} members</strong>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Subject */}
        <div>
          <label className="block text-sm font-medium mb-2">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject line"
            maxLength={200}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700"
            disabled={sending}
          />
          <p className="text-xs text-gray-500 mt-1">
            {subject.length}/200 characters
          </p>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium mb-2">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700"
            disabled={sending}
          >
            <option value="broadcast">Broadcast</option>
            <option value="petition_update">Petition Update</option>
            <option value="admin_message">Admin Message</option>
            <option value="system_alert">System Alert</option>
          </select>
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium mb-2">Message</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your message here... (supports plain text)"
            rows={8}
            maxLength={5000}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 font-mono text-sm"
            disabled={sending}
          />
          <p className="text-xs text-gray-500 mt-1">
            {content.length}/5000 characters
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={sending || !selectedGroupType || !subject || !content}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            {sending ? 'Sending...' : 'Send Broadcast'}
          </button>

          <button
            type="button"
            onClick={() => {
              setSubject('');
              setContent('');
              setSelectedGroupType('');
              setError(null);
            }}
            className="px-6 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            Clear
          </button>
        </div>
      </form>

      {/* Info Box */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="font-medium mb-2">About Broadcasts</h3>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>
            • Messages are sent to all members of the selected stakeholder group
          </li>
          <li>• Each recipient receives an individual in-app message</li>
          <li>• Email notifications are sent automatically</li>
          <li>• Recipients can search, filter, and archive messages</li>
        </ul>
      </div>
    </div>
  );
}
