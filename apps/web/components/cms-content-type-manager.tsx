'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ContentField {
  id: string;
  name: string;
  fieldType: 'text' | 'number' | 'email' | 'url' | 'textarea' | 'richtext' | 'select' | 'checkbox' | 'image' | 'date' | 'datetime';
  label: string;
  description?: string;
  required: boolean;
  defaultValue?: string;
  helpText?: string;
  options?: Array<{ label: string; value: string }>; // For select fields
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    min?: number;
    max?: number;
  };
}

interface ContentTypeDefinition {
  id: string;
  name: string;
  slug: string;
  description: string;
  fields: ContentField[];
  grouping?: Array<{
    name: string;
    fieldIds: string[];
  }>;
}

interface CMSContentTypeManagerProps {
  contentTypes: ContentTypeDefinition[];
  onSaveContentType?: (contentType: ContentTypeDefinition) => Promise<void>;
  onDeleteContentType?: (contentTypeId: string) => Promise<void>;
  isLoading?: boolean;
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text', icon: '📝' },
  { value: 'number', label: 'Number', icon: '🔢' },
  { value: 'email', label: 'Email', icon: '📧' },
  { value: 'url', label: 'URL', icon: '🔗' },
  { value: 'textarea', label: 'Textarea', icon: '📄' },
  { value: 'richtext', label: 'Rich Text', icon: '✨' },
  { value: 'select', label: 'Dropdown', icon: '▼' },
  { value: 'checkbox', label: 'Checkbox', icon: '☑️' },
  { value: 'image', label: 'Image', icon: '🖼️' },
  { value: 'date', label: 'Date', icon: '📅' },
  { value: 'datetime', label: 'Date & Time', icon: '⏰' },
];

export function CMSContentTypeManager({
  contentTypes,
  onSaveContentType,
  onDeleteContentType,
}: CMSContentTypeManagerProps) {
  const [selectedType, setSelectedType] = useState<ContentTypeDefinition | null>(
    contentTypes[0] || null
  );
  const [editingField, setEditingField] = useState<ContentField | null>(null);
  const [showFieldForm, setShowFieldForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleAddField = () => {
    setEditingField({
      id: `field-${Date.now()}`,
      name: '',
      fieldType: 'text',
      label: '',
      required: false,
    });
    setShowFieldForm(true);
  };

  const handleSaveField = (field: ContentField) => {
    if (!selectedType) return;

    const updatedType = {
      ...selectedType,
      fields: editingField
        ? selectedType.fields.map(f => (f.id === editingField.id ? field : f))
        : [...selectedType.fields, field],
    };

    setSelectedType(updatedType);
    setEditingField(null);
    setShowFieldForm(false);
  };

  const handleRemoveField = (fieldId: string) => {
    if (!selectedType) return;

    setSelectedType({
      ...selectedType,
      fields: selectedType.fields.filter(f => f.id !== fieldId),
    });
  };

  const handleSaveContentType = async () => {
    if (!selectedType) return;

    setSaving(true);
    try {
      await onSaveContentType?.(selectedType);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteContentType = async (typeId: string) => {
    await onDeleteContentType?.(typeId);
    setShowDeleteConfirm(null);
    if (selectedType?.id === typeId) {
      setSelectedType(contentTypes.find(t => t.id !== typeId) || null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6"
    >
      {/* Content Types List */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="lg:col-span-1"
      >
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">
            Content Types
          </h2>

          <div className="space-y-2">
            {contentTypes.map((type, index) => (
              <motion.button
                key={type.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedType(type)}
                className={`w-full text-left px-4 py-2 rounded-lg transition-all font-semibold ${
                  selectedType?.id === type.id
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <div className="truncate text-sm">{type.name}</div>
                <div className="text-xs text-zinc-500 mt-1">
                  {type.fields.length} field{type.fields.length !== 1 ? 's' : ''}
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Field Editor */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="lg:col-span-2"
      >
        {selectedType && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                {selectedType.name}
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                {selectedType.description || 'No description'}
              </p>

              <div className="flex gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSaveContentType}
                  disabled={saving}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white rounded-lg font-semibold transition-all disabled:opacity-60"
                >
                  {saving ? '💾 Saving...' : '💾 Save Changes'}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowDeleteConfirm(selectedType.id)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white rounded-lg font-semibold transition-all"
                >
                  🗑️ Delete Type
                </motion.button>
              </div>
            </div>

            {/* Fields Editor */}
            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  Fields ({selectedType.fields.length})
                </h3>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAddField}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-all"
                >
                  + Add Field
                </motion.button>
              </div>

              <div className="space-y-3">
                {selectedType.fields.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8 text-zinc-500 dark:text-zinc-400"
                  >
                    <p className="text-sm">No fields defined yet</p>
                  </motion.div>
                ) : (
                  selectedType.fields.map((field, index) => (
                    <motion.div
                      key={field.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 flex items-center justify-between hover:shadow-sm transition-shadow"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {FIELD_TYPES.find(t => t.value === field.fieldType)?.icon}
                          </span>
                          <div>
                            <h4 className="font-bold text-zinc-900 dark:text-zinc-100">
                              {field.label}
                            </h4>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400">
                              {field.name} • {field.fieldType}
                              {field.required && <span className="text-red-600 ml-1">*</span>}
                            </p>
                          </div>
                        </div>
                        {field.description && (
                          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                            {field.description}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setEditingField(field);
                            setShowFieldForm(true);
                          }}
                          className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-sm font-semibold hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all"
                        >
                          Edit
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleRemoveField(field.id)}
                          className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded text-sm font-semibold hover:bg-red-200 dark:hover:bg-red-900/50 transition-all"
                        >
                          Delete
                        </motion.button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* Field Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 text-center"
              >
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {selectedType.fields.length}
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">Total Fields</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 text-center"
              >
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {selectedType.fields.filter(f => f.required).length}
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">Required</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 text-center"
              >
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {FIELD_TYPES.reduce((acc, ft) => acc + selectedType.fields.filter(f => f.fieldType === ft.value).length, 0)}
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">Field Types</p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Field Form Modal */}
      {showFieldForm && (
        <FieldFormModal
          field={editingField}
          onSave={handleSaveField}
          onCancel={() => {
            setShowFieldForm(false);
            setEditingField(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center z-50 bg-black/50"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-zinc-900 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800 max-w-sm"
          >
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              Delete Content Type?
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
              This action cannot be undone. All pages using this content type will need to be updated.
            </p>

            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border-2 border-zinc-300 dark:border-zinc-700 rounded-lg font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleDeleteContentType(showDeleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white rounded-lg font-semibold transition-all"
              >
                Delete
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}

// Field Form Modal Component
function FieldFormModal({
  field,
  onSave,
  onCancel,
}: {
  field: ContentField | null;
  onSave: (field: ContentField) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<ContentField>(
    field || {
      id: `field-${Date.now()}`,
      name: '',
      fieldType: 'text',
      label: '',
      required: false,
    }
  );

  const [selectOptions, setSelectOptions] = useState<Array<{ label: string; value: string }>>(
    field?.fieldType === 'select' ? field.options || [] : []
  );

  const handleAddOption = () => {
    setSelectOptions([...selectOptions, { label: '', value: '' }]);
  };

  const handleRemoveOption = (index: number) => {
    setSelectOptions(selectOptions.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.label.trim()) return;

    const updatedField = {
      ...formData,
      options: formData.fieldType === 'select' ? selectOptions : undefined,
    };

    onSave(updatedField);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-xl shadow-2xl p-6 border border-zinc-200 dark:border-zinc-800 max-h-96 overflow-y-auto"
      >
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
          {field ? 'Edit Field' : 'New Field'}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Field Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., author_name"
              className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Field Label *
            </label>
            <input
              type="text"
              value={formData.label}
              onChange={e => setFormData({ ...formData, label: e.target.value })}
              placeholder="e.g., Author Name"
              className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Field Type *
            </label>
            <select
              value={formData.fieldType}
              onChange={e =>
                setFormData({
                  ...formData,
                  fieldType: e.target.value as ContentField['fieldType'],
                })
              }
              className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm"
            >
              {FIELD_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.required}
              onChange={e => setFormData({ ...formData, required: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Required field
            </span>
          </label>

          {formData.fieldType === 'select' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  Options
                </label>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={handleAddOption}
                  className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded"
                >
                  + Add
                </motion.button>
              </div>

              {selectOptions.map((option, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={option.label}
                    onChange={e =>
                      setSelectOptions(
                        selectOptions.map((o, i) =>
                          i === index ? { ...o, label: e.target.value } : o
                        )
                      )
                    }
                    placeholder="Label"
                    className="flex-1 px-2 py-1 text-sm rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                  <input
                    type="text"
                    value={option.value}
                    onChange={e =>
                      setSelectOptions(
                        selectOptions.map((o, i) =>
                          i === index ? { ...o, value: e.target.value } : o
                        )
                      )
                    }
                    placeholder="Value"
                    className="flex-1 px-2 py-1 text-sm rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    onClick={() => handleRemoveOption(index)}
                    className="px-2 py-1 text-red-600 dark:text-red-400"
                  >
                    ✕
                  </motion.button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={onCancel}
            className="flex-1 px-4 py-2 border-2 border-zinc-300 dark:border-zinc-700 rounded-lg font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={handleSave}
            disabled={!formData.name.trim() || !formData.label.trim()}
            className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white rounded-lg font-semibold transition-all disabled:opacity-60"
          >
            Save Field
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
