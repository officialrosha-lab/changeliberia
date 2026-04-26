'use client';

import { useRef, useState } from 'react';
import { apiPost } from '../../lib/api';
import { useAuthStore } from '../../lib/store';

interface ImportStats {
  totalRows: number;
  processedRows: number;
  createdInstitutions: number;
  createdDepartments: number;
  createdContacts: number;
  skippedRows: number;
  errors: Array<{ row: number; error: string }>;
  warnings: Array<{ row: number; warning: string }>;
}

export function CSVImporter() {
  const token = useAuthStore((s) => s.token);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTemplate, setShowTemplate] = useState(false);

  async function handleDownloadTemplate() {
    try {
      const response = await fetch('/api/admin/directory/import/template', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const csv = await response.text();
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'institution-template.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download template');
    }
  }

  async function handleFileSelect(file: File) {
    if (!token) return;
    try {
      setUploading(true);
      setError(null);
      setResult(null);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/directory/import/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import CSV');
    } finally {
      setUploading(false);
    }
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.currentTarget.classList.add('bg-emerald-50');
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.currentTarget.classList.remove('bg-emerald-50');
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-emerald-50');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">CSV Import Guide</h3>
        <ul className="text-sm text-blue-800 space-y-1 ml-4 list-disc">
          <li>Download the template CSV file to see the expected format</li>
          <li>Fill in institution, department, and contact information</li>
          <li>Upload the file to bulk import into the directory</li>
          <li>Duplicate institutions and departments are automatically skipped</li>
        </ul>
      </div>

      {/* Download Template */}
      <div className="flex gap-2">
        <button
          onClick={handleDownloadTemplate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Download Template
        </button>
        <button
          onClick={() => setShowTemplate(!showTemplate)}
          className="px-4 py-2 bg-zinc-200 text-zinc-900 rounded-lg font-medium hover:bg-zinc-300 transition-colors"
        >
          View Format
        </button>
      </div>

      {/* Format Preview */}
      {showTemplate && (
        <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200 overflow-x-auto">
          <p className="text-sm font-semibold mb-2">Expected CSV Format:</p>
          <pre className="text-xs bg-white p-3 rounded border border-zinc-200 overflow-auto max-h-48">
            institutionName,type,category,departmentName,email,secondaryEmails,phone,tags,priorityLevel,contactName,official,verified
            Ministry of Health,GOVERNMENT,HEALTH,General Inquiries,health@moh.gov.lr,health-ops@moh.gov.lr,+231-6-000-0001,health;medical,HIGH,John Doe,true,true
            National Road Authority,GOVERNMENT,AGENCY,Engineering,nra@nra.gov.lr,,+231-6-000-0002,roads;infrastructure;maintenance,HIGH,Jane Smith,true,false
          </pre>
        </div>
      )}

      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="border-2 border-dashed border-zinc-300 rounded-lg p-8 text-center transition-colors cursor-pointer hover:border-emerald-400"
        onClick={() => fileInputRef.current?.click()}
      >
        <svg
          className="mx-auto h-12 w-12 text-zinc-400"
          stroke="currentColor"
          fill="none"
          viewBox="0 0 48 48"
        >
          <path
            d="M28 8H12a4 4 0 00-4 4v20a4 4 0 004 4h24a4 4 0 004-4V20m-10-2l-3.172-3.172a2 2 0 00-2.828 0L20 10m8-4v4m0 0h4m-4 0h-4"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <p className="mt-4 font-semibold">Drag and drop your CSV file here</p>
        <p className="text-sm text-zinc-600">or click to select from your computer</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
          }}
        />
      </div>

      {/* Upload Status */}
      {uploading && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
          Uploading and processing your file...
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Import Results */}
      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-900 mb-3">Import Complete!</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white p-3 rounded border border-green-200">
              <p className="text-xs text-zinc-600">Total Rows</p>
              <p className="text-lg font-bold text-green-700">{result.totalRows}</p>
            </div>
            <div className="bg-white p-3 rounded border border-green-200">
              <p className="text-xs text-zinc-600">Institutions</p>
              <p className="text-lg font-bold text-green-700">{result.createdInstitutions}</p>
            </div>
            <div className="bg-white p-3 rounded border border-green-200">
              <p className="text-xs text-zinc-600">Departments</p>
              <p className="text-lg font-bold text-green-700">{result.createdDepartments}</p>
            </div>
            <div className="bg-white p-3 rounded border border-green-200">
              <p className="text-xs text-zinc-600">Contacts</p>
              <p className="text-lg font-bold text-green-700">{result.createdContacts}</p>
            </div>
            <div className="bg-white p-3 rounded border border-green-200">
              <p className="text-xs text-zinc-600">Skipped</p>
              <p className="text-lg font-bold text-orange-700">{result.skippedRows}</p>
            </div>
          </div>

          {/* Errors and Warnings */}
          {(result.errors.length > 0 || result.warnings.length > 0) && (
            <div className="mt-4 space-y-2">
              {result.errors.length > 0 && (
                <div>
                  <p className="font-semibold text-red-700 mb-1">Errors:</p>
                  <ul className="text-sm text-red-600 space-y-1 ml-4 list-disc">
                    {result.errors.slice(0, 5).map((e, i) => (
                      <li key={i}>
                        Row {e.row}: {e.error}
                      </li>
                    ))}
                    {result.errors.length > 5 && (
                      <li>... and {result.errors.length - 5} more errors</li>
                    )}
                  </ul>
                </div>
              )}
              {result.warnings.length > 0 && (
                <div>
                  <p className="font-semibold text-yellow-700 mb-1">Warnings:</p>
                  <ul className="text-sm text-yellow-600 space-y-1 ml-4 list-disc">
                    {result.warnings.slice(0, 5).map((w, i) => (
                      <li key={i}>
                        Row {w.row}: {w.warning}
                      </li>
                    ))}
                    {result.warnings.length > 5 && (
                      <li>... and {result.warnings.length - 5} more warnings</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
