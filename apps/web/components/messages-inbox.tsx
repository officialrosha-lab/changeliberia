'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store/auth-store';
import { apiGet, apiPost, apiPut } from '@/lib/api';
import {
  Mail,
  Archive,
  Trash2,
  Search,
  Filter,
  Check,
  ChevronDown,
} from 'lucide-react';

interface Message {
  id: string;
  senderId: string;
  sender: {
    id: string;
    fullName: string;
    avatarUrl?: string;
  };
  subject: string;
  content: string;
  category?: string;
  isRead: boolean;
  createdAt: string;
}

interface InboxResponse {
  messages: Message[];
  total: number;
  page: number;
  pageSize: number;
}

export function MessagesInbox() {
  const { token } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(
    new Set(),
  );
  const [filters, setFilters] = useState({
    category: '',
    isRead: undefined as boolean | undefined,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(
    null,
  );

  const pageSize = 20;

  // Load messages
  useEffect(() => {
    loadMessages();
    loadUnreadCount();
  }, [page, filters]);

  const loadMessages = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(filters.category && { category: filters.category }),
        ...(filters.isRead !== undefined && {
          isRead: filters.isRead.toString(),
        }),
      });

      const response = await apiGet(`/messages/inbox?${params}`, token!);
      const data = (await response.json()) as InboxResponse;

      setMessages(data.messages);
    } catch (err: any) {
      setError(err.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await apiGet('/messages/unread-count', token!);
      const data = (await response.json()) as { unreadCount: number };
      setUnreadCount(data.unreadCount);
    } catch (err) {
      console.error('Failed to load unread count:', err);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadMessages();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        query: searchQuery,
        page: '1',
        pageSize: pageSize.toString(),
      });

      const response = await apiGet(`/messages/search/query?${params}`, token!);
      const data = (await response.json()) as InboxResponse;

      setMessages(data.messages);
      setPage(1);
    } catch (err: any) {
      setError(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      await apiPut(`/messages/${messageId}/read`, {}, token!);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, isRead: true } : msg,
        ),
      );
      loadUnreadCount();
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const archiveMessage = async (messageId: string) => {
    try {
      await apiPut(`/messages/${messageId}/archive`, {}, token!);
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    } catch (err) {
      console.error('Failed to archive message:', err);
    }
  };

  const markMultipleAsRead = async () => {
    if (selectedMessages.size === 0) return;

    try {
      await apiPut(
        '/messages/mark-read/bulk',
        { messageIds: Array.from(selectedMessages) },
        token!,
      );

      setMessages((prev) =>
        prev.map((msg) =>
          selectedMessages.has(msg.id) ? { ...msg, isRead: true } : msg,
        ),
      );
      setSelectedMessages(new Set());
      loadUnreadCount();
    } catch (err) {
      console.error('Failed to mark multiple as read:', err);
    }
  };

  const toggleMessageSelection = (messageId: string) => {
    const newSelected = new Set(selectedMessages);
    if (newSelected.has(messageId)) {
      newSelected.delete(messageId);
    } else {
      newSelected.add(messageId);
    }
    setSelectedMessages(newSelected);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    if (diffDays < 1) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
    } else if (diffDays < 7) {
      return `${Math.floor(diffDays)}d ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="w-6 h-6" />
          <h2 className="text-2xl font-bold">Messages</h2>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-sm font-bold rounded-full px-2.5 py-0.5">
              {unreadCount}
            </span>
          )}
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Search
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800 transition"
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) =>
                  setFilters({ ...filters, category: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="">All Categories</option>
                <option value="petition_update">Petition Update</option>
                <option value="admin_message">Admin Message</option>
                <option value="system_alert">System Alert</option>
                <option value="broadcast">Broadcast</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={
                  filters.isRead === undefined
                    ? 'all'
                    : filters.isRead
                      ? 'read'
                      : 'unread'
                }
                onChange={(e) => {
                  if (e.target.value === 'all') {
                    setFilters({ ...filters, isRead: undefined });
                  } else {
                    setFilters({
                      ...filters,
                      isRead: e.target.value === 'read',
                    });
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="all">All</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedMessages.size > 0 && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <span className="text-sm font-medium">
            {selectedMessages.size} selected
          </span>
          <button
            onClick={markMultipleAsRead}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Mark as Read
          </button>
        </div>
      )}

      {/* Messages List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="text-gray-500">Loading messages...</div>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-200 rounded-lg">
          {error}
        </div>
      ) : messages.length === 0 ? (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          No messages found
        </div>
      ) : (
        <div className="space-y-1 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          {messages.map((message) => (
            <div key={message.id}>
              <div
                className={`flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition ${
                  !message.isRead ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                }`}
                onClick={() =>
                  setExpandedMessageId(
                    expandedMessageId === message.id ? null : message.id,
                  )
                }
              >
                <input
                  type="checkbox"
                  checked={selectedMessages.has(message.id)}
                  onChange={() => toggleMessageSelection(message.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 rounded"
                />

                {!message.isRead && (
                  <div className="w-2 h-2 rounded-full bg-blue-600" />
                )}

                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {message.sender.fullName}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {message.subject}
                  </div>
                </div>

                {message.category && (
                  <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">
                    {message.category}
                  </span>
                )}

                <div className="text-xs text-gray-500 whitespace-nowrap">
                  {formatDate(message.createdAt)}
                </div>

                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transform transition ${
                    expandedMessageId === message.id ? 'rotate-180' : ''
                  }`}
                />
              </div>

              {/* Expanded Message Detail */}
              {expandedMessageId === message.id && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <div className="prose dark:prose-invert max-w-none text-sm mb-4">
                    {message.content}
                  </div>

                  <div className="flex gap-2">
                    {!message.isRead && (
                      <button
                        onClick={() => markAsRead(message.id)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        Mark as Read
                      </button>
                    )}

                    <button
                      onClick={() => archiveMessage(message.id)}
                      className="px-3 py-1 text-sm bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-600 transition flex items-center gap-2"
                    >
                      <Archive className="w-4 h-4" />
                      Archive
                    </button>

                    <button
                      onClick={() => {
                        /* Delete functionality */
                      }}
                      className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-200 rounded hover:bg-red-200 dark:hover:bg-red-900/40 transition flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && messages.length > 0 && (
        <div className="flex justify-between items-center py-4">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800 transition"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {page}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={messages.length < pageSize}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800 transition"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
