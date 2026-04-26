/**
 * Web Vitals Performance Monitoring
 * Tracks Core Web Vitals and custom metrics
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs improvement' | 'poor';
  delta?: number;
  id: string;
  navigationType?: string;
  entries?: PerformanceEntry[];
}

export interface WebVitals {
  lcp?: PerformanceMetric; // Largest Contentful Paint
  fid?: PerformanceMetric; // First Input Delay
  inp?: PerformanceMetric; // Interaction to Next Paint
  cls?: PerformanceMetric; // Cumulative Layout Shift
  fcp?: PerformanceMetric; // First Contentful Paint
  ttfb?: PerformanceMetric; // Time to First Byte
}

export interface PerformanceReport {
  url: string;
  timestamp: Date;
  vitals: WebVitals;
  customMetrics: Record<string, number>;
  resourceTiming: {
    totalResources: number;
    totalSize: number;
    avgResourceSize: number;
  };
  renderTime: number;
  scriptTime: number;
}

class PerformanceMonitor {
  private vitals: WebVitals = {};
  private customMetrics: Map<string, number> = new Map();
  private resourceMetrics: PerformanceResourceTiming[] = [];
  private observers: Map<string, PerformanceObserver> = new Map();
  private readonly maxMetricsToStore = 100;

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupObservers();
      this.captureNavigationTiming();
    }
  }

  /**
   * Setup PerformanceObserver for various metrics
   */
  private setupObservers(): void {
    // Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          const value = lastEntry.renderTime || lastEntry.loadTime || lastEntry.startTime;
          this.vitals.lcp = {
            name: 'Largest Contentful Paint',
            value: value,
            rating: this.getRatingLCP(value),
            id: lastEntry.id || 'lcp',
          };
        });

        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.set('lcp', lcpObserver);
      } catch (e) {
        console.warn('LCP observer not supported');
      }

      // Cumulative Layout Shift
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          this.vitals.cls = {
            name: 'Cumulative Layout Shift',
            value: clsValue,
            rating: this.getRatingCLS(clsValue),
            id: 'cls',
          };
        });

        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.set('cls', clsObserver);
      } catch (e) {
        console.warn('CLS observer not supported');
      }

      // First Input Delay / Interaction to Next Paint
      try {
        const inpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          if (entries.length > 0) {
            const lastEntry = entries[entries.length - 1];
            this.vitals.inp = {
              name: 'Interaction to Next Paint',
              value: (lastEntry as any).processingDuration || 0,
              rating: this.getRatingINP((lastEntry as any).processingDuration || 0),
              id: 'inp',
            };
          }
        });

        inpObserver.observe({ entryTypes: ['first-input', 'event'] });
        this.observers.set('inp', inpObserver);
      } catch (e) {
        console.warn('INP observer not supported');
      }

      // First Contentful Paint
      try {
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const fcpEntry = entries.find((e) => e.name === 'first-contentful-paint');
          if (fcpEntry) {
            this.vitals.fcp = {
              name: 'First Contentful Paint',
              value: fcpEntry.startTime,
              rating: this.getRatingFCP(fcpEntry.startTime),
              id: 'fcp',
            };
          }
        });

        fcpObserver.observe({ entryTypes: ['paint'] });
        this.observers.set('fcp', fcpObserver);
      } catch (e) {
        console.warn('FCP observer not supported');
      }
    }
  }

  /**
   * Capture Navigation Timing API metrics
   */
  private captureNavigationTiming(): void {
    if ('PerformanceNavigationTiming' in window) {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (perfData) {
        this.vitals.ttfb = {
          name: 'Time to First Byte',
          value: perfData.responseStart - perfData.fetchStart,
          rating: this.getRatingTTFB(perfData.responseStart - perfData.fetchStart),
          id: 'ttfb',
        };

        // Store custom metrics for later analysis
        this.setCustomMetric('domContentLoaded', perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart);
        this.setCustomMetric('loadComplete', perfData.loadEventEnd - perfData.loadEventStart);
        this.setCustomMetric('resourceTiming', perfData.responseEnd - perfData.fetchStart);
      }
    }
  }

  /**
   * Track resource loading performance
   */
  getResourceMetrics(): {
    totalResources: number;
    totalSize: number;
    avgResourceSize: number;
    byType: Record<string, { count: number; size: number }>;
  } {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    let totalSize = 0;
    const byType: Record<string, { count: number; size: number }> = {};

    resources.forEach((resource) => {
      totalSize += resource.transferSize || 0;

      const type = new URL(resource.name).pathname.split('.').pop() || 'other';
      if (!byType[type]) {
        byType[type] = { count: 0, size: 0 };
      }
      byType[type].count += 1;
      byType[type].size += resource.transferSize || 0;
    });

    return {
      totalResources: resources.length,
      totalSize,
      avgResourceSize: resources.length > 0 ? totalSize / resources.length : 0,
      byType,
    };
  }

  /**
   * Set custom performance metric
   */
  setCustomMetric(name: string, value: number): void {
    this.customMetrics.set(name, value);
  }

  /**
   * Get all collected metrics
   */
  getMetrics(): PerformanceReport {
    const resourceMetrics = this.getResourceMetrics();
    
    return {
      url: typeof window !== 'undefined' ? window.location.href : '',
      timestamp: new Date(),
      vitals: this.vitals,
      customMetrics: Object.fromEntries(this.customMetrics),
      resourceTiming: {
        totalResources: resourceMetrics.totalResources,
        totalSize: resourceMetrics.totalSize,
        avgResourceSize: resourceMetrics.avgResourceSize,
      },
      renderTime: this.vitals.lcp?.value || 0,
      scriptTime: this.customMetrics.get('scriptTime') || 0,
    };
  }

  /**
   * Send metrics to analytics backend
   */
  async sendMetrics(endpoint: string = '/api/analytics/performance'): Promise<void> {
    try {
      const metrics = this.getMetrics();
      
      // Use sendBeacon for reliability (won't block page unload)
      if (navigator.sendBeacon) {
        navigator.sendBeacon(endpoint, JSON.stringify(metrics));
      } else {
        // Fallback to fetch
        await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(metrics),
          keepalive: true, // Ensure request completes before unload
        });
      }
    } catch (error) {
      console.error('Failed to send performance metrics:', error);
    }
  }

  /**
   * Rating helpers for Core Web Vitals
   */
  private getRatingLCP(value: number): 'good' | 'needs improvement' | 'poor' {
    if (value <= 2500) return 'good';
    if (value <= 4000) return 'needs improvement';
    return 'poor';
  }

  private getRatingFID(value: number): 'good' | 'needs improvement' | 'poor' {
    if (value <= 100) return 'good';
    if (value <= 300) return 'needs improvement';
    return 'poor';
  }

  private getRatingINP(value: number): 'good' | 'needs improvement' | 'poor' {
    if (value <= 200) return 'good';
    if (value <= 500) return 'needs improvement';
    return 'poor';
  }

  private getRatingCLS(value: number): 'good' | 'needs improvement' | 'poor' {
    if (value <= 0.1) return 'good';
    if (value <= 0.25) return 'needs improvement';
    return 'poor';
  }

  private getRatingFCP(value: number): 'good' | 'needs improvement' | 'poor' {
    if (value <= 1800) return 'good';
    if (value <= 3000) return 'needs improvement';
    return 'poor';
  }

  private getRatingTTFB(value: number): 'good' | 'needs improvement' | 'poor' {
    if (value <= 600) return 'good';
    if (value <= 1200) return 'needs improvement';
    return 'poor';
  }

  /**
   * Cleanup observers
   */
  cleanup(): void {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers.clear();
  }
}

// Export singleton
const performanceMonitor = new PerformanceMonitor();
export default performanceMonitor;
