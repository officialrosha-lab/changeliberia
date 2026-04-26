'use client';

import { motion } from 'framer-motion';

const VIEWBOX_W = 500;
const VIEWBOX_H = 400;
const COLS = 28;
const ROWS = 22;
const DOT_R = 2.2;

const LIBERIA_PATH =
  'M 60,320 L 80,270 L 70,220 L 80,180 L 100,150 L 120,120 ' +
  'L 160,90 L 210,70 L 260,60 L 310,65 L 360,80 L 400,100 ' +
  'L 430,130 L 440,165 L 435,200 L 415,230 L 400,260 ' +
  'L 390,295 L 375,320 L 350,345 L 310,360 L 270,368 ' +
  'L 230,365 L 190,355 L 155,338 L 120,315 L 90,300 Z';

function buildDots(): { cx: number; cy: number }[] {
  const spacingX = VIEWBOX_W / COLS;
  const spacingY = VIEWBOX_H / ROWS;
  const dots: { cx: number; cy: number }[] = [];

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const cx = col * spacingX + spacingX / 2 + (row % 2 === 1 ? spacingX / 2 : 0);
      const cy = row * spacingY + spacingY / 2;
      if (cx < VIEWBOX_W && cy < VIEWBOX_H) {
        dots.push({ cx, cy });
      }
    }
  }

  // Sort diagonally NW→SE so the stagger wave sweeps across the map
  dots.sort((a, b) => a.cx + a.cy - (b.cx + b.cy));
  return dots;
}

const DOTS = buildDots();

export function LiberiaMapBg() {
  return (
    <svg
      viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none select-none text-zinc-400 dark:text-emerald-400"
    >
      <defs>
        <clipPath id="liberia-map-clip">
          <path d={LIBERIA_PATH} />
        </clipPath>
      </defs>

      <g clipPath="url(#liberia-map-clip)">
        {DOTS.map(({ cx, cy }, index) => (
          <motion.circle
            key={`${cx}-${cy}`}
            cx={cx}
            cy={cy}
            r={DOT_R}
            fill="currentColor"
            animate={{ opacity: [0.12, 0.9, 0.12] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatType: 'loop',
              ease: 'easeInOut',
              delay: index * 0.018,
              repeatDelay: 2,
            }}
          />
        ))}
      </g>
    </svg>
  );
}
