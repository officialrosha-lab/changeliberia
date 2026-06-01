'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumb } from '../../../components/breadcrumb';
import { apiGet, apiPost } from '../../../lib/api';
import { useAuthStore } from '../../../lib/store';
import { useToast } from '../../../lib/toast-context';

interface MessageParticipant {
  id: string;
  fullName: string;
  email?: string;
}

interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  sender: MessageParticipant;
  recipient: MessageParticipant;
  subject: string;
  content: string;
  category?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  replyToId?: string;
}

interface ThreadResponse {
  root: Message;
  thread: Message[];
}

interface CurrentUser {
  id: string;
  fullName: string;
}

export default function MessageThreadPage() {
  const params = useParams();
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [threadData, setThreadData] = useState<ThreadResponse | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { show } = useToast();

  const messageId = params?.id as string | undefined;

  useEffect(() => {
    if (!token) {
      router.replace('/auth/login');
      return;
    }

    if (!messageId) {
      return;
    }

    let cancelled = false;

    const loadThread = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [user, thread] = await Promise.all([
          apiGet<CurrentUser>('/users/me', token),
          apiGet<ThreadResponse>(`/messages/${messageId}/thread`, token),
        ]);

        if (cancelled) return;
        setCurrentUser(user);
        setThreadData(thread);
      } catch (err: any) {
        setError(err?.message || 'Failed to load message thread');
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadThread();

    return () => {
      cancelled = true;
    };
  }, [messageId, router, token]);

  const threadRoot = threadData?.root;
  const otherParticipant = (() => {
    if (!threadRoot || !currentUser) return null;
    if (threadRoot.senderId === currentUser.id) {
      return threadRoot.recipient;
    }
    return threadRoot.sender;
  })();

  const replySubject = threadRoot
    ? threadRoot.subject.startsWith('Re:')
      ? threadRoot.subject
      : `Re: ${threadRoot.subject}`
    : '';

  const handleReply = async () => {
    if (!token || !threadRoot || !otherParticipant) return;
    if (!replyContent.trim()) {
      show('Reply cannot be empty', 'warning');
      return;
    }

    setIsSending(true);
    try {
      await apiPost('/messages', {
        recipientId: otherParticipant.id,
        subject: replySubject,
        content: replyContent.trim(),
        replyToId: threadRoot.id,
      }, token);

      setReplyContent('');
      show('Reply sent successfully', 'success');
      const updatedThread = await apiGet<ThreadResponse>(`/messages/${messageId}/thread`, token);
      setThreadData(updatedThread);
    } catch (err: any) {
      show(err?.message || 'Failed to send reply', 'error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Messages', href: '/messages' },
            { label: 'Thread', current: true },
          ]}
        />

        <div className="mt-8 mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-zinc-900 dark:text-white">
              Message Thread
            </h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl">
              Read the full conversation and send a reply to keep the discussion moving.
            </p>
          </div>
          <Link
            href="/messages"
            className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
          >
            Back to inbox
          </Link>
        </div>

        {isLoading ? (
          <div className="rounded-3xl border border-gray-200 bg-gray-50 p-8 text-center text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
            Loading thread...
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-200">
            {error}
          </div>
        ) : !threadRoot ? (
          <div className="rounded-3xl border border-gray-200 bg-gray-50 p-8 text-center text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
            Message thread not found.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-neutral-900">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-400 font-semibold">
                    Conversation
                  </div>
                  <h2 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-white">
                    {threadRoot.subject}
                  </h2>
                </div>
                <div className="text-right text-sm text-zinc-500 dark:text-zinc-400">
                  <div>{new Date(threadRoot.createdAt).toLocaleString()}</div>
                  <div>{threadRoot.sender.fullName} → {threadRoot.recipient.fullName}</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {threadData.thread.map((message) => (
                <div
                  key={message.id}
                  className={`rounded-3xl border p-5 shadow-sm dark:border-gray-700 dark:bg-neutral-950 ${
                    message.id === threadRoot.id ? 'bg-white dark:bg-neutral-900' : 'bg-gray-50 dark:bg-gray-900'
                  }`}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-sm font-semibold text-zinc-900 dark:text-white">
                        {message.sender.fullName}
                        {currentUser?.id === message.senderId ? ' (You)' : ''}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        {new Date(message.createdAt).toLocaleString()}
                      </div>
                    </div>
                    {message.category && (
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                        {message.category}
                      </span>
                    )}
                  </div>
                  <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-zinc-700 dark:text-zinc-300">
                    {message.content}
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-neutral-900">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">
                Reply to this thread
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Your reply will be sent to {otherParticipant?.fullName || 'the other participant'}.
              </p>
              <textarea
                value={replyContent}
                onChange={(event) => setReplyContent(event.target.value)}
                rows={6}
                placeholder="Write your reply…"
                className="mt-4 w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
              />
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-zinc-500 dark:text-zinc-400">
                  Replying to: <span className="font-medium text-zinc-700 dark:text-zinc-200">{otherParticipant?.fullName || 'Recipient'}</span>
                </div>
                <button
                  type="button"
                  onClick={handleReply}
                  disabled={isSending}
                  className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSending ? 'Sending reply…' : 'Send reply'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
