'use client';

import { useRef } from 'react';

function resizeToBase64(file: File, maxW = 320, maxH = 213): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxW / img.width, maxH / img.height);
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.72));
    };
    img.src = url;
  });
}

interface PollOptionInputProps {
  index: number;
  text: string;
  imageUrl?: string;
  onTextChange: (index: number, value: string) => void;
  onImageChange: (index: number, base64: string | undefined) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

export function PollOptionInput({
  index,
  text,
  imageUrl,
  onTextChange,
  onImageChange,
  onRemove,
  canRemove,
}: PollOptionInputProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await resizeToBase64(file);
    onImageChange(index, base64);
    e.target.value = '';
  }

  return (
    <div className="flex items-center gap-2">
      {/* Thumbnail / image picker */}
      <div className="relative flex-shrink-0">
        {imageUrl ? (
          <button
            type="button"
            title="Click to remove image"
            onClick={() => onImageChange(index, undefined)}
            className="group relative h-12 w-12 overflow-hidden rounded-xl border border-zinc-200 dark:border-neutral-700"
          >
            <img src={imageUrl} alt="" className="h-full w-full object-cover" />
            <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </span>
          </button>
        ) : (
          <button
            type="button"
            title="Add image to this option"
            onClick={() => fileRef.current?.click()}
            className="flex h-12 w-12 items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 text-zinc-400 transition hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-600 dark:border-neutral-600 dark:bg-neutral-800 dark:hover:border-emerald-500 dark:hover:text-emerald-400"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
            </svg>
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
      </div>

      {/* Text input */}
      <input
        type="text"
        value={text}
        onChange={(e) => onTextChange(index, e.target.value)}
        placeholder={`Option ${index + 1}`}
        className="flex-1 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500 dark:focus:ring-emerald-800"
      />

      {/* Remove button */}
      {canRemove && (
        <button
          type="button"
          onClick={() => onRemove(index)}
          title="Remove option"
          className="flex-shrink-0 rounded-xl p-2 text-zinc-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
