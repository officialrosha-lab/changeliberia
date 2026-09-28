'use client';

import { RichTextEditor } from './rich-text-editor';
import { ImageUploader, UploadedFile } from './image-uploader';
import { useState } from 'react';

type BlockType = 'hero' | 'text' | 'image' | 'grid' | 'cta' | 'testimonial' | 'divider' | 'faq' | 'features';

type BlockItem = Record<string, string>;

function propStr(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function propNum(value: unknown, fallback: number): number {
  return typeof value === 'number' ? value : fallback;
}

function propItems(value: unknown): BlockItem[] {
  return Array.isArray(value) ? (value as BlockItem[]) : [];
}

interface AdvancedBlockPropsEditorProps {
  type: BlockType;
  props: Record<string, unknown>;
  onChange: (props: Record<string, unknown>) => void;
}

export function AdvancedBlockPropsEditor({
  type,
  props,
  onChange,
}: AdvancedBlockPropsEditorProps) {
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [selectedImageField, setSelectedImageField] = useState<string | null>(null);

  const updateProp = (key: string, value: unknown) => {
    onChange({ ...props, [key]: value });
  };

  const handleImageSelect = (file: UploadedFile) => {
    if (selectedImageField) {
      updateProp(selectedImageField, file.url);
      setShowImageUpload(false);
      setSelectedImageField(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Image Upload Modal */}
      {showImageUpload && selectedImageField && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Upload Image</h3>
              <button
                onClick={() => {
                  setShowImageUpload(false);
                  setSelectedImageField(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <ImageUploader onFileSelected={handleImageSelect} />
          </div>
        </div>
      )}

      {type === 'hero' && (
        <>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
            <input
              type="text"
              placeholder="Main title"
              value={propStr(props.title)}
              onChange={(e) => updateProp('title', e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Subtitle (optional)</label>
            <input
              type="text"
              placeholder="Subtitle"
              value={propStr(props.subtitle)}
              onChange={(e) => updateProp('subtitle', e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
            <RichTextEditor
              value={propStr(props.description)}
              onChange={(val) => updateProp('description', val)}
              placeholder="Enter description with markdown support"
              compact
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Background Image (optional)</label>
            <div className="flex gap-2 items-end">
              <input
                type="text"
                placeholder="Image URL"
                value={propStr(props.bgImage)}
                onChange={(e) => updateProp('bgImage', e.target.value)}
                className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => {
                  setSelectedImageField('bgImage');
                  setShowImageUpload(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded font-semibold text-sm hover:bg-blue-700 transition-colors"
              >
                Upload
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">CTA Text (optional)</label>
              <input
                type="text"
                placeholder="e.g., Get Started"
                value={propStr(props.ctaText)}
                onChange={(e) => updateProp('ctaText', e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">CTA URL (optional)</label>
              <input
                type="url"
                placeholder="https://..."
                value={propStr(props.ctaUrl)}
                onChange={(e) => updateProp('ctaUrl', e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </>
      )}

      {type === 'text' && (
        <>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Title (optional)</label>
            <input
              type="text"
              placeholder="Section title"
              value={propStr(props.title)}
              onChange={(e) => updateProp('title', e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Body Text</label>
            <RichTextEditor
              value={propStr(props.body)}
              onChange={(val) => updateProp('body', val)}
              placeholder="Enter body text with markdown support"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Alignment</label>
            <select
              value={propStr(props.alignment, 'left')}
              onChange={(e) => updateProp('alignment', e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="left">Left aligned</option>
              <option value="center">Centered</option>
              <option value="right">Right aligned</option>
            </select>
          </div>
        </>
      )}

      {type === 'image' && (
        <>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Image</label>
            <div className="flex gap-2 items-end">
              <input
                type="text"
                placeholder="Image URL or upload"
                value={propStr(props.url)}
                onChange={(e) => updateProp('url', e.target.value)}
                className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => {
                  setSelectedImageField('url');
                  setShowImageUpload(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded font-semibold text-sm hover:bg-blue-700 transition-colors"
              >
                Upload
              </button>
            </div>
          </div>

          {propStr(props.url) && (
            <img
              src={propStr(props.url)}
              alt="preview"
              className="w-full h-32 object-cover rounded border border-gray-200"
            />
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Alt Text</label>
            <input
              type="text"
              placeholder="For accessibility"
              value={propStr(props.alt)}
              onChange={(e) => updateProp('alt', e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Caption (optional)</label>
            <textarea
              placeholder="Image caption"
              value={propStr(props.caption)}
              onChange={(e) => updateProp('caption', e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Size</label>
            <select
              value={propStr(props.size, 'full')}
              onChange={(e) => updateProp('size', e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="small">Small (50%)</option>
              <option value="medium">Medium (66%)</option>
              <option value="full">Full width</option>
            </select>
          </div>
        </>
      )}

      {type === 'cta' && (
        <>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Heading</label>
            <input
              type="text"
              placeholder="Call to action heading"
              value={propStr(props.heading)}
              onChange={(e) => updateProp('heading', e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
            <RichTextEditor
              value={propStr(props.description)}
              onChange={(val) => updateProp('description', val)}
              placeholder="CTA description"
              compact
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Button Text</label>
              <input
                type="text"
                placeholder="e.g., Sign Up"
                value={propStr(props.primaryText)}
                onChange={(e) => updateProp('primaryText', e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Button URL</label>
              <input
                type="url"
                placeholder="https://..."
                value={propStr(props.primaryUrl)}
                onChange={(e) => updateProp('primaryUrl', e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Button Color</label>
            <select
              value={propStr(props.buttonColor, 'blue')}
              onChange={(e) => updateProp('buttonColor', e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="blue">Blue</option>
              <option value="green">Green</option>
              <option value="red">Red</option>
              <option value="purple">Purple</option>
            </select>
          </div>
        </>
      )}

      {type === 'testimonial' && (
        <>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Quote</label>
            <RichTextEditor
              value={propStr(props.quote)}
              onChange={(val) => updateProp('quote', val)}
              placeholder="Testimonial quote"
              compact
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Author Name</label>
              <input
                type="text"
                placeholder="Full name"
                value={propStr(props.author)}
                onChange={(e) => updateProp('author', e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Role/Title</label>
              <input
                type="text"
                placeholder="e.g., CEO at Company"
                value={propStr(props.role)}
                onChange={(e) => updateProp('role', e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Avatar Image (optional)</label>
            <div className="flex gap-2 items-end">
              <input
                type="text"
                placeholder="Avatar URL"
                value={propStr(props.avatar)}
                onChange={(e) => updateProp('avatar', e.target.value)}
                className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => {
                  setSelectedImageField('avatar');
                  setShowImageUpload(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded font-semibold text-sm hover:bg-blue-700 transition-colors"
              >
                Upload
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Rating</label>
            <select
              value={propNum(props.rating, 5)}
              onChange={(e) => updateProp('rating', parseInt(e.target.value))}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={5}>⭐ 5 stars</option>
              <option value={4}>⭐ 4 stars</option>
              <option value={3}>⭐ 3 stars</option>
              <option value={2}>⭐ 2 stars</option>
              <option value={1}>⭐ 1 star</option>
            </select>
          </div>
        </>
      )}

      {type === 'faq' && (
        <>
          <div className="space-y-3">
            {propItems(props.items).map((item, idx) => (
              <div key={idx} className="space-y-2 rounded border border-gray-300 bg-gray-50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-600">Item {idx + 1}</span>
                  <button
                    onClick={() => {
                      const newItems = propItems(props.items).filter((_, i) => i !== idx);
                      updateProp('items', newItems);
                    }}
                    className="text-xs text-red-600 hover:text-red-700 font-semibold"
                  >
                    Remove
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Question"
                  value={item.question || ''}
                  onChange={(e) => {
                    const newItems = [...propItems(props.items)];
                    newItems[idx] = { ...item, question: e.target.value };
                    updateProp('items', newItems);
                  }}
                  className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <textarea
                  placeholder="Answer"
                  value={item.answer || ''}
                  onChange={(e) => {
                    const newItems = [...propItems(props.items)];
                    newItems[idx] = { ...item, answer: e.target.value };
                    updateProp('items', newItems);
                  }}
                  className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={2}
                />
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              updateProp('items', [...propItems(props.items), { question: '', answer: '' }]);
            }}
            className="w-full rounded border-2 border-dashed border-gray-400 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            + Add Item
          </button>
        </>
      )}

      {type === 'grid' && (
        <>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Columns</label>
            <select
              value={propNum(props.columns, 3)}
              onChange={(e) => updateProp('columns', parseInt(e.target.value))}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={2}>2 columns</option>
              <option value={3}>3 columns</option>
              <option value={4}>4 columns</option>
            </select>
          </div>
          <div className="space-y-3">
            {propItems(props.items).map((item, idx) => (
              <div key={idx} className="space-y-2 rounded border border-gray-300 bg-gray-50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-600">Item {idx + 1}</span>
                  <button
                    onClick={() => {
                      const newItems = propItems(props.items).filter((_, i) => i !== idx);
                      updateProp('items', newItems);
                    }}
                    className="text-xs text-red-600 hover:text-red-700 font-semibold"
                  >
                    Remove
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Title"
                  value={item.title || ''}
                  onChange={(e) => {
                    const newItems = [...propItems(props.items)];
                    newItems[idx] = { ...item, title: e.target.value };
                    updateProp('items', newItems);
                  }}
                  className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <textarea
                  placeholder="Description"
                  value={item.description || ''}
                  onChange={(e) => {
                    const newItems = [...propItems(props.items)];
                    newItems[idx] = { ...item, description: e.target.value };
                    updateProp('items', newItems);
                  }}
                  className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={2}
                />
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              updateProp('items', [...propItems(props.items), { title: '', description: '' }]);
            }}
            className="w-full rounded border-2 border-dashed border-gray-400 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            + Add Item
          </button>
        </>
      )}

      {type === 'features' && (
        <>
          <div className="space-y-3">
            {propItems(props.items).map((item, idx) => (
              <div key={idx} className="space-y-2 rounded border border-gray-300 bg-gray-50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-600">Feature {idx + 1}</span>
                  <button
                    onClick={() => {
                      const newItems = propItems(props.items).filter((_, i) => i !== idx);
                      updateProp('items', newItems);
                    }}
                    className="text-xs text-red-600 hover:text-red-700 font-semibold"
                  >
                    Remove
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Feature title"
                  value={item.title || ''}
                  onChange={(e) => {
                    const newItems = [...propItems(props.items)];
                    newItems[idx] = { ...item, title: e.target.value };
                    updateProp('items', newItems);
                  }}
                  className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <textarea
                  placeholder="Description"
                  value={item.description || ''}
                  onChange={(e) => {
                    const newItems = [...propItems(props.items)];
                    newItems[idx] = { ...item, description: e.target.value };
                    updateProp('items', newItems);
                  }}
                  className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={2}
                />
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              updateProp('items', [...propItems(props.items), { title: '', description: '' }]);
            }}
            className="w-full rounded border-2 border-dashed border-gray-400 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            + Add Feature
          </button>
        </>
      )}

      {type === 'divider' && (
        <>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Style</label>
            <select
              value={propStr(props.style, 'solid')}
              onChange={(e) => updateProp('style', e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="solid">Solid line</option>
              <option value="dashed">Dashed line</option>
              <option value="dotted">Dotted line</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Spacing</label>
            <select
              value={propStr(props.size, 'md')}
              onChange={(e) => updateProp('size', e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
            </select>
          </div>
        </>
      )}
    </div>
  );
}
