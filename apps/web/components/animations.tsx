'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

export interface AnimationProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

/**
 * Fade in animation from 0 to 1 opacity
 */
export function FadeIn({
  children,
  delay = 0,
  duration = 0.6,
  className,
}: AnimationProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Slide in from bottom animation
 */
export function SlideInUp({
  children,
  delay = 0,
  duration = 0.6,
  className,
}: AnimationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Slide in from left animation
 */
export function SlideInLeft({
  children,
  delay = 0,
  duration = 0.6,
  className,
}: AnimationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Slide in from right animation
 */
export function SlideInRight({
  children,
  delay = 0,
  duration = 0.6,
  className,
}: AnimationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Scale in animation from 0.9 to 1
 */
export function ScaleIn({
  children,
  delay = 0,
  duration = 0.5,
  className,
}: AnimationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Staggered container for animating multiple children with delays
 */
export function StaggerContainer({
  children,
  delay = 0,
  staggerDelay = 0.1,
  className,
}: {
  children: ReactNode;
  delay?: number;
  staggerDelay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            delayChildren: delay,
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Staggered item for use within StaggerContainer
 */
export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { ease: 'easeOut', duration: 0.5 },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Hover scale effect for interactive elements
 */
export function HoverScale({
  children,
  scale = 1.05,
  className,
}: {
  children: ReactNode;
  scale?: number;
  className?: string;
}) {
  return (
    <motion.div
      whileHover={{ scale }}
      whileTap={{ scale: scale - 0.05 }}
      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Bounce animation on elements (e.g., signature badges)
 */
export function BounceIn({
  children,
  delay = 0,
  className,
}: Omit<AnimationProps, 'duration'>) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.3 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        delay,
        type: 'spring',
        stiffness: 260,
        damping: 20,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
