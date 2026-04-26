'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { TrendingUp, ArrowRight } from 'lucide-react';

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

interface PetitionListItemProps {
  petition: Petition;
}

export function PetitionListItem({ petition }: PetitionListItemProps) {
  const percentToGoal = Math.min(Math.round((petition.signaturesCount / petition.goal) * 100), 100);
  const isNearGoal = percentToGoal >= 75;

  return (
    <Link href={`/petitions/${petition.id}`}>
      <div className="group flex gap-4 p-4 rounded-lg border border-zinc-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-zinc-300 dark:hover:border-neutral-600 hover:shadow-md transition-all duration-200">
        {/* Image */}
        <div className="relative h-24 w-24 md:h-28 md:w-28 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-emerald-400 to-emerald-600">
          {petition.imageUrl ? (
            <img
              src={petition.imageUrl}
              alt={petition.title}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white text-3xl opacity-30">
              📋
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          {/* Top section */}
          <div>
            {/* Title and category */}
            <div className="flex items-start gap-2 mb-1">
              <h3 className="font-bold text-sm md:text-base text-zinc-900 dark:text-white line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                {petition.title}
              </h3>
            </div>

            {/* Summary */}
            <p className="text-xs md:text-sm text-zinc-600 dark:text-neutral-400 line-clamp-1 mb-2">
              {petition.summary}
            </p>

            {/* Creator and category */}
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <div className="flex items-center gap-1">
                {petition.creator.avatarUrl ? (
                  <Image
                    src={petition.creator.avatarUrl}
                    alt={petition.creator.fullName}
                    width={16}
                    height={16}
                    className="h-4 w-4 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-4 w-4 rounded-full bg-zinc-300 dark:bg-neutral-700 flex items-center justify-center text-xs font-bold text-zinc-700 dark:text-neutral-300">
                    {petition.creator.fullName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-xs text-zinc-500 dark:text-neutral-400">
                  {petition.creator.fullName}
                </span>
              </div>

              {petition.category && (
                <span className="text-xs bg-zinc-100 dark:bg-neutral-800 text-zinc-700 dark:text-neutral-300 px-2 py-0.5 rounded-full">
                  {petition.category.replace('-', ' ')}
                </span>
              )}
            </div>
          </div>

          {/* Bottom section - Progress and stats */}
          <div className="space-y-2">
            {/* Progress bar */}
            <div className="w-full h-1.5 bg-zinc-200 dark:bg-neutral-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isNearGoal ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                }`}
                style={{ width: `${percentToGoal}%` }}
              />
            </div>

            {/* Stats row */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-900 dark:text-white">
                  {petition.signaturesCount.toLocaleString()}
                </span>
                <span className="text-xs text-zinc-500 dark:text-neutral-400">
                  / {petition.goal.toLocaleString()}
                </span>

                {petition.todaySignatures > 0 && (
                  <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    <TrendingUp className="h-3 w-3" />
                    +{petition.todaySignatures}
                  </div>
                )}
              </div>

              {isNearGoal && (
                <span className="text-xs bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-semibold">
                  {percentToGoal}% to goal
                </span>
              )}

              <ArrowRight className="h-4 w-4 text-zinc-400 dark:text-neutral-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition flex-shrink-0" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
