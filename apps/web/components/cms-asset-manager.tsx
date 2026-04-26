'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Asset {
  id: string;
  name: string;
  filename: string;
  size: number;
  type: 'image' | 'document' | 'video' | 'other';
  url: string;
  mimeType: string;
  uploadedAt: Date;
  dimensions?: { width: number; height: number };
  optimizedVariants?: Array<{ name: string; size: number; url: string }>;
  tags: string[];
}

interface CMSAssetManagerProps {
  assets: Asset[];
  onUploadAssets?: (files: File[]) => Promise<Asset[]>;
  onDeleteAsset?: (assetId: string) => Promise<void>;
  onUpdateAssetTags?: (assetId: string, tags: string[]) => Promise<void>;
  isLoading?: boolean;
  maxFileSize?: number; // in bytes
  allowedTypes?: string[];
}

const FILE_TYPE_ICONS: Record<string, string> = {
  'image': '🖼️',
  'document': '📄',
  'video': '🎥',
  'other': '📦',
};

const FORMAT_OPTIONS = [
  { format: 'original', label: 'Original', width: 'auto', height: 'auto' },
  { format: 'thumbnail', label: 'Thumbnail', width: 150, height: 150 },
  { format: 'small', label: 'Small', width: 320, height: 240 },
  { format: 'medium', label: 'Medium', width: 800, height: 600 },
  { format: 'large', label: 'Large', width: 1920, height: 1440 },
];

export function CMSAssetManager({
  assets,
  onUploadAssets,
  onDeleteAsset,
  onUpdateAssetTags,
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
}: CMSAssetManagerProps) {
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'document' | 'video' | 'other'>('all');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [assetTags, setAssetTags] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.filename.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || asset.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleUpload(files);
  };

  const handleUpload = async (files: File[]) => {
    // Validate files
    const validFiles = files.filter(file => {
      if (file.size > maxFileSize) {
        console.error(`${file.name} exceeds max file size`);
        return false;
      }
      if (!allowedTypes.includes(file.type)) {
        console.error(`${file.type} is not allowed`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(true);
    try {
      // Simulate upload progress
      validFiles.forEach(file => {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

        const interval = setInterval(() => {
          setUploadProgress(prev => {
            const current = prev[file.name] || 0;
            if (current >= 100) {
              clearInterval(interval);
              return prev;
            }
            return { ...prev, [file.name]: Math.min(current + Math.random() * 30, 95) };
          });
        }, 200);
      });

      const newAssets = await onUploadAssets?.(validFiles);
      if (newAssets) {
        validFiles.forEach(file => {
          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
        });
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
      setUploadProgress({});
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    await onDeleteAsset?.(assetId);
    setSelectedAssets(selectedAssets.filter(id => id !== assetId));
  };

  const handleSaveAssetTags = async () => {
    if (!selectedAsset) return;

    const tags = assetTags.split(',').map(t => t.trim()).filter(Boolean);
    await onUpdateAssetTags?.(selectedAsset.id, tags);
    setSelectedAsset({ ...selectedAsset, tags });
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="w-full space-y-6"
    >
      {/* Upload Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-900/20 dark:to-emerald-900/20 rounded-lg border-2 border-dashed border-blue-300 dark:border-blue-700 p-8"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="text-5xl mb-3"
          >
            📤
          </motion.div>

          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">
            Upload Assets
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            Drag & drop files or click to browse
          </p>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-semibold transition-all disabled:opacity-60"
          >
            {uploading ? '⏳ Uploading...' : '+ Upload Files'}
          </motion.button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
            accept={allowedTypes.join(',')}
          />

          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-4">
            Max file size: {formatBytes(maxFileSize)}<br />
            Allowed: {allowedTypes.map(t => t.split('/')[1]).join(', ')}
          </p>
        </div>
      </motion.div>

      {/* Search & Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="flex flex-col sm:flex-row gap-4 items-start sm:items-center"
      >
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search assets..."
            className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
          <span className="absolute right-3 top-2.5 text-zinc-400 text-lg">🔍</span>
        </div>

        <div className="flex gap-2 flex-wrap">
          {(['all', 'image', 'document', 'video', 'other'] as const).map(type => (
            <motion.button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                filterType === type
                  ? 'bg-blue-600 dark:bg-blue-500 text-white'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </motion.button>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Asset Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          {filteredAssets.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 text-zinc-500 dark:text-zinc-400"
            >
              <p className="text-lg font-semibold mb-2">No assets found</p>
              <p>Upload your first asset to get started</p>
            </motion.div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-2 sm:grid-cols-3 gap-4"
            >
              {filteredAssets.map((asset, index) => (
                <motion.div
                  key={asset.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    setSelectedAsset(asset);
                    setAssetTags(asset.tags.join(', '));
                  }}
                  className={`relative group rounded-lg border-2 cursor-pointer transition-all overflow-hidden ${
                    selectedAsset?.id === asset.id
                      ? 'border-blue-500 dark:border-blue-400'
                      : 'border-zinc-200 dark:border-zinc-700 hover:border-blue-400 dark:hover:border-blue-500'
                  }`}
                >
                  {/* Thumbnail */}
                  {asset.type === 'image' && (
                    <img
                      src={asset.url}
                      alt={asset.name}
                      className="w-full aspect-square object-cover"
                    />
                  )}

                  {asset.type !== 'image' && (
                    <div className="w-full aspect-square bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700 flex items-center justify-center text-4xl">
                      {FILE_TYPE_ICONS[asset.type]}
                    </div>
                  )}

                  {/* Overlay */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2"
                  >
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={e => {
                        e.stopPropagation();
                        handleDeleteAsset(asset.id);
                      }}
                      className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                    >
                      🗑️
                    </motion.button>
                  </motion.div>

                  {/* Labels */}
                  <div className="absolute top-2 left-2 flex gap-1">
                    <span className="text-xs bg-zinc-900/80 text-white px-2 py-1 rounded">
                      {formatBytes(asset.size)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* Asset Details */}
        {selectedAsset && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="lg:col-span-1"
          >
            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 sticky top-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-3">
                  Asset Details
                </h3>

                {selectedAsset.type === 'image' && (
                  <img
                    src={selectedAsset.url}
                    alt={selectedAsset.name}
                    className="w-full aspect-square object-cover rounded-lg mb-4"
                  />
                )}

                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-semibold text-zinc-700 dark:text-zinc-300">Name</p>
                    <p className="text-zinc-600 dark:text-zinc-400 truncate">
                      {selectedAsset.name}
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold text-zinc-700 dark:text-zinc-300">Type</p>
                    <p className="text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                      <span>{FILE_TYPE_ICONS[selectedAsset.type]}</span>
                      {selectedAsset.type.charAt(0).toUpperCase() + selectedAsset.type.slice(1)}
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold text-zinc-700 dark:text-zinc-300">Size</p>
                    <p className="text-zinc-600 dark:text-zinc-400">
                      {formatBytes(selectedAsset.size)}
                    </p>
                  </div>

                  {selectedAsset.dimensions && (
                    <div>
                      <p className="font-semibold text-zinc-700 dark:text-zinc-300">Dimensions</p>
                      <p className="text-zinc-600 dark:text-zinc-400">
                        {selectedAsset.dimensions.width}x{selectedAsset.dimensions.height}px
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="font-semibold text-zinc-700 dark:text-zinc-300">Uploaded</p>
                    <p className="text-zinc-600 dark:text-zinc-400">
                      {new Date(selectedAsset.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  value={assetTags}
                  onChange={e => setAssetTags(e.target.value)}
                  placeholder="tag1, tag2, tag3"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSaveAssetTags}
                  className="w-full mt-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white rounded-lg text-sm font-semibold transition-all"
                >
                  Save Tags
                </motion.button>
              </div>

              {/* Variants */}
              {selectedAsset.type === 'image' && (
                <div>
                  <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                    Optimized Variants
                  </p>
                  <div className="space-y-2">
                    {FORMAT_OPTIONS.map(option => (
                      <motion.button
                        key={option.format}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-semibold transition-all"
                      >
                        {option.label}
                        {option.width !== 'auto' && ` (${option.width}×${option.height})`}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Copy URL */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigator.clipboard.writeText(selectedAsset.url)}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-all"
              >
                📋 Copy URL
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Statistics */}
      {assets.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{assets.length}</p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">Total Assets</p>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 text-center">
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {assets.filter(a => a.type === 'image').length}
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">Images</p>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatBytes(assets.reduce((sum, a) => sum + a.size, 0))}
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">Total Size</p>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 text-center">
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {Array.from(new Set(assets.flatMap(a => a.tags))).length}
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">Tags</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
