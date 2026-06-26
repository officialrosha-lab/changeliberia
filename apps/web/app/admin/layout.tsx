'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../lib/store';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { token, hydrated } = useAuthStore();

  useEffect(() => {
    if (!hydrated) return;
    if (!token) {
      router.replace('/auth/login?next=/admin');
    }
  }, [hydrated, token, router]);

  // Don't flash admin content before hydration check completes
  if (!hydrated || !token) return null;

  return <>{children}</>;
}
