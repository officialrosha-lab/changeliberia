'use client';

import { CMSEditor } from '../../../../components/cms';
import { AdminGuard } from '../../../../components/admin-guard';

export const dynamic = 'force-dynamic';

export default function EditorPage() {
  return (
    <AdminGuard>
      <CMSEditor />
    </AdminGuard>
  );
}
