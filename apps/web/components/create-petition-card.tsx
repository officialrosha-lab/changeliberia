'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AnimatedPlaceholderInput } from './animated-placeholder-input';

export function CreatePetitionCard() {
  const [title, setTitle] = useState('');
  const [touched, setTouched] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      router.push(`/create?title=${encodeURIComponent(title.trim())}`);
    }
  };

  const hasTitle = title.trim().length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, type: 'spring', stiffness: 320, damping: 28 }}
      className="w-full max-w-lg mx-auto px-4 sm:px-0"
    >
      <div className="rounded-2xl bg-white shadow-2xl shadow-emerald-900/40 p-6 sm:p-8 border border-white/20">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <h2 className="text-2xl font-extrabold text-zinc-900">
              What change does Liberia need?
            </h2>
            <p className="text-sm text-zinc-500">
              Start by sharing the issue you care about. We'll guide you through the rest.
            </p>
          </div>

          <AnimatedPlaceholderInput
            variant="card"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => setTouched(true)}
            touched={touched}
            maxLength={120}
            showCharCount
            required
          />

          <motion.button
            type="submit"
            disabled={!hasTitle}
            whileHover={{ scale: hasTitle ? 1.02 : 1 }}
            whileTap={{ scale: hasTitle ? 0.97 : 1 }}
            className={`w-full rounded-xl px-6 py-4 text-base font-bold shadow-sm transition-all ${
              hasTitle
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-zinc-900 shadow-amber-200 hover:from-amber-300 hover:to-amber-400 hover:shadow-md active:scale-95'
                : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
            }`}
          >
            {hasTitle ? 'Create petition →' : 'Create petition'}
          </motion.button>

          <p className="text-xs text-zinc-400 text-center leading-relaxed">
            Your petition will be reviewed before going live. It&apos;s free and takes less than 5 minutes.
          </p>
        </form>
      </div>
    </motion.div>
  );
}
