import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  compact?: boolean;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Enter text...',
  compact = false,
}: RichTextEditorProps) {
  const [isPreview, setIsPreview] = useState(false);
  const [caretPosition, setCaretPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertMarkdown = (before: string, after: string = '') => {
    if (!textareaRef.current) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selectedText = value.substring(start, end);
    const beforeText = value.substring(0, start);
    const afterText = value.substring(end);

    const newValue = `${beforeText}${before}${selectedText}${after}${afterText}`;
    onChange(newValue);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(
          start + before.length,
          start + before.length + selectedText.length,
        );
      }
    }, 0);
  };

  const markdownToHtml = (md: string) => {
    let html = md
      .replace(/^### (.*?)$/gm, '<h3 class="text-lg font-bold">$1</h3>')
      .replace(/^## (.*?)$/gm, '<h2 class="text-xl font-bold">$1</h2>')
      .replace(/^# (.*?)$/gm, '<h1 class="text-2xl font-bold">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 underline">$1</a>')
      .replace(/^- (.*?)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul class="list-disc list-inside">$1</ul>')
      .replace(/\n/g, '<br/>');

    return html;
  };

  const toolbar = [
    { label: 'H1', onClick: () => insertMarkdown('# '), title: 'Heading 1' },
    { label: 'H2', onClick: () => insertMarkdown('## '), title: 'Heading 2' },
    { label: 'H3', onClick: () => insertMarkdown('### '), title: 'Heading 3' },
    { label: 'B', onClick: () => insertMarkdown('**', '**'), title: 'Bold' },
    { label: 'I', onClick: () => insertMarkdown('*', '*'), title: 'Italic' },
    { label: 'Link', onClick: () => insertMarkdown('[', '](url)'), title: 'Link' },
    { label: 'List', onClick: () => insertMarkdown('- '), title: 'Bullet List' },
  ];

  return (
    <div className={`flex flex-col gap-2 ${compact ? 'max-h-96' : ''}`}>
      {/* Toolbar */}
      <div className="flex gap-1 p-2 bg-gray-100 rounded-lg border border-gray-200 flex-wrap">
        {toolbar.map((btn) => (
          <button
            key={btn.label}
            onClick={btn.onClick}
            title={btn.title}
            className="px-3 py-1 text-sm font-semibold bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            {btn.label}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={() => setIsPreview(!isPreview)}
          className={`px-3 py-1 text-sm font-semibold rounded transition-colors ${
            isPreview
              ? 'bg-blue-100 text-blue-700 border border-blue-300'
              : 'bg-white border border-gray-300 hover:bg-gray-50'
          }`}
        >
          {isPreview ? '✎ Edit' : '👁️ Preview'}
        </button>
      </div>

      {/* Editor / Preview */}
      {isPreview ? (
        <div className={`p-4 bg-gray-50 border border-gray-200 rounded-lg prose prose-sm max-w-none ${
          compact ? 'max-h-80 overflow-y-auto' : ''
        }`}>
          <div
            dangerouslySetInnerHTML={{
              __html: markdownToHtml(value) || '<p class="text-gray-400">No content</p>',
            }}
            className="text-gray-800"
          />
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full p-4 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
            compact ? 'max-h-80' : 'min-h-64'
          }`}
        />
      )}

      {/* Markdown hint */}
      <div className="text-xs text-gray-500">
        <details>
          <summary className="cursor-pointer font-semibold hover:text-gray-700">Markdown syntax</summary>
          <div className="mt-2 space-y-1 pl-2">
            <div>
              <code className="bg-gray-100 px-1 rounded"># Heading</code>
            </div>
            <div>
              <code className="bg-gray-100 px-1 rounded">**bold**</code>
              {' '}and{' '}
              <code className="bg-gray-100 px-1 rounded">*italic*</code>
            </div>
            <div>
              <code className="bg-gray-100 px-1 rounded">[link](url)</code>
            </div>
            <div>
              <code className="bg-gray-100 px-1 rounded">- bullet point</code>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}
