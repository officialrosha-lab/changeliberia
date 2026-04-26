'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { TrendingUp } from 'lucide-react';

type Petition = {
  id: string;
  title: string;
  summary: string;
  imageUrl?: string | null;
  signaturesCount: number;
  todaySignatures: number;
  goal: number;
  category?: string | null;
  creator: {
    id: string;
    fullName: string;
    avatarUrl?: string;
  };
};

interface PetitionGridCardProps {
  petition: Petition;
}

export function PetitionGridCard({ petition }: PetitionGridCardProps) {
  const percentToGoal = Math.min(Math.round((petition.signaturesCount / petition.goal) * 100), 100);

  return (
    <Link href={`/petitions/${petition.id}`}>
      <div className="group flex flex-col rounded-xl overflow-hidden border border-zinc-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-zinc-300 dark:hover:border-neutral-600 hover:shadow-md transition-all duration-200 h-full">
        {/* Image */}
        <div className="relative h-40 bg-gradient-to-br from-emerald-400 to-emerald-600 overflow-hidden">
          {petition.imageUrl ? (
            <img
              src={petition.imageUrl}
              alt={petition.title}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white text-4xl opacity-30">
              📋
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          {/* Category badge */}
          {petition.category && (
            <div className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-zinc-800 backdrop-blur-sm dark:bg-neutral-900/90 dark:text-neutral-100">
              {petition.category.replace('-', ' ')}
            </div>
          )}

          {/* Momentum badge */}
          {petition.todaySignatures > 0 && (
            <div className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-1 text-xs font-semibold text-white">
              <TrendingUp className="h-3 w-3" />
              +{petition.todaySignatures}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          {/* Title */}
          <h3 className="font-bold text-sm md:text-base text-zinc-900 dark:text-white line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition mb-2">
            {petition.title}
          </h3>

          {/* Summary */}
          <p className="text-xs text-zinc-600 dark:text-neutral-400 line-clamp-2 mb-3 flex-1">
            {petition.summary}
          </p>

          {/* Creator */}
          <div className="flex items-center gap-2 mb-3">
            {petition.creator.avatarUrl ? (
              <Image
                src={petition.creator.avatarUrl}
                alt={petition.creator.fullName}
                width={24}
                height={24}
                className="h-6 w-6 rounded-full object-cover"
              />
            ) : (
              <div className="h-6 w-6 rounded-full bg-zinc-300 dark:bg-neutral-700 flex items-center justify-center text-xs font-bold text-zinc-700 dark:text-neutral-300">
                {petition.creator.fullName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-xs text-zinc-600 dark:text-neutral-400 truncate">
              {petition.creator.fullName}
            </span>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="w-full h-2 bg-zinc-200 dark:bg-neutral-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-300"
                style={{ width: `${percentToGoal}%` }}
              />
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-zinc-900 dark:text-white">
                {petition.signaturesCount.toLocaleString()}
              </span>
              <span className="text-zinc-500 dark:text-neutral-400">
                {percentToGoal}% of {petition.goal.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
