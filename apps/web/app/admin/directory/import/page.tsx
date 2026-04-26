'use client';

import Link from 'next/link';
import { CSVImporter } from '../../../../components/admin-directory';
import { AdminGuard } from '../../../../components/admin-guard';

export default function ImportPage() {
  return (
    <AdminGuard>
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/admin/directory" className="text-emerald-600 hover:underline">
              ← Directory
            </Link>
            <h1 className="text-3xl font-bold mt-2">Bulk CSV Import</h1>
            <p className="mt-2 text-zinc-600">
              Upload institutions, departments, and contacts from a CSV file.
            </p>
          </div>
        </div>

        <CSVImporter />
      </main>
    </AdminGuard>
  );
}
