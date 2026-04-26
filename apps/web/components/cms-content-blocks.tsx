'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

/**
 * Reusable Content Blocks for CMS Page Builder
 * These blocks can be combined to create flexible campaign pages
 */

export interface ContentBlock {
  id: string;
  type: string;
  props: Record<string, any>;
}

interface HeroBlockProps {
  title: string;
  subtitle?: string;
  backgroundImage?: string;
  cta?: { label: string; href: string };
  align?: 'left' | 'center' | 'right';
}

export function HeroBlock({
  title,
  subtitle,
  backgroundImage,
  cta,
  align = 'center',
}: HeroBlockProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className={`relative w-full min-h-96 rounded-xl overflow-hidden ${
        backgroundImage ? 'bg-cover bg-center' : 'bg-gradient-to-r from-emerald-600 to-blue-600'
      }`}
      style={backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : {}}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div className={`relative h-full flex items-center justify-${align} px-6 md:px-12 py-16`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className={`max-w-2xl ${align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'}`}
        >
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">{title}</h1>
          {subtitle && <p className="text-lg md:text-xl text-white/90 mb-6">{subtitle}</p>}
          {cta && (
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href={cta.href}
              className="inline-block px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-all shadow-lg"
            >
              {cta.label}
            </motion.a>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

interface TextBlockProps {
  content: string;
  align?: 'left' | 'center' | 'right';
  size?: 'sm' | 'md' | 'lg';
}

export function TextBlock({ content, align = 'left', size = 'md' }: TextBlockProps) {
  const sizeClass =
    size === 'sm' ? 'text-base' : size === 'lg' ? 'text-xl' : 'text-lg';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true, margin: '-50px' }}
      className={`py-8 text-${align} max-w-3xl mx-auto`}
    >
      <p className={`${sizeClass} text-zinc-700 dark:text-zinc-300 leading-relaxed`}>
        {content}
      </p>
    </motion.div>
  );
}

interface ImageBlockProps {
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
  bordered?: boolean;
}

export function ImageBlock({
  src,
  alt,
  caption,
  width = 800,
  height = 400,
  bordered = false,
}: ImageBlockProps) {
  return (
    <motion.figure
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      className="my-8"
    >
      <div
        className={`rounded-lg overflow-hidden ${
          bordered ? 'border-2 border-zinc-300 dark:border-zinc-700' : ''
        }`}
      >
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          className="w-full h-auto object-cover"
        />
      </div>
      {caption && (
        <motion.figcaption
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-zinc-600 dark:text-zinc-400 mt-3 text-center italic"
        >
          {caption}
        </motion.figcaption>
      )}
    </motion.figure>
  );
}

interface GridBlockProps {
  items: Array<{ title: string; description: string; icon?: string }>;
  columns?: 2 | 3 | 4;
}

export function GridBlock({ items, columns = 3 }: GridBlockProps) {
  const colClass = `grid-cols-1 md:grid-cols-${columns === 2 ? '2' : columns === 4 ? '4' : '3'}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      className={`grid ${colClass} gap-6 my-8`}
    >
      {items.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          viewport={{ once: true }}
          className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 hover:shadow-lg transition-shadow"
        >
          {item.icon && <div className="text-4xl mb-3">{item.icon}</div>}
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            {item.title}
          </h3>
          <p className="text-zinc-600 dark:text-zinc-400">{item.description}</p>
        </motion.div>
      ))}
    </motion.div>
  );
}

interface CTABlockProps {
  title: string;
  description?: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  backgroundColor?: string;
}

export function CTABlock({
  title,
  description,
  primaryCta,
  secondaryCta,
  backgroundColor = 'bg-emerald-50 dark:bg-emerald-950/30',
}: CTABlockProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      className={`rounded-xl p-8 md:p-12 text-center my-8 border border-emerald-200 dark:border-emerald-900 ${backgroundColor}`}
    >
      <motion.h2
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-4"
      >
        {title}
      </motion.h2>
      {description && (
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="text-lg text-zinc-700 dark:text-zinc-300 mb-6 max-w-2xl mx-auto"
        >
          {description}
        </motion.p>
      )}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-center gap-4 flex-wrap"
      >
        <motion.a
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          href={primaryCta.href}
          className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white rounded-lg font-semibold transition-all shadow-lg"
        >
          {primaryCta.label}
        </motion.a>
        {secondaryCta && (
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href={secondaryCta.href}
            className="px-8 py-3 border-2 border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400 rounded-lg font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all"
          >
            {secondaryCta.label}
          </motion.a>
        )}
      </motion.div>
    </motion.div>
  );
}

interface TestimonialBlockProps {
  testimonials: Array<{
    quote: string;
    author: string;
    role?: string;
    avatar?: string;
  }>;
}

export function TestimonialBlock({ testimonials }: TestimonialBlockProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      className="space-y-6 my-8"
    >
      {testimonials.map((testimonial, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          viewport={{ once: true }}
          className="bg-emerald-50 dark:bg-emerald-950/20 border-l-4 border-emerald-600 dark:border-emerald-500 rounded-r-lg p-6"
        >
          <p className="text-zinc-700 dark:text-zinc-300 italic mb-4">"{testimonial.quote}"</p>
          <div className="flex items-center gap-3">
            {testimonial.avatar && (
              <img
                src={testimonial.avatar}
                alt={testimonial.author}
                className="w-10 h-10 rounded-full"
              />
            )}
            <div>
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                {testimonial.author}
              </p>
              {testimonial.role && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{testimonial.role}</p>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

interface DividerBlockProps {
  variant?: 'line' | 'space' | 'dots';
}

export function DividerBlock({ variant = 'line' }: DividerBlockProps) {
  if (variant === 'space') {
    return <div className="h-12" />;
  }

  if (variant === 'dots') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className="flex justify-center gap-2 py-8"
      >
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ delay: i * 0.1, duration: 1.5, repeat: Infinity }}
            className="w-2 h-2 rounded-full bg-emerald-600"
          />
        ))}
      </motion.div>
    );
  }

  return (
    <motion.hr
      initial={{ opacity: 0, scaleX: 0 }}
      whileInView={{ opacity: 1, scaleX: 1 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      className="border-0 border-t-2 border-zinc-300 dark:border-zinc-700 my-8"
    />
  );
}

interface BlockContainerProps {
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  backgroundColor?: string;
}

export function BlockContainer({
  children,
  maxWidth = 'xl',
  padding = 'md',
  backgroundColor,
}: BlockContainerProps) {
  const maxWidthClass = `max-w-${maxWidth}`;
  const paddingClass =
    padding === 'none' ? '' : padding === 'sm' ? 'px-4 py-6' : padding === 'lg' ? 'px-6 py-12' : 'px-6 py-8';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className={`${backgroundColor || ''} ${paddingClass} mx-auto ${maxWidthClass}`}
    >
      {children}
    </motion.div>
  );
}
