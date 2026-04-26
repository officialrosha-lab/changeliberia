'use client';

import { useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface ImageUploadPreviewProps {
  label?: string;
  onImageSelect?: (file: File, preview: string) => void;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
  error?: string | null;
  touched?: boolean;
}

export function ImageUploadPreview({
  label = 'Upload image',
  onImageSelect,
  maxSize = 5,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  error,
  touched,
}: ImageUploadPreviewProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(error || null);

  const handleFileSelect = useCallback(
    (file: File) => {
      setUploadError(null);

      // Check file type
      if (!acceptedTypes.includes(file.type)) {
        setUploadError(`File type not supported. Accepted: ${acceptedTypes.map((t) => t.split('/')[1]).join(', ')}`);
        return;
      }

      // Check file size
      if (file.size > maxSize * 1024 * 1024) {
        setUploadError(`File size exceeds ${maxSize}MB limit`);
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreview(result);
        setPreviewFile(file);
        onImageSelect?.(file, result);
      };
      reader.onerror = () => {
        setUploadError('Failed to read file');
      };
      reader.readAsDataURL(file);
    },
    [acceptedTypes, maxSize, onImageSelect]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleRemove = useCallback(() => {
    setPreview(null);
    setPreviewFile(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-zinc-900 dark:text-neutral-100 mb-2">
          {label}
        </label>
      )}

      {preview ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative rounded-lg overflow-hidden border-2 border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 p-4"
        >
          <div className="relative w-full aspect-video bg-zinc-200 dark:bg-neutral-700 rounded-lg overflow-hidden">
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-cover"
              sizes="100vw"
            />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="text-sm">
              <p className="font-medium text-zinc-900 dark:text-neutral-100">{previewFile?.name}</p>
              <p className="text-xs text-zinc-500 dark:text-neutral-500">
                {(previewFile?.size || 0) / 1024 < 1024
                  ? `${((previewFile?.size || 0) / 1024).toFixed(1)} KB`
                  : `${((previewFile?.size || 0) / (1024 * 1024)).toFixed(1)} MB`}
              </p>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 dark:bg-red-950 dark:hover:bg-red-900 dark:text-red-400 transition-colors"
              title="Remove image"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          animate={{ backgroundColor: isDragging ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0, 0, 0, 0)' }}
          className={`relative rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors cursor-pointer ${
            isDragging
              ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
              : uploadError
                ? 'border-red-300 dark:border-red-900'
                : 'border-zinc-300 dark:border-neutral-700 hover:border-zinc-400 dark:hover:border-neutral-600'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes.join(',')}
            onChange={handleInputChange}
            className="hidden"
            aria-label="Upload image"
          />

          <div className="flex flex-col items-center gap-2">
            <div className="h-12 w-12 rounded-full bg-zinc-100 dark:bg-neutral-800 flex items-center justify-center">
              <svg className="h-6 w-6 text-zinc-400 dark:text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <p className="font-medium text-zinc-900 dark:text-neutral-100">Drag and drop an image here</p>
              <p className="text-sm text-zinc-600 dark:text-neutral-400">or click to browse</p>
            </div>
            <p className="text-xs text-zinc-500 dark:text-neutral-500">
              {acceptedTypes.map((t) => t.split('/')[1]).join(', ').toUpperCase()} • Up to {maxSize}MB
            </p>
          </div>
        </motion.div>
      )}

      {uploadError && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium"
        >
          {uploadError}
        </motion.p>
      )}
    </div>
  );
}
