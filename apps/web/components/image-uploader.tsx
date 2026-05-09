import React, { useState, useRef } from 'react';
import { Upload, X, Loader, AlertCircle } from 'lucide-react';
import { apiPost, apiDelete } from '../lib/api';

interface UploadedFile {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  size: number;
  alt?: string;
  uploadedBy: string;
  createdAt: string;
}

interface ImageUploaderProps {
  onFileSelected: (file: UploadedFile) => void;
  maxSize?: number; // in bytes, default 5MB
  acceptedTypes?: string[];
}

export function ImageUploader({
  onFileSelected,
  maxSize = 5 * 1024 * 1024,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `Invalid file type. Accepted: ${acceptedTypes.join(', ')}`;
    }

    if (file.size > maxSize) {
      return `File too large. Maximum size: ${(maxSize / 1024 / 1024).toFixed(1)}MB`;
    }

    return null;
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setError(null);
    const file = files[0];

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('alt', `Image: ${file.name}`);

      const response = await apiPost<UploadedFile>('/api/v1/cms/files/upload', formData);

      setUploadedFiles([response, ...uploadedFiles]);
      onFileSelected(response);

      // Reset
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleFiles(e.dataTransfer.files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const handleDelete = async (fileId: string) => {
    try {
      await apiDelete(`/api/v1/cms/files/${fileId}`);
      setUploadedFiles(uploadedFiles.filter((f) => f.id !== fileId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100'
        } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileInputChange}
          accept={acceptedTypes.join(',')}
          disabled={isUploading}
          className="hidden"
          id="file-input"
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-sm font-semibold text-gray-700">Uploading...</p>
          </div>
        ) : (
          <label htmlFor="file-input" className="cursor-pointer flex flex-col items-center gap-2">
            <Upload className="w-8 h-8 text-gray-400" />
            <div>
              <p className="font-semibold text-gray-700">Drag and drop or click to upload</p>
              <p className="text-xs text-gray-500">
                Max {(maxSize / 1024 / 1024).toFixed(1)}MB • JPEG, PNG, WebP, GIF
              </p>
            </div>
          </label>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Recently Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Recently Uploaded</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="relative group rounded-lg overflow-hidden bg-gray-200">
                <img
                  src={file.url}
                  alt={file.originalName}
                  className="w-full h-24 object-cover group-hover:opacity-75 transition-opacity cursor-pointer"
                  onClick={() => onFileSelected(file)}
                  title="Click to select"
                />
                <button
                  onClick={() => handleDelete(file.id)}
                  className="absolute top-1 right-1 p-1 bg-red-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
