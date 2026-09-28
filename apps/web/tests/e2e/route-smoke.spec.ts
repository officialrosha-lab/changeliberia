/**
 * Full frontend route-surface smoke test — navigates to every page route and
 * asserts it doesn't 5xx or render an unhandled error boundary. Parameterized
 * by BASE_URL (see playwright.config.ts) and API_BASE_URL, so it runs
 * identically against a local dev server or a live deployment (this repo
 * also runs it against https://changeliberia.org — see the smoke-test
 * findings report for that run).
 *
 * This intentionally does not attempt a real logged-in session: auth-gated
 * and admin-gated pages are only checked for "loads without crashing" (they
 * may render a login prompt or redirect, which is correct and expected).
 */
import { test, expect } from '@playwright/test';

const API_BASE_URL = (process.env.API_BASE_URL || 'http://localhost:4000').replace(/\/$/, '');

interface PageRoute {
  path: string;
  label: string;
}

const STATIC_PAGES: PageRoute[] = [
  // Public
  { path: '/', label: 'home' },
  { path: '/about', label: 'about' },
  { path: '/how-it-works', label: 'how-it-works' },
  { path: '/help-center', label: 'help-center' },
  { path: '/community-guidelines', label: 'community-guidelines' },
  { path: '/terms', label: 'terms' },
  { path: '/privacy', label: 'privacy' },
  { path: '/petitions', label: 'petitions list' },
  { path: '/polls', label: 'polls list' },
  { path: '/leaders', label: 'leaders' },
  { path: '/civic-pulse', label: 'civic-pulse' },
  { path: '/sponsors', label: 'sponsors' },
  { path: '/components-showcase', label: 'components-showcase' },
  { path: '/auth/login', label: 'login' },
  { path: '/auth/signup', label: 'signup' },
  { path: '/auth/forgot-password', label: 'forgot-password' },
  { path: '/auth/reset-password', label: 'reset-password' },
  { path: '/auth/verify-email', label: 'verify-email' },
  { path: '/auth/privacy', label: 'auth-privacy' },
  { path: '/official/apply', label: 'official-apply' },

  // Auth-gated (checked for crash-free load only, not a real session)
  { path: '/dashboard', label: 'dashboard' },
  { path: '/create', label: 'create-petition' },
  { path: '/apply', label: 'apply' },
  { path: '/collect-signatures', label: 'collect-signatures' },
  { path: '/settings', label: 'settings' },
  { path: '/notifications', label: 'notifications' },
  { path: '/messages', label: 'messages' },
  { path: '/auth/change-password', label: 'change-password' },
  { path: '/auth/sessions', label: 'sessions' },
  { path: '/auth/two-factor', label: 'two-factor' },
  { path: '/official/dashboard', label: 'official-dashboard' },
  { path: '/government/submissions', label: 'government-submissions' },

  // Admin/moderator/official-role-gated (crash-free load only)
  { path: '/admin', label: 'admin-home' },
  { path: '/admin/ambassadors', label: 'admin-ambassadors' },
  { path: '/admin/directory', label: 'admin-directory' },
  { path: '/admin/directory/institutions', label: 'admin-directory-institutions' },
  { path: '/admin/directory/import', label: 'admin-directory-import' },
  { path: '/admin/directory/analytics', label: 'admin-directory-analytics' },
  { path: '/cms', label: 'cms-home' },
  { path: '/moderator', label: 'moderator' },
];

/** Best-effort recursive search for the first object with an `id`/`slug` field. */
function findFirstIdLike(value: unknown, key: 'id' | 'slug', depth = 0): string | undefined {
  if (!value || depth > 4) return undefined;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findFirstIdLike(item, key, depth + 1);
      if (found) return found;
    }
    return undefined;
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (typeof record[key] === 'string') return record[key] as string;
    for (const v of Object.values(record)) {
      const found = findFirstIdLike(v, key, depth + 1);
      if (found) return found;
    }
  }
  return undefined;
}

async function fetchJson(path: string): Promise<unknown> {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`);
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

test.describe('Full frontend route inventory smoke test', () => {
  let petitionId: string | undefined;
  let pollSlug: string | undefined;
  let officialSlug: string | undefined;
  const cmsSlug = 'about';

  test.beforeAll(async () => {
    const petitions = await fetchJson('/api/v1/petitions/browse/all');
    petitionId = findFirstIdLike(petitions, 'id') || (await fetchJson('/api/v1/petitions').then((r) => findFirstIdLike(r, 'id')));

    const polls = await fetchJson('/api/v1/polls');
    pollSlug = findFirstIdLike(polls, 'slug');

    const officials = await fetchJson('/api/v1/officials/claimable');
    officialSlug = findFirstIdLike(officials, 'slug');
  });

  function dynamicPages(): PageRoute[] {
    const pages: PageRoute[] = [];
    if (petitionId) pages.push({ path: `/petitions/${petitionId}`, label: 'petition detail' });
    if (pollSlug) pages.push({ path: `/polls/${pollSlug}`, label: 'poll detail' });
    if (officialSlug) pages.push({ path: `/official/${officialSlug}`, label: 'official profile' });
    pages.push({ path: `/pages/${cmsSlug}`, label: 'cms page' });
    // messages/[id] and cms/editor/[id] need a real authenticated session's
    // own resource — not resolvable anonymously, so they're covered only via
    // the crash-free check on their list pages (/messages, /cms) above.
    return pages;
  }

  for (const route of STATIC_PAGES) {
    test(`${route.label} (${route.path}) loads without a server error`, async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on('pageerror', (err) => consoleErrors.push(err.message));

      const response = await page.goto(route.path, { waitUntil: 'domcontentloaded', timeout: 20000 });

      expect(response?.status() ?? 0, `HTTP status for ${route.path}`).toBeLessThan(500);

      const body = await page.textContent('body').catch(() => '');
      const hasErrorOverlay =
        body?.includes('Application error: a client-side exception has occurred') ||
        body?.includes('Internal Server Error');
      expect(hasErrorOverlay, `unhandled error overlay on ${route.path}`).toBe(false);
      expect(consoleErrors, `uncaught page errors on ${route.path}: ${consoleErrors.join('; ')}`).toHaveLength(0);
    });
  }

  test('dynamic detail pages load without a server error', async ({ page }) => {
    for (const route of dynamicPages()) {
      const consoleErrors: string[] = [];
      page.on('pageerror', (err) => consoleErrors.push(err.message));

      const response = await page.goto(route.path, { waitUntil: 'domcontentloaded', timeout: 20000 });
      expect(response?.status() ?? 0, `HTTP status for ${route.path} (${route.label})`).toBeLessThan(500);

      const body = await page.textContent('body').catch(() => '');
      expect(
        body?.includes('Application error: a client-side exception has occurred'),
        `unhandled error overlay on ${route.path} (${route.label})`,
      ).toBe(false);
    }
  });
});
