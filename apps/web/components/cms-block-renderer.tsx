'use client';

import { CMSBlock } from '../lib/cms';
import { useEffect } from 'react';
import Link from 'next/link';
import { apiPost } from '../lib/api';

interface CMSBlockRendererProps {
  block: CMSBlock;
  pageId?: string;
}

/**
 * Track block view in analytics
 */
async function trackBlockView(pageId: string, blockId: string, blockType: string) {
  try {
    await apiPost(`/api/v1/cms/blocks/${blockId}/track-view`, {
      pageId,
      blockType,
    });
  } catch (error) {
    // Silently fail - don't interrupt user experience
    console.debug('Analytics tracking failed:', error);
  }
}

/**
 * Track block click in analytics
 */
async function trackBlockClick(pageId: string, blockId: string, blockType: string) {
  try {
    await apiPost(`/api/v1/cms/blocks/${blockId}/track-click`, {
      pageId,
      blockType,
    });
  } catch (error) {
    // Silently fail - don't interrupt user experience
    console.debug('Analytics tracking failed:', error);
  }
}

export function CMSBlockRenderer({ block, pageId }: CMSBlockRendererProps) {
  const { id, type, props } = block;

  // Track view on mount
  useEffect(() => {
    if (pageId && id) {
      trackBlockView(pageId, id, type);
    }
  }, [pageId, id, type]);

  switch (type) {
    case 'hero':
      return <HeroBlock {...(props as HeroBlockProps)} blockId={id} pageId={pageId} />;
    case 'text':
      return <TextBlock {...(props as TextBlockProps)} blockId={id} pageId={pageId} />;
    case 'image':
      return <ImageBlock {...(props as ImageBlockProps)} blockId={id} pageId={pageId} />;
    case 'grid':
      return <GridBlock {...(props as GridBlockProps)} blockId={id} pageId={pageId} />;
    case 'cta':
      return <CTABlock {...(props as CTABlockProps)} blockId={id} pageId={pageId} />;
    case 'testimonial':
      return <TestimonialBlock {...(props as TestimonialBlockProps)} blockId={id} pageId={pageId} />;
    case 'divider':
      return <DividerBlock {...(props as DividerBlockProps)} blockId={id} pageId={pageId} />;
    case 'faq':
      return <FAQBlock {...(props as FAQBlockProps)} blockId={id} pageId={pageId} />;
    case 'features':
      return <FeaturesBlock {...(props as FeaturesBlockProps)} blockId={id} pageId={pageId} />;
    default:
      return null;
  }
}

interface HeroBlockProps {
  title: string;
  subtitle?: string;
  description?: string;
  backgroundImage?: string;
  ctaText?: string;
  ctaUrl?: string;
  blockId?: string;
  pageId?: string;
}

function HeroBlock({ title, subtitle, description, backgroundImage, ctaText, ctaUrl, blockId, pageId }: HeroBlockProps) {
  const handleCTAClick = async () => {
    if (pageId && blockId) {
      await trackBlockClick(pageId, blockId, 'hero');
    }
  };

  return (
    <section
      className="relative border-b border-zinc-200 bg-gradient-to-br from-emerald-50 to-white px-4 py-16 dark:border-neutral-800 dark:from-emerald-950/20 dark:to-neutral-900 sm:py-20 md:py-24"
      style={backgroundImage ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
    >
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60" />
      <div className="relative mx-auto max-w-4xl">
        <div className="text-center">
          {subtitle && (
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              {subtitle}
            </p>
          )}
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl md:text-6xl">
            {title}
          </h1>
          {description && (
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-neutral-300">
              {description}
            </p>
          )}
          {ctaText && ctaUrl && (
            <div className="mt-8">
              <Link
                href={ctaUrl}
                onClick={handleCTAClick}
                className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-8 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md active:scale-95 dark:bg-emerald-500 dark:hover:bg-emerald-400"
              >
                {ctaText}
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

interface TextBlockProps {
  title?: string;
  body: string;
  alignment?: 'left' | 'center' | 'right';
  emphasize?: boolean;
  blockId?: string;
  pageId?: string;
}

function TextBlock({ title, body, alignment = 'left', emphasize = false, blockId, pageId }: TextBlockProps) {
  const alignmentClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[alignment];

  return (
    <section className="border-b border-zinc-200 px-4 py-16 dark:border-neutral-800 sm:py-20 md:py-24">
      <div className="mx-auto max-w-4xl">
        <div className={alignmentClass}>
          {title && (
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-white">{title}</h2>
          )}
          <p className={`${title ? 'mt-4' : ''} ${emphasize ? 'text-lg font-semibold' : 'text-base'} leading-relaxed text-zinc-600 dark:text-neutral-300`}>
            {body}
          </p>
        </div>
      </div>
    </section>
  );
}

interface ImageBlockProps {
  src: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
  blockId?: string;
  pageId?: string;
}

function ImageBlock({ src, alt = '', caption, width, height, blockId, pageId }: ImageBlockProps) {
  return (
    <section className="border-b border-zinc-200 px-4 py-16 dark:border-neutral-800 sm:py-20 md:py-24">
      <div className="mx-auto max-w-4xl">
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          className="w-full rounded-lg"
        />
        {caption && (
          <p className="mt-4 text-center text-sm text-zinc-600 dark:text-neutral-400">{caption}</p>
        )}
      </div>
    </section>
  );
}

interface GridBlockProps {
  title?: string;
  items: Array<{
    icon?: string;
    title: string;
    description: string;
    details?: string[];
  }>;
  columns?: number;
  blockId?: string;
  pageId?: string;
}

function GridBlock({ title, items, columns = 2, blockId, pageId }: GridBlockProps) {
  const gridClass = {
    1: 'sm:grid-cols-1',
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-3',
    4: 'sm:grid-cols-4',
  }[Math.min(columns, 4)] || 'sm:grid-cols-2';

  return (
    <section className="border-b border-zinc-200 bg-zinc-50 px-4 py-16 dark:border-neutral-800 dark:bg-neutral-800/30 sm:py-20 md:py-24">
      <div className="mx-auto max-w-6xl">
        {title && (
          <h2 className="text-center text-3xl font-bold text-zinc-900 dark:text-white">{title}</h2>
        )}
        <div className={`mt-12 grid gap-8 ${gridClass}`}>
          {items.map((item, idx) => (
            <div key={idx} className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800">
              {item.icon && <p className="text-4xl">{item.icon}</p>}
              <h3 className={`${item.icon ? 'mt-4' : ''} text-xl font-semibold text-zinc-900 dark:text-white`}>
                {item.title}
              </h3>
              <p className="mt-2 text-zinc-600 dark:text-neutral-300">{item.description}</p>
              {item.details && (
                <ul className="mt-4 space-y-2">
                  {item.details.map((detail, idx2) => (
                    <li key={idx2} className="flex items-start gap-2 text-sm text-zinc-600 dark:text-neutral-300">
                      <span className="flex-shrink-0 text-emerald-600 dark:text-emerald-400">✓</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

interface CTABlockProps {
  title: string;
  description?: string;
  buttons?: Array<{
    text: string;
    url: string;
    primary?: boolean;
  }>;
  blockId?: string;
  pageId?: string;
}

function CTABlock({ title, description, buttons, blockId, pageId }: CTABlockProps) {
  const handleButtonClick = async () => {
    if (pageId && blockId) {
      await trackBlockClick(pageId, blockId, 'cta');
    }
  };

  return (
    <section className="border-b border-zinc-200 bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-16 dark:border-neutral-800 dark:from-emerald-500 dark:to-emerald-600 sm:py-20 md:py-24">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-3xl font-bold text-white">{title}</h2>
        {description && (
          <p className="mt-4 text-lg text-emerald-50">{description}</p>
        )}
        {buttons && (
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            {buttons.map((btn, idx) => (
              <Link
                key={idx}
                href={btn.url}
                onClick={handleButtonClick}
                className={`inline-flex items-center justify-center rounded-full px-8 py-3 text-sm font-semibold transition-all ${
                  btn.primary
                    ? 'bg-white text-emerald-600 hover:bg-emerald-50'
                    : 'border-2 border-white text-white hover:bg-white/10'
                }`}
              >
                {btn.text}
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

interface TestimonialBlockProps {
  quote: string;
  author: string;
  title?: string;
  image?: string;
  blockId?: string;
  pageId?: string;
}

function TestimonialBlock({ quote, author, title, image, blockId, pageId }: TestimonialBlockProps) {
  return (
    <section className="border-b border-zinc-200 bg-zinc-50 px-4 py-16 dark:border-neutral-800 dark:bg-neutral-800/30 sm:py-20 md:py-24">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-lg bg-white p-8 dark:bg-neutral-800">
          <p className="text-lg leading-relaxed text-zinc-600 dark:text-neutral-300">"{quote}"</p>
          <div className="mt-6 flex items-center gap-4">
            {image && <img src={image} alt={author} className="h-12 w-12 rounded-full" />}
            <div>
              <p className="font-semibold text-zinc-900 dark:text-white">{author}</p>
              {title && <p className="text-sm text-zinc-600 dark:text-neutral-400">{title}</p>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

interface DividerBlockProps {
  style?: 'line' | 'space';
  blockId?: string;
  pageId?: string;
}

function DividerBlock({ style = 'line', blockId, pageId }: DividerBlockProps) {
  return (
    <section className="border-b border-zinc-200 dark:border-neutral-800">
      {style === 'line' && <div className="h-px bg-zinc-200 dark:bg-neutral-800" />}
      {style === 'space' && <div className="h-12" />}
    </section>
  );
}

interface FAQBlockProps {
  title?: string;
  items: Array<{
    q: string;
    a: string;
  }>;
  blockId?: string;
  pageId?: string;
}

function FAQBlock({ title, items, blockId, pageId }: FAQBlockProps) {
  return (
    <section className="border-b border-zinc-200 px-4 py-16 dark:border-neutral-800 sm:py-20 md:py-24">
      <div className="mx-auto max-w-4xl">
        {title && (
          <h2 className="text-center text-3xl font-bold text-zinc-900 dark:text-white">{title}</h2>
        )}
        <div className={`${title ? 'mt-12' : ''} space-y-6`}>
          {items.map((item, idx) => (
            <details key={idx} className="group border-l-4 border-emerald-600 bg-zinc-50 p-6 dark:bg-neutral-800/50">
              <summary className="cursor-pointer font-semibold text-zinc-900 dark:text-white">
                {item.q}
              </summary>
              <p className="mt-4 text-zinc-600 dark:text-neutral-300">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

interface FeaturesBlockProps {
  title?: string;
  features: Array<{
    icon?: string;
    title: string;
    description: string;
  }>;
  blockId?: string;
  pageId?: string;
}

function FeaturesBlock({ title, features, blockId, pageId }: FeaturesBlockProps) {
  return (
    <section className="border-b border-zinc-200 px-4 py-16 dark:border-neutral-800 sm:py-20 md:py-24">
      <div className="mx-auto max-w-4xl">
        {title && (
          <h2 className="text-center text-3xl font-bold text-zinc-900 dark:text-white">{title}</h2>
        )}
        <div className={`${title ? 'mt-12' : ''} space-y-6`}>
          {features.map((feature, idx) => (
            <div key={idx} className="flex gap-4">
              {feature.icon && <p className="flex-shrink-0 text-2xl">{feature.icon}</p>}
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-white">{feature.title}</h3>
                <p className="mt-2 text-zinc-600 dark:text-neutral-300">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
