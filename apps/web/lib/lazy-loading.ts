/**
 * Lazy Loading & Code Splitting Utilities
 * Helpers for dynamic imports and component splitting
 */

import { ComponentType, ReactNode } from 'react';

/**
 * Configuration for lazy loading
 */
export interface LazyLoadConfig {
  /** Delay before loading component (ms) */
  delay?: number;
  /** Whether to use intersection observer */
  useIntersection?: boolean;
  /** Root margin for intersection observer */
  rootMargin?: string;
  /** Fallback component while loading */
  fallback?: ReactNode;
  /** Error boundary fallback */
  errorFallback?: (error: Error) => ReactNode;
  /** Timeout for loading (ms) */
  timeout?: number;
  /** Called when component loads */
  onLoad?: () => void;
  /** Called on error */
  onError?: (error: Error) => void;
}

/**
 * Routes to lazy load (for route-based code splitting)
 */
export const LAZY_ROUTES = {
  // Admin routes
  'admin/dashboard': () => Promise.resolve({ default: null }) as any,
  'admin/settings': () => Promise.resolve({ default: null }) as any,
  'admin/donations': () => Promise.resolve({ default: null }) as any,
  'admin/cms': () => Promise.resolve({ default: null }) as any,

  // Public routes
  'petitions': () => Promise.resolve({ default: null }) as any,
  'create': () => Promise.resolve({ default: null }) as any,
  'dashboard': () => Promise.resolve({ default: null }) as any,
  'auth/login': () => Promise.resolve({ default: null }) as any,
  'auth/signup': () => Promise.resolve({ default: null }) as any,
};

/**
 * Components to lazy load (for component-based code splitting)
 */
export const LAZY_COMPONENTS = {
  // Heavy components
  'CMSPageBuilder': () => Promise.resolve({ default: null }) as any,
  'PetitionWizardForm': () => Promise.resolve({ default: null }) as any,
  'AnalyticsDashboard': () => Promise.resolve({ default: null }) as any,
  'GamificationPanel': () => Promise.resolve({ default: null }) as any,

  // Modal components
  'ShareModal': () => Promise.resolve({ default: null }) as any,
  'DonationSuccessModal': () => Promise.resolve({ default: null }) as any,

  // Admin components
  'AdminDonationSettings': () => Promise.resolve({ default: null }) as any,
  'CMSAdminDashboard': () => Promise.resolve({ default: null }) as any,
  'CMSContentTypeManager': () => Promise.resolve({ default: null }) as any,
};

/**
 * Prefetch a resource (script, stylesheet, or image)
 */
export function prefetchResource(
  url: string,
  type: 'script' | 'style' | 'image' | 'fetch' = 'fetch'
): void {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'prefetch';
  
  switch (type) {
    case 'script':
      link.as = 'script';
      link.href = url;
      break;
    case 'style':
      link.as = 'style';
      link.href = url;
      break;
    case 'image':
      link.as = 'image';
      link.href = url;
      break;
    case 'fetch':
    default:
      link.as = 'fetch';
      link.crossOrigin = 'anonymous';
      link.href = url;
  }

  document.head.appendChild(link);
}

/**
 * Preload a resource with higher priority than prefetch
 */
export function preloadResource(
  url: string,
  type: 'script' | 'style' | 'image' | 'font' = 'script'
): void {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  
  switch (type) {
    case 'script':
      link.as = 'script';
      link.href = url;
      break;
    case 'style':
      link.as = 'style';
      link.href = url;
      break;
    case 'image':
      link.as = 'image';
      link.href = url;
      break;
    case 'font':
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
      link.href = url;
  }

  document.head.appendChild(link);
}

/**
 * Defer non-critical JavaScript
 */
export function deferScript(src: string, options?: { async?: boolean }): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = options?.async ?? true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });
}

/**
 * Lazy load an image with intersection observer
 */
export function createLazyImageObserver(): IntersectionObserver {
  return new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
        }
        // Unobserve after loading
        (entry.target as HTMLElement).style.opacity = '1';
      }
    });
  }, {
    rootMargin: '50px',
  });
}

/**
 * Get module entry point for dynamic imports
 */
export async function dynamicImport<T = any>(
  modulePath: string,
  config?: LazyLoadConfig
): Promise<T> {
  try {
    if (config?.delay) {
      await new Promise((resolve) => setTimeout(resolve, config.delay));
    }

    let timeoutId: NodeJS.Timeout | undefined;
    if (config?.timeout) {
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error(`Module loading timeout: ${modulePath}`)),
          config.timeout
        );
      });

      const modulePromise = import(modulePath);
      return Promise.race([modulePromise, timeoutPromise]) as Promise<T>;
    }

    const module = await import(modulePath);
    config?.onLoad?.();
    return module;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    config?.onError?.(err);
    throw err;
  }
}

/**
 * Estimate script download time based on resource timing
 */
export function estimateLoadTime(resourceUrl: string): number {
  if (typeof performance === 'undefined') return 0;

  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const resource = resources.find((r) => r.name.includes(resourceUrl));

  if (resource) {
    return resource.responseEnd - resource.fetchStart;
  }

  return 0;
}

/**
 * Get total bundle size breakdown by type
 */
export function getBundleBreakdown(): Record<string, number> {
  if (typeof performance === 'undefined') return {};

  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const breakdown: Record<string, number> = {
    scripts: 0,
    stylesheets: 0,
    images: 0,
    fonts: 0,
    other: 0,
  };

  resources.forEach((resource) => {
    const size = resource.transferSize || 0;
    if (resource.name.includes('.js')) {
      breakdown.scripts += size;
    } else if (resource.name.includes('.css')) {
      breakdown.stylesheets += size;
    } else if (/\.(png|jpg|gif|svg|webp)/.test(resource.name)) {
      breakdown.images += size;
    } else if (/\.(woff|woff2|ttf|otf)/.test(resource.name)) {
      breakdown.fonts += size;
    } else {
      breakdown.other += size;
    }
  });

  return breakdown;
}

/**
 * Check if a resource is cached
 */
export function isResourceCached(resourceUrl: string): boolean {
  if (typeof performance === 'undefined') return false;

  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const resource = resources.find((r) => r.name.includes(resourceUrl));

  if (!resource) return false;

  // If transferSize is 0 but decodedBodySize > 0, it's from cache
  return resource.transferSize === 0 && resource.decodedBodySize > 0;
}

/**
 * Prefetch resources on idle (using requestIdleCallback)
 */
export function prefetchOnIdle(urls: string[]): void {
  if (typeof window === 'undefined') return;

  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => {
      urls.forEach((url) => prefetchResource(url));
    });
  } else {
    // Fallback: prefetch on next frame
    setTimeout(() => {
      urls.forEach((url) => prefetchResource(url));
    }, 0);
  }
}

/**
 * Monitor when resource finishes loading
 */
export function onResourceLoad(resourceName: string): Promise<PerformanceResourceTiming> {
  return new Promise((resolve) => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries() as PerformanceResourceTiming[];
      const resource = entries.find((r) => r.name.includes(resourceName));
      if (resource) {
        observer.disconnect();
        resolve(resource);
      }
    });

    observer.observe({ entryTypes: ['resource'] });

    // Timeout after 30 seconds
    setTimeout(() => {
      observer.disconnect();
    }, 30000);
  });
}

/**
 * Calculate Lighthouse Performance Score (simplified)
 */
export function calculatePerformanceScore(metrics: {
  lcp?: number;
  fid?: number;
  inp?: number;
  cls?: number;
  fcp?: number;
  ttfb?: number;
}): number {
  let score = 100;

  // LCP (35% weight)
  if (metrics.lcp) {
    if (metrics.lcp > 4000) score -= 35;
    else if (metrics.lcp > 2500) score -= 15;
  }

  // FID (30% weight)
  if (metrics.fid) {
    if (metrics.fid > 300) score -= 30;
    else if (metrics.fid > 100) score -= 15;
  }

  // INP (30% weight)
  if (metrics.inp) {
    if (metrics.inp > 500) score -= 30;
    else if (metrics.inp > 200) score -= 15;
  }

  // CLS (25% weight)
  if (metrics.cls) {
    if (metrics.cls > 0.25) score -= 25;
    else if (metrics.cls > 0.1) score -= 10;
  }

  // FCP (10% weight)
  if (metrics.fcp) {
    if (metrics.fcp > 3000) score -= 10;
    else if (metrics.fcp > 1800) score -= 5;
  }

  // TTFB (10% weight)
  if (metrics.ttfb) {
    if (metrics.ttfb > 1200) score -= 10;
    else if (metrics.ttfb > 600) score -= 5;
  }

  return Math.max(0, Math.round(score));
}
