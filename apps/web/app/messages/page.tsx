'use client';

import { Breadcrumb } from '../../components/breadcrumb';
import { MessagesInbox } from '../../components/messages-inbox';

export default function MessagesPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Messages', current: true },
          ]}
        />

        <div className="mt-8 mb-8">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-white">
            Messages
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl">
            View your inbox, open message threads, and reply directly to conversations.
          </p>
        </div>

        <MessagesInbox />
      </div>
    </div>
  );
}
