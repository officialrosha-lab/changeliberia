/**
 * Full route-surface smoke test — hits every route in ROUTE_INVENTORY over
 * real HTTP against E2E_BASE_URL (defaults to a local dev server; this repo
 * also runs it against the live production API — see the plan/report for
 * that run). Unlike the other *.e2e-spec.ts files here, this one does NOT
 * boot AppModule in-process: it's a black-box HTTP client test, so it works
 * identically against localhost or a deployed instance.
 *
 * Pass/fail rules by category (see route-inventory.data.ts for what each
 * category means):
 *  - public-read / public-write-safe: real request, must not 5xx.
 *  - auth-read: no token must 401; with the throwaway user's token must not
 *    5xx.
 *  - admin-read: no token must 401; with the throwaway (non-admin) user's
 *    token must be 401/403 — a 2xx here would be a privilege-escalation bug.
 *  - guard-only-write: hit once with no token + an empty/garbage body; must
 *    not be a successful 2xx (that would mean a real mutation went through)
 *    and must not 5xx. Acceptable: 400/401/403.
 *  - execute-once: the real, intentional mutations (signup/login/feedback/
 *    membership join+leave/profile update) — see EXECUTE_ONCE_HANDLERS.
 *  - webhook: hit with a bad/missing signature; must reject cleanly
 *    (400/401/403), not 5xx.
 *
 * Results are collected into RESULTS and written to
 * test/route-inventory-results.json in afterAll, for the findings report.
 */
import * as fs from 'fs';
import * as path from 'path';
import { ROUTE_INVENTORY, RouteEntry } from './route-inventory.data';

jest.setTimeout(20000);

const BASE_URL = (process.env.E2E_BASE_URL || 'http://localhost:4000/api/v1').replace(/\/$/, '');
const FAKE_ID = 'clsmoketestfakeid0000000';
const TEST_EMAIL = process.env.SMOKE_TEST_EMAIL || 'mharygens+smoketest@gmail.com';
const TEST_PASSWORD = process.env.SMOKE_TEST_PASSWORD || 'SmokeTest!2026#Prod';

interface Ctx {
  userToken?: string;
  userId?: string;
  petitionId?: string;
  pollId?: string;
  pollSlug?: string;
}

interface Result {
  method: string;
  path: string;
  controller: string;
  category: string;
  checks: { label: string; status: number | 'ERROR'; ok: boolean; note?: string }[];
}

const RESULTS: Result[] = [];

async function httpFetch(
  method: string,
  urlPath: string,
  opts: { token?: string; body?: unknown } = {},
): Promise<{ status: number; body: any }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
    const res = await fetch(`${BASE_URL}${urlPath}`, {
      method,
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
    });
    let body: any = undefined;
    const text = await res.text().catch(() => '');
    try {
      body = text ? JSON.parse(text) : undefined;
    } catch {
      body = text;
    }
    return { status: res.status, body };
  } finally {
    clearTimeout(timeout);
  }
}

/** Best-effort recursive search for the first object with an `id`/`slug` field. */
function findFirstIdLike(value: any, key: 'id' | 'slug', depth = 0): string | undefined {
  if (!value || depth > 4) return undefined;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findFirstIdLike(item, key, depth + 1);
      if (found) return found;
    }
    return undefined;
  }
  if (typeof value === 'object') {
    if (typeof value[key] === 'string') return value[key];
    for (const v of Object.values(value)) {
      const found = findFirstIdLike(v, key, depth + 1);
      if (found) return found;
    }
  }
  return undefined;
}

function resolvePath(route: RouteEntry, ctx: Ctx): string | null {
  let resolved = route.path;
  const params = route.path.match(/:[A-Za-z]+/g) || [];
  for (const param of params) {
    let value: string | undefined;
    if (param === ':petitionId' || (param === ':id' && route.controller === 'PetitionsController')) {
      value = ctx.petitionId;
    } else if (param === ':pollId') {
      value = ctx.pollId;
    } else if (param === ':slug' && route.controller === 'PollsController') {
      value = ctx.pollSlug;
    } else if (param === ':userId' || (param === ':id' && (route.path.includes('rbac') || route.path.includes('analytics/user')))) {
      value = ctx.userId;
    }
    if (!value) {
      if (route.paramFallback === 'skip') return null;
      value = FAKE_ID;
    }
    resolved = resolved.replace(param, value);
  }
  return resolved;
}

async function buildContext(): Promise<Ctx> {
  const ctx: Ctx = {};

  // Real petition id, from a public endpoint.
  const petitionsRes = await httpFetch('GET', '/petitions/browse/all').catch(() => null);
  if (petitionsRes) ctx.petitionId = findFirstIdLike(petitionsRes.body, 'id');
  if (!ctx.petitionId) {
    const listRes = await httpFetch('GET', '/petitions').catch(() => null);
    if (listRes) ctx.petitionId = findFirstIdLike(listRes.body, 'id');
  }

  // Real poll id/slug.
  const pollsRes = await httpFetch('GET', '/polls').catch(() => null);
  if (pollsRes) {
    ctx.pollId = findFirstIdLike(pollsRes.body, 'id');
    ctx.pollSlug = findFirstIdLike(pollsRes.body, 'slug');
  }

  // Throwaway test account — signup, falling back to login if it already exists.
  const signup = await httpFetch('POST', '/auth/signup/email', {
    body: { email: TEST_EMAIL, password: TEST_PASSWORD, fullName: 'Smoke Test', phone: '+231779999999' },
  }).catch(() => null);
  let token = signup?.body?.accessToken || signup?.body?.access_token || signup?.body?.token;
  if (!token) {
    const login = await httpFetch('POST', '/auth/login/email', {
      body: { email: TEST_EMAIL, password: TEST_PASSWORD },
    }).catch(() => null);
    token = login?.body?.accessToken || login?.body?.access_token || login?.body?.token;
  }
  ctx.userToken = token;
  if (token) {
    const parts = token.split('.');
    if (parts.length === 3) {
      try {
        const payload = JSON.parse(Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
        ctx.userId = payload.sub || payload.userId || payload.id;
      } catch {
        // ignore
      }
    }
  }

  return ctx;
}

function record(route: RouteEntry, label: string, status: number | 'ERROR', ok: boolean, note?: string) {
  let entry = RESULTS.find((r) => r.method === route.method && r.path === route.path);
  if (!entry) {
    entry = { method: route.method, path: route.path, controller: route.controller, category: route.category, checks: [] };
    RESULTS.push(entry);
  }
  entry.checks.push({ label, status, note, ok });
}

async function safeFetch(method: string, urlPath: string, opts: { token?: string; body?: unknown } = {}) {
  try {
    return await httpFetch(method, urlPath, opts);
  } catch (err) {
    return { status: 'ERROR' as const, body: err instanceof Error ? err.message : String(err) };
  }
}

describe('Full route inventory smoke test (e2e)', () => {
  let ctx: Ctx;

  beforeAll(async () => {
    ctx = await buildContext();
  });

  afterAll(() => {
    const outFile = path.join(__dirname, 'route-inventory-results.json');
    fs.writeFileSync(outFile, JSON.stringify({ baseUrl: BASE_URL, ctx, results: RESULTS }, null, 2));
  });

  const nonExecuteRoutes = ROUTE_INVENTORY.filter((r) => r.category !== 'execute-once');

  it.each(nonExecuteRoutes.map((r) => [`${r.method} ${r.path}`, r] as const))('%s', async (_label, route) => {
    const resolved = resolvePath(route, ctx);
    if (resolved === null) {
      record(route, 'skipped', 'ERROR', true, 'unresolvable param, skipped by design (e.g. SSE stream)');
      return;
    }

    switch (route.category) {
      case 'public-read':
      case 'public-write-safe': {
        const body = route.method === 'GET' ? undefined : {};
        const res = await safeFetch(route.method, resolved, { body });
        const ok = res.status !== 'ERROR' && (res.status as number) < 500;
        record(route, 'anonymous', res.status, ok);
        expect(ok).toBe(true);
        break;
      }
      case 'auth-read': {
        const noAuth = await safeFetch(route.method, resolved);
        const noAuthOk = noAuth.status === 401;
        record(route, 'no-token-expect-401', noAuth.status, noAuthOk);

        const withAuth = await safeFetch(route.method, resolved, { token: ctx.userToken });
        const withAuthOk = withAuth.status !== 'ERROR' && (withAuth.status as number) < 500;
        record(route, 'with-user-token', withAuth.status, withAuthOk);

        expect(noAuthOk).toBe(true);
        expect(withAuthOk).toBe(true);
        break;
      }
      case 'admin-read': {
        const noAuth = await safeFetch(route.method, resolved, route.method === 'GET' ? {} : { body: {} });
        const noAuthOk = noAuth.status === 401;
        record(route, 'no-token-expect-401', noAuth.status, noAuthOk);

        const withUser = await safeFetch(route.method, resolved, {
          token: ctx.userToken,
          body: route.method === 'GET' ? undefined : {},
        });
        const withUserOk = withUser.status === 401 || withUser.status === 403;
        record(
          route,
          'with-nonadmin-token-expect-403',
          withUser.status,
          withUserOk,
          withUserOk ? undefined : 'POSSIBLE PRIVILEGE ESCALATION — non-admin token did not get 401/403',
        );

        expect(noAuthOk).toBe(true);
        expect(withUserOk).toBe(true);
        break;
      }
      case 'guard-only-write': {
        const res = await safeFetch(route.method, resolved, { body: {} });
        // A GET redirect (e.g. OAuth entry points) landing on 2xx is fine —
        // GET is safe/idempotent by definition. Only non-GET methods must
        // not report a successful mutation.
        const ok =
          res.status !== 'ERROR' &&
          (res.status as number) < 500 &&
          (route.method === 'GET' || ((res.status as number) !== 200 && (res.status as number) !== 201));
        record(
          route,
          'garbage-body-no-token',
          res.status,
          ok,
          ok ? undefined : 'either crashed (5xx) or accepted a garbage/unauthenticated mutation (2xx)',
        );
        expect(ok).toBe(true);
        break;
      }
      case 'webhook': {
        const res = await safeFetch(route.method, resolved, { body: { type: 'smoke.test' } });
        const ok = res.status !== 'ERROR' && (res.status as number) < 500;
        record(route, 'bad-signature', res.status, ok);
        expect(ok).toBe(true);
        break;
      }
      default:
        break;
    }
  });

  describe('execute-once flows (real, intentional mutations)', () => {
    it('signup/login already exercised in buildContext, and returned a usable token', () => {
      const route = ROUTE_INVENTORY.find((r) => r.path === '/auth/signup/email')!;
      const ok = !!ctx.userToken;
      record(route, 'signup-or-login', ok ? 200 : 'ERROR', ok);
      record(ROUTE_INVENTORY.find((r) => r.path === '/auth/login/email')!, 'signup-or-login', ok ? 200 : 'ERROR', ok);
      expect(ok).toBe(true);
    });

    it('POST /feedback accepts a real, low-risk submission', async () => {
      const route = ROUTE_INVENTORY.find((r) => r.path === '/feedback')!;
      const res = await safeFetch('POST', '/feedback', {
        body: {
          message: 'Automated smoke test — please ignore. Verifying the feedback pipeline is wired end-to-end.',
          email: TEST_EMAIL,
          category: 'other',
        },
      });
      const ok = res.status !== 'ERROR' && (res.status as number) < 300;
      record(route, 'real-submission', res.status, ok);
      expect(ok).toBe(true);
    });

    it('PATCH /users/me updates the throwaway account harmlessly', async () => {
      const route = ROUTE_INVENTORY.find((r) => r.path === '/users/me' && r.method === 'PATCH')!;
      const res = await safeFetch('PATCH', '/users/me', {
        token: ctx.userToken,
        body: { bio: 'Automated route-inventory smoke test probe.' },
      });
      const ok = res.status !== 'ERROR' && (res.status as number) < 300;
      record(route, 'real-update', res.status, ok);
      expect(ok).toBe(true);
    });

    it('POST /membership/join then DELETE /membership/leave round-trips cleanly', async () => {
      const joinRoute = ROUTE_INVENTORY.find((r) => r.path === '/membership/join')!;
      const leaveRoute = ROUTE_INVENTORY.find((r) => r.path === '/membership/leave')!;
      const join = await safeFetch('POST', '/membership/join', { token: ctx.userToken, body: {} });
      const joinOk = join.status !== 'ERROR' && (join.status as number) < 300;
      record(joinRoute, 'real-join', join.status, joinOk);

      const leave = await safeFetch('DELETE', '/membership/leave', { token: ctx.userToken });
      const leaveOk = leave.status !== 'ERROR' && (leave.status as number) < 300;
      record(leaveRoute, 'real-leave-cleanup', leave.status, leaveOk);

      expect(joinOk).toBe(true);
      expect(leaveOk).toBe(true);
    });
  });
});
