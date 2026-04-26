/**
 * Cache Strategy Configuration
 * Implements efficient HTTP caching and Service Worker strategies
 * for optimal performance on repeat visits
 */

export type CacheStrategy = 'cache-first' | 'network-first' | 'stale-while-revalidate' | 'network-only';

export interface CacheConfig {
  name: string;
  /* Cache implementation strategy */
  strategy: CacheStrategy;
  /* TTL in seconds */
  ttl: number;
  /* Maximum items to store */
  maxItems?: number;
  /* Cache versioning for invalidation */
  version?: string;
}

export interface CacheHeaders {
  'Cache-Control': string;
  'ETag'?: string;
  'Last-Modified'?: string;
  'Expires'?: string;
}

/**
 * Cache configuration for different resource types
 */
export const CACHE_CONFIG = {
  /* HTML documents - revalidate frequently */
  html: {
    name: 'html-cache-v1',
    strategy: 'network-first' as const,
    ttl: 300, // 5 minutes
  } as CacheConfig,

  /* API responses - balance between freshness and performance */
  api: {
    name: 'api-cache-v1',
    strategy: 'stale-while-revalidate' as const,
    ttl: 3600, // 1 hour
    maxItems: 50,
  } as CacheConfig,

  /* Images - cache aggressively with versioning */
  images: {
    name: 'image-cache-v2',
    strategy: 'cache-first' as const,
    ttl: 86400 * 30, // 30 days
    maxItems: 100,
  } as CacheConfig,

  /* JavaScript bundles - cache forever with versioning */
  scripts: {
    name: 'scripts-cache-v2',
    strategy: 'cache-first' as const,
    ttl: 86400 * 365, // 1 year
    maxItems: 50,
  } as CacheConfig,

  /* CSS stylesheets - cache forever with versioning */
  styles: {
    name: 'styles-cache-v2',
    strategy: 'cache-first' as const,
    ttl: 86400 * 365, // 1 year
    maxItems: 20,
  } as CacheConfig,

  /* Fonts - cache indefinitely */
  fonts: {
    name: 'fonts-cache-v1',
    strategy: 'cache-first' as const,
    ttl: 86400 * 365, // 1 year
    maxItems: 30,
  } as CacheConfig,

  /* Dynamic assets (icons, flags, etc.) */
  assets: {
    name: 'assets-cache-v1',
    strategy: 'stale-while-revalidate' as const,
    ttl: 86400 * 7, // 7 days
    maxItems: 100,
  } as CacheConfig,
};

/**
 * Generate HTTP Cache-Control headers
 */
export function getCacheHeaders(
  config: CacheConfig,
  isImmutable: boolean = false
): CacheHeaders {
  let cacheControl = '';

  switch (config.strategy) {
    case 'cache-first':
      cacheControl = `public, max-age=${config.ttl}`;
      if (isImmutable) cacheControl += ', immutable';
      break;

    case 'network-first':
      cacheControl = `public, max-age=${Math.floor(config.ttl / 2)}, must-revalidate`;
      break;

    case 'stale-while-revalidate':
      cacheControl = `public, max-age=${Math.floor(config.ttl / 4)}, stale-while-revalidate=${config.ttl}`;
      break;

    case 'network-only':
      cacheControl = 'no-cache, no-store, must-revalidate';
      break;
  }

  return {
    'Cache-Control': cacheControl,
    Expires: new Date(Date.now() + config.ttl * 1000).toUTCString(),
  };
}

/**
 * Asset versioning rules
 * Assets matching these patterns get cache-busting query params
 */
export const VERSIONED_ASSETS = {
  /* JavaScript bundles with hash in filename */
  scripts: /\.[a-f0-9]{8,}\.(js|mjs)$/,
  /* CSS with hash in filename */
  styles: /\.[a-f0-9]{8,}\.(css)$/,
  /* Images with path versioning */
  images: [/^\/images\//, /^\/assets\/images\//],
  /* Fonts with content hash */
  fonts: [/^\/fonts\//, /^\/assets\/fonts\//],
};

/**
 * Dynamic content that should never be cached
 */
export const NO_CACHE_PATTERNS = [
  /^\/api\/auth\//,
  /^\/api\/admin\//,
  /^\/api\/petitions\/\d+\/signatures/,
  /^\/api\/donations\/webhook/,
  /^\/api\/users\/me/,
];

/**
 * Stale-while-revalidate content
 * Serve cached, fetch fresh in background
 */
export const STALE_WHILE_REVALIDATE_PATTERNS = [
  /^\/api\/petitions\//,
  /^\/api\/comments\//,
  /^\/api\/cms\/pages\//,
  /assets\/data\//,
];

/**
 * Cache manager for complex storage scenarios
 */
export class CacheManager {
  private cacheName: string;
  private ttl: number;
  private maxItems: number;

  constructor(config: CacheConfig) {
    this.cacheName = config.name;
    this.ttl = config.ttl;
    this.maxItems = config.maxItems || 50;
  }

  /**
   * Get item from cache with TTL validation
   */
  async get(key: string): Promise<Response | null> {
    if (typeof window === 'undefined') return null;

    try {
      const cache = await caches.open(this.cacheName);
      const response = await cache.match(key);

      if (!response) return null;

      // Check if cached response is still valid (TTL)
      const cachedTime = response.headers.get('X-Cached-Time');
      if (cachedTime) {
        const age = (Date.now() - parseInt(cachedTime)) / 1000;
        if (age > this.ttl) {
          await cache.delete(key);
          return null;
        }
      }

      return response;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Put item in cache with TTL tracking
   */
  async put(key: string, response: Response): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const cache = await caches.open(this.cacheName);

      // Clone response and add cache metadata
      const newResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: new Headers(response.headers),
      });

      newResponse.headers.set('X-Cached-Time', Date.now().toString());

      await cache.put(key, newResponse);

      // Enforce max items
      const keys = await cache.keys();
      if (keys.length > this.maxItems) {
        await cache.delete(keys[0]); // Remove oldest
      }
    } catch (error) {
      console.error('Cache put error:', error);
    }
  }

  /**
   * Delete specific item
   */
  async delete(key: string): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const cache = await caches.open(this.cacheName);
      await cache.delete(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  /**
   * Clear entire cache
   */
  async clear(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      caches.delete(this.cacheName);
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * Get cache stats
   */
  async getStats(): Promise<{ size: number; items: number; hits: number }> {
    if (typeof window === 'undefined') {
      return { size: 0, items: 0, hits: 0 };
    }

    try {
      const cache = await caches.open(this.cacheName);
      const keys = await cache.keys();

      let size = 0;
      for (const key of keys) {
        const response = await cache.match(key);
        if (response) {
          size += response.headers.get('content-length')
            ? parseInt(response.headers.get('content-length')!)
            : 0;
        }
      }

      return {
        size,
        items: keys.length,
        hits: parseInt(sessionStorage.getItem(`cache-hits-${this.cacheName}`) || '0'),
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return { size: 0, items: 0, hits: 0 };
    }
  }
}

/**
 * Fetch with caching strategy
 */
export async function fetchWithCache(
  url: string,
  strategy: CacheStrategy,
  config: CacheConfig
): Promise<Response> {
  const cacheManager = new CacheManager(config);
  const cacheKey = url;

  switch (strategy) {
    case 'cache-first':
      // Try cache first, fall back to network
      {
        const cached = await cacheManager.get(cacheKey);
        if (cached) {
          recordCacheHit(config.name);
          return cached;
        }

        const response = await fetch(url);
        if (response.ok) {
          await cacheManager.put(cacheKey, response.clone());
        }
        return response;
      }

    case 'network-first':
      // Try network first, fall back to cache
      {
        try {
          const response = await fetch(url);
          if (response.ok) {
            await cacheManager.put(cacheKey, response.clone());
          }
          return response;
        } catch (error) {
          const cached = await cacheManager.get(cacheKey);
          if (cached) {
            recordCacheHit(config.name);
            return cached;
          }
          throw error;
        }
      }

    case 'stale-while-revalidate':
      // Return cache immediately, update in background
      {
        const cached = await cacheManager.get(cacheKey);
        if (cached) {
          recordCacheHit(config.name);
          // Fetch fresh in background
          fetch(url).then((response) => {
            if (response.ok) {
              cacheManager.put(cacheKey, response.clone());
            }
          });
          return cached;
        }

        const response = await fetch(url);
        if (response.ok) {
          await cacheManager.put(cacheKey, response.clone());
        }
        return response;
      }

    case 'network-only':
      // Always fetch from network
      return fetch(url);

    default:
      return fetch(url);
  }
}

/**
 * Record cache hit for analytics
 */
function recordCacheHit(cacheName: string): void {
  const key = `cache-hits-${cacheName}`;
  const current = parseInt(sessionStorage.getItem(key) || '0');
  sessionStorage.setItem(key, (current + 1).toString());
}

/**
 * Get cache hit ratio for all caches
 */
export async function getCacheHitRatio(): Promise<number> {
  let totalHits = 0;
  let totalRequests = 0;

  Object.values(CACHE_CONFIG).forEach((config) => {
    const hits = parseInt(sessionStorage.getItem(`cache-hits-${config.name}`) || '0');
    totalHits += hits;
    totalRequests += hits;
  });

  // Add approximate total requests (rough estimate)
  totalRequests = Math.max(totalRequests, totalHits + 100);

  return totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0;
}

/**
 * Initialize ServiceWorker for advanced caching
 */
export async function initializeServiceWorker(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
    });
    console.log('ServiceWorker registered:', registration);
    return true;
  } catch (error) {
    console.error('ServiceWorker registration failed:', error);
    return false;
  }
}

/**
 * Preload critical assets for faster navigation
 */
export async function preloadCriticalAssets(urls: string[]): Promise<void> {
  if (typeof window === 'undefined') return;

  for (const url of urls) {
    try {
      await fetchWithCache(url, 'cache-first', CACHE_CONFIG.scripts);
    } catch (error) {
      console.warn(`Failed to preload ${url}:`, error);
    }
  }
}

/**
 * Clear all caches (useful for updates)
 */
export async function clearAllCaches(): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) return;

  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
    console.log('All caches cleared');
  } catch (error) {
    console.error('Failed to clear caches:', error);
  }
}

/**
 * Get cache size reports
 */
export async function getCacheSizeReport(): Promise<Record<string, { size: number; items: number }>> {
  const report: Record<string, { size: number; items: number }> = {};

  for (const [key, config] of Object.entries(CACHE_CONFIG)) {
    const manager = new CacheManager(config as CacheConfig);
    const stats = await manager.getStats();
    report[key] = { size: stats.size, items: stats.items };
  }

  return report;
}

export default {
  CACHE_CONFIG,
  VERSIONED_ASSETS,
  NO_CACHE_PATTERNS,
  STALE_WHILE_REVALIDATE_PATTERNS,
  CacheManager,
  getCacheHeaders,
  fetchWithCache,
  getCacheHitRatio,
  initializeServiceWorker,
  preloadCriticalAssets,
  clearAllCaches,
  getCacheSizeReport,
};
