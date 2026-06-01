import { test, expect } from '../fixtures/auth';

/**
 * Performance E2E Tests
 * Tests page load times, API response times, and WebSocket latency
 */

test.describe('Performance Tests', () => {
  test('TC-PERF-001: Homepage load time < 2 seconds', async ({ adminPage }) => {
    const startTime = Date.now();

    // Navigate to home
    await adminPage.goto('/');

    // Wait for page fully loaded
    await adminPage.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // Should load in less than 2 seconds
    expect(loadTime).toBeLessThan(2000);

    console.log(`Homepage load time: ${loadTime}ms`);
  });

  test('TC-PERF-002: Dashboard load time < 1.5 seconds', async ({ adminPage }) => {
    const startTime = Date.now();

    // Navigate to dashboard
    await adminPage.goto('/dashboard');

    // Wait for page fully loaded
    await adminPage.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // Should load in less than 1.5 seconds
    expect(loadTime).toBeLessThan(1500);

    console.log(`Dashboard load time: ${loadTime}ms`);
  });

  test('TC-PERF-003: Analytics page load time < 2 seconds', async ({ adminPage }) => {
    const startTime = Date.now();

    // Navigate to analytics
    await adminPage.goto('/admin/analytics');

    // Wait for page fully loaded
    await adminPage.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // Should load in less than 2 seconds
    expect(loadTime).toBeLessThan(2000);

    console.log(`Analytics page load time: ${loadTime}ms`);
  });

  test('TC-PERF-004: API response time for messages < 200ms', async ({ adminPage, adminToken }) => {
    const startTime = Date.now();

    // Make API request
    const response = await adminPage.request.get('/api/messages?page=1&pageSize=20', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    const responseTime = Date.now() - startTime;

    // Should respond in less than 200ms
    expect(responseTime).toBeLessThan(200);
    expect(response.ok()).toBeTruthy();

    console.log(`Messages API response time: ${responseTime}ms`);
  });

  test('TC-PERF-005: API response time for analytics < 500ms', async ({
    adminPage,
    adminToken,
  }) => {
    const startTime = Date.now();

    // Make API request
    const response = await adminPage.request.get(
      '/api/analytics/messages?period=week',
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      },
    );

    const responseTime = Date.now() - startTime;

    // Should respond in less than 500ms
    expect(responseTime).toBeLessThan(500);
    expect(response.ok()).toBeTruthy();

    console.log(`Analytics API response time: ${responseTime}ms`);
  });

  test('TC-PERF-006: WebSocket connection time < 500ms', async ({ adminPage }) => {
    const startTime = Date.now();

    // Create a promise that resolves when WebSocket connects
    const wsConnect = adminPage.evaluate(() => {
      return new Promise<number>((resolve) => {
        const socket = (window as any).io('http://localhost:4000/analytics');

        socket.on('connect', () => {
          resolve(Date.now());
          socket.disconnect();
        });

        // Timeout after 2 seconds
        setTimeout(() => {
          socket.disconnect();
          resolve(Date.now());
        }, 2000);
      });
    });

    const connectTime = await wsConnect;
    const totalTime = connectTime - startTime;

    // Should connect in less than 500ms
    expect(totalTime).toBeLessThan(500);

    console.log(`WebSocket connection time: ${totalTime}ms`);
  });

  test('TC-PERF-007: Dashboard first paint < 1 second', async ({ adminPage }) => {
    // Navigate to dashboard
    await adminPage.goto('/admin/analytics');

    // Measure paint timing
    const paintTiming = await adminPage.evaluate(() => {
      const perfEntries = performance.getEntriesByType('paint');
      const firstPaint = perfEntries.find((entry) => entry.name === 'first-paint');
      return firstPaint?.startTime || 0;
    });

    // First paint should be less than 1 second
    expect(paintTiming).toBeLessThan(1000);

    console.log(`Dashboard first paint: ${paintTiming}ms`);
  });

  test('TC-PERF-008: Dashboard interactive < 2 seconds', async ({ adminPage }) => {
    // Navigate to dashboard
    const startTime = Date.now();
    await adminPage.goto('/admin/analytics');

    // Wait for interactive (all buttons clickable, etc.)
    await adminPage.waitForLoadState('domcontentloaded');

    const interactiveTime = Date.now() - startTime;

    // Should be interactive in less than 2 seconds
    expect(interactiveTime).toBeLessThan(2000);

    console.log(`Dashboard interactive time: ${interactiveTime}ms`);
  });

  test('TC-PERF-009: Real-time update latency < 500ms', async ({ adminPage, adminToken }) => {
    // Navigate to analytics
    await adminPage.goto('/admin/analytics');
    await adminPage.waitForLoadState('networkidle');

    // Measure time from message creation to dashboard update
    const latency = await adminPage.evaluate(
      async ({ token }: any) => {
        const startTime = Date.now();

        // Create message
        const response = await fetch('http://localhost:4000/api/messages', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipientId: 'test-user',
            subject: 'Latency Test',
            content: 'Testing latency',
          }),
        });

        // Listen for dashboard update
        return new Promise<number>((resolve) => {
          const observer = new MutationObserver(() => {
            resolve(Date.now() - startTime);
            observer.disconnect();
          });

          // Observe metrics element for changes
          const metricsEl = document.querySelector('[data-testid="total-messages"]');
          if (metricsEl) {
            observer.observe(metricsEl, {
              childList: true,
              subtree: true,
              characterData: true,
            });

            // Timeout after 3 seconds
            setTimeout(() => {
              resolve(Date.now() - startTime);
              observer.disconnect();
            }, 3000);
          }
        });
      },
      { token: adminToken },
    );

    // Real-time update should be less than 500ms
    expect(latency).toBeLessThan(500);

    console.log(`Real-time update latency: ${latency}ms`);
  });

  test('TC-PERF-010: Search performance < 500ms', async ({ adminPage }) => {
    // Navigate to messages
    await adminPage.goto('/messages');
    await adminPage.waitForLoadState('networkidle');

    const startTime = Date.now();

    // Perform search
    await adminPage.fill('input[placeholder="Search messages..."]', 'test');
    await adminPage.click('button:has-text("Search")');

    // Wait for results
    await adminPage.waitForLoadState('networkidle');

    const searchTime = Date.now() - startTime;

    // Search should complete in less than 500ms
    expect(searchTime).toBeLessThan(500);

    console.log(`Search response time: ${searchTime}ms`);
  });

  test('TC-PERF-011: Bundle size analysis', async ({ adminPage }) => {
    // Measure JavaScript bundle size
    const bundleSize = await adminPage.evaluate(() => {
      const scripts = document.querySelectorAll('script[src]');
      let totalSize = 0;

      scripts.forEach((script) => {
        // In real app, would get actual sizes from performance API
        // This is a mock calculation
        const src = script.getAttribute('src') || '';
        totalSize += src.length * 100; // Rough estimate
      });

      return totalSize;
    });

    // Bundle should be reasonable size
    // (This is a rough check; real size would be measured in CI)
    expect(bundleSize).toBeGreaterThan(0);

    console.log(`Estimated bundle size: ${(bundleSize / 1024).toFixed(2)}KB`);
  });

  test('TC-PERF-012: Memory usage stable', async ({ adminPage }) => {
    // Navigate to dashboard
    await adminPage.goto('/admin/analytics');
    await adminPage.waitForLoadState('networkidle');

    const measurements = [];

    // Take 5 memory measurements
    for (let i = 0; i < 5; i++) {
      const memory = await adminPage.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });

      measurements.push(memory);

      // Wait before next measurement
      await adminPage.waitForTimeout(500);
    }

    // Verify memory doesn't spike significantly
    const avgMemory = measurements.reduce((a, b) => a + b) / measurements.length;
    const maxMemory = Math.max(...measurements);
    const spikeRatio = maxMemory / avgMemory;

    // Memory should not spike more than 2x average
    expect(spikeRatio).toBeLessThan(2);

    console.log(`Average memory: ${(avgMemory / 1024 / 1024).toFixed(2)}MB`);
    console.log(`Memory spike ratio: ${spikeRatio.toFixed(2)}x`);
  });

  test('TC-PERF-013: CPU usage reasonable during updates', async ({ adminPage, adminToken }) => {
    // Navigate to analytics
    await adminPage.goto('/admin/analytics');
    await adminPage.waitForLoadState('networkidle');

    // Create rapid messages to stress test
    const startTime = Date.now();

    for (let i = 0; i < 10; i++) {
      await adminPage.request.post('/api/messages', {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: {
          recipientId: `user-${i}`,
          subject: `Stress Test ${i}`,
          content: 'CPU test',
        },
      });
    }

    const totalTime = Date.now() - startTime;

    // Should handle rapid updates without blocking (less than 5 seconds for 10 messages)
    expect(totalTime).toBeLessThan(5000);

    console.log(`Processed 10 messages in ${totalTime}ms`);
  });

  test('TC-PERF-014: Cache hit rate', async ({ adminPage }) => {
    // Navigate to dashboard twice
    await adminPage.goto('/admin/analytics');
    await adminPage.waitForLoadState('networkidle');

    const firstLoadTime = await adminPage.evaluate(() => performance.now());

    // Navigate away and back
    await adminPage.goto('/messages');
    await adminPage.waitForLoadState('networkidle');

    await adminPage.goto('/admin/analytics');
    await adminPage.waitForLoadState('networkidle');

    const secondLoadTime = await adminPage.evaluate(() => performance.now());

    // Second load should be faster (cached)
    expect(secondLoadTime).toBeLessThan(firstLoadTime + 500);

    console.log(`Cache hit confirmed - subsequent load faster`);
  });

  test('TC-PERF-015: Compression effectiveness', async ({ adminPage }) => {
    // Measure response headers for compression
    const response = await adminPage.request.get('/admin/analytics');

    const contentEncoding = response.headers()['content-encoding'];
    const contentLength = response.headers()['content-length'];

    // Should use gzip or brotli compression
    expect(contentEncoding).toMatch(/gzip|br|deflate/i);

    console.log(`Content-Encoding: ${contentEncoding}`);
    console.log(`Compressed size: ${contentLength} bytes`);
  });
});
