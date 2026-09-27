/**
 * Full inventory of API v1 routes, used by route-inventory.e2e-spec.ts to
 * smoke-test the whole route surface in one sweep.
 *
 * Categories decide how a route is exercised — see the safety rules in
 * route-inventory.e2e-spec.ts:
 *  - public-read       anonymous GET, expected 2xx (or documented alt status)
 *  - auth-read         GET requiring a user JWT; no token must 401
 *  - admin-read        GET requiring ADMIN role; no token must 401,
 *                      non-admin user token must 403
 *  - guard-only-write  mutating route; verified for correct guard behavior
 *                      only (no token -> 401/403; token + garbage body ->
 *                      400/403), the actual mutation is never submitted
 *  - execute-once      safe, cheap, cleanable mutation actually performed
 *                      once with the throwaway test account
 *  - public-write-safe anonymous mutating route that's an idempotent-safe
 *                      beacon/no-op on bad input (analytics pings, tracking
 *                      pixels) — safe to actually hit
 *  - webhook           signature/HMAC-verified webhook receiver; verified
 *                      that a bad/missing signature is rejected cleanly
 *
 * `param` entries name a path placeholder and how the spec resolves it to a
 * real value at run time (see resolveParams() in the spec file). A route
 * with an unresolvable param on a route that needs one for a meaningful
 * check is marked `paramFallback: 'fake'`, meaning a syntactically-valid but
 * nonexistent id is used instead (still exercises 404-vs-500 handling).
 */

export type RouteCategory =
  | 'public-read'
  | 'auth-read'
  | 'admin-read'
  | 'guard-only-write'
  | 'execute-once'
  | 'public-write-safe'
  | 'webhook';

export interface RouteEntry {
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  path: string;
  controller: string;
  category: RouteCategory;
  paramFallback?: 'fake' | 'skip';
  note?: string;
}

export const ROUTE_INVENTORY: RouteEntry[] = [
  // app.controller.ts
  { method: 'GET', path: '/', controller: 'AppController', category: 'public-read' },

  // activity/activity-log.controller.ts
  { method: 'GET', path: '/admin/activity-logs', controller: 'ActivityLogController', category: 'admin-read' },
  { method: 'GET', path: '/admin/activity-logs/user/:userId', controller: 'ActivityLogController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'GET', path: '/admin/activity-logs/export', controller: 'ActivityLogController', category: 'admin-read' },
  { method: 'GET', path: '/admin/activity-logs/stats', controller: 'ActivityLogController', category: 'admin-read' },

  // admin/admin.controller.ts
  { method: 'GET', path: '/admin/petitions/pending', controller: 'AdminController', category: 'admin-read' },
  { method: 'GET', path: '/admin/polls/pending', controller: 'AdminController', category: 'admin-read' },
  { method: 'GET', path: '/admin/id-documents/pending', controller: 'AdminController', category: 'admin-read' },
  { method: 'GET', path: '/admin/users', controller: 'AdminController', category: 'admin-read' },
  { method: 'DELETE', path: '/admin/petitions/:id', controller: 'AdminController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'PATCH', path: '/admin/id-documents/:id', controller: 'AdminController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'GET', path: '/admin/fraud/flags', controller: 'AdminController', category: 'admin-read' },
  { method: 'GET', path: '/admin/social-media/dashboard', controller: 'AdminController', category: 'admin-read' },
  { method: 'GET', path: '/admin/social-media/facebook/health', controller: 'AdminController', category: 'admin-read' },
  { method: 'GET', path: '/admin/social-media/facebook/pixel-stats', controller: 'AdminController', category: 'admin-read' },
  { method: 'GET', path: '/admin/social-media/whatsapp/health', controller: 'AdminController', category: 'admin-read' },
  { method: 'GET', path: '/admin/social-media/whatsapp/growth-metrics', controller: 'AdminController', category: 'admin-read' },
  { method: 'GET', path: '/admin/social-media/whatsapp/campaign-stats', controller: 'AdminController', category: 'admin-read' },

  // admin/admin-settings.controller.ts
  { method: 'GET', path: '/admin/settings/moderator-scopes', controller: 'AdminSettingsController', category: 'admin-read' },
  { method: 'POST', path: '/admin/settings/moderator-scopes/:userId', controller: 'AdminSettingsController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'GET', path: '/admin/settings/permission-templates', controller: 'AdminSettingsController', category: 'admin-read' },
  { method: 'POST', path: '/admin/settings/permission-templates', controller: 'AdminSettingsController', category: 'admin-read' },
  { method: 'DELETE', path: '/admin/settings/permission-templates/:id', controller: 'AdminSettingsController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'GET', path: '/admin/settings/social-media', controller: 'AdminSettingsController', category: 'admin-read' },
  { method: 'PATCH', path: '/admin/settings/social-media', controller: 'AdminSettingsController', category: 'admin-read' },
  { method: 'GET', path: '/admin/settings/system', controller: 'AdminSettingsController', category: 'admin-read' },
  { method: 'PATCH', path: '/admin/settings/system', controller: 'AdminSettingsController', category: 'admin-read' },

  // admin/system-settings.controller.ts
  { method: 'GET', path: '/settings/system', controller: 'SystemSettingsController', category: 'public-read' },

  // admin/facebook-admin.controller.ts
  { method: 'GET', path: '/admin/facebook/dashboard', controller: 'FacebookAdminController', category: 'admin-read' },
  { method: 'GET', path: '/admin/facebook/pixel-events', controller: 'FacebookAdminController', category: 'admin-read' },
  { method: 'GET', path: '/admin/facebook/share-links', controller: 'FacebookAdminController', category: 'admin-read' },
  { method: 'GET', path: '/admin/facebook/share-links/:id', controller: 'FacebookAdminController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'GET', path: '/admin/facebook/pixel-config', controller: 'FacebookAdminController', category: 'admin-read' },
  { method: 'PATCH', path: '/admin/facebook/pixel-config', controller: 'FacebookAdminController', category: 'admin-read' },
  { method: 'POST', path: '/admin/facebook/pixel/test-event', controller: 'FacebookAdminController', category: 'admin-read' },
  { method: 'GET', path: '/admin/facebook/badges', controller: 'FacebookAdminController', category: 'admin-read' },
  { method: 'GET', path: '/admin/facebook/badges/:type/stats', controller: 'FacebookAdminController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'GET', path: '/admin/facebook/challenges', controller: 'FacebookAdminController', category: 'admin-read' },
  { method: 'GET', path: '/admin/facebook/challenges/:id', controller: 'FacebookAdminController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'GET', path: '/admin/facebook/analytics', controller: 'FacebookAdminController', category: 'admin-read' },

  // admin/stripe-admin.controller.ts
  { method: 'GET', path: '/admin/stripe/dashboard', controller: 'StripeAdminController', category: 'admin-read' },
  { method: 'GET', path: '/admin/stripe/payments', controller: 'StripeAdminController', category: 'admin-read' },
  { method: 'GET', path: '/admin/stripe/payments/:id', controller: 'StripeAdminController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'GET', path: '/admin/stripe/subscriptions', controller: 'StripeAdminController', category: 'admin-read' },
  { method: 'GET', path: '/admin/stripe/subscriptions/:id', controller: 'StripeAdminController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'PATCH', path: '/admin/stripe/subscriptions/:id/cancel', controller: 'StripeAdminController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'GET', path: '/admin/stripe/refunds', controller: 'StripeAdminController', category: 'admin-read' },
  { method: 'POST', path: '/admin/stripe/refunds', controller: 'StripeAdminController', category: 'admin-read' },
  { method: 'GET', path: '/admin/stripe/analytics', controller: 'StripeAdminController', category: 'admin-read' },
  { method: 'GET', path: '/admin/stripe/webhooks/health', controller: 'StripeAdminController', category: 'admin-read' },
  { method: 'GET', path: '/admin/stripe/customers/:userId', controller: 'StripeAdminController', category: 'admin-read', paramFallback: 'fake' },

  // ambassadors/ambassadors.controller.ts
  { method: 'POST', path: '/ambassadors/apply', controller: 'AmbassadorsController', category: 'guard-only-write' },
  { method: 'GET', path: '/ambassadors/admin', controller: 'AmbassadorsController', category: 'admin-read' },
  { method: 'GET', path: '/ambassadors/admin/:id', controller: 'AmbassadorsController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'PATCH', path: '/ambassadors/admin/:id', controller: 'AmbassadorsController', category: 'admin-read', paramFallback: 'fake' },

  // analytics/analytics.controller.ts
  { method: 'GET', path: '/analytics/funnel/:petitionId', controller: 'AnalyticsController', category: 'auth-read', note: 'petitionId from petitions list' },
  { method: 'GET', path: '/analytics/petition/:petitionId', controller: 'AnalyticsController', category: 'auth-read', note: 'petitionId from petitions list' },
  { method: 'GET', path: '/analytics/user/:userId', controller: 'AnalyticsController', category: 'auth-read', note: 'own test user id' },
  { method: 'GET', path: '/analytics/shares/:petitionId', controller: 'AnalyticsController', category: 'auth-read', note: 'petitionId from petitions list' },
  { method: 'GET', path: '/analytics/donations', controller: 'AnalyticsController', category: 'auth-read' },
  { method: 'GET', path: '/analytics/dashboard/overview', controller: 'AnalyticsController', category: 'auth-read' },
  { method: 'GET', path: '/analytics/audience/:petitionId', controller: 'AnalyticsController', category: 'auth-read', note: 'petitionId from petitions list' },
  { method: 'GET', path: '/analytics/activity/peak', controller: 'AnalyticsController', category: 'auth-read' },
  { method: 'GET', path: '/analytics/trending', controller: 'AnalyticsController', category: 'auth-read' },
  { method: 'GET', path: '/analytics/export/petition/:petitionId', controller: 'AnalyticsController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'GET', path: '/analytics/platform-stats', controller: 'AnalyticsController', category: 'admin-read' },
  { method: 'GET', path: '/analytics/daily-metrics', controller: 'AnalyticsController', category: 'admin-read' },
  { method: 'GET', path: '/analytics/category-stats', controller: 'AnalyticsController', category: 'admin-read' },
  { method: 'GET', path: '/analytics/fraud-stats', controller: 'AnalyticsController', category: 'admin-read' },
  { method: 'GET', path: '/analytics/geographic-insights', controller: 'AnalyticsController', category: 'admin-read' },
  { method: 'GET', path: '/analytics/messages', controller: 'AnalyticsController', category: 'admin-read' },
  { method: 'GET', path: '/analytics/broadcasts', controller: 'AnalyticsController', category: 'admin-read' },

  // auth/auth.controller.ts
  { method: 'POST', path: '/auth/signup', controller: 'AuthController', category: 'guard-only-write', note: 'phone signup path; not used for the throwaway account' },
  { method: 'POST', path: '/auth/login', controller: 'AuthController', category: 'guard-only-write' },
  { method: 'POST', path: '/auth/otp/request', controller: 'AuthController', category: 'guard-only-write', note: 'would send a real SMS via Twilio — never execute' },
  { method: 'POST', path: '/auth/otp/verify', controller: 'AuthController', category: 'guard-only-write' },
  { method: 'POST', path: '/auth/signup/email', controller: 'AuthController', category: 'execute-once', note: 'creates the one throwaway test account' },
  { method: 'POST', path: '/auth/login/email', controller: 'AuthController', category: 'execute-once', note: 'logs in the throwaway test account' },
  { method: 'POST', path: '/auth/send-verification-email', controller: 'AuthController', category: 'guard-only-write' },
  { method: 'POST', path: '/auth/verify-email', controller: 'AuthController', category: 'guard-only-write' },
  { method: 'POST', path: '/auth/resend-verification-email', controller: 'AuthController', category: 'guard-only-write' },
  { method: 'POST', path: '/auth/forgot-password', controller: 'AuthController', category: 'guard-only-write', note: 'would email a reset link to the throwaway account — fine to actually hit once, but not looped' },
  { method: 'POST', path: '/auth/validate-reset-token', controller: 'AuthController', category: 'guard-only-write' },
  { method: 'POST', path: '/auth/reset-password', controller: 'AuthController', category: 'guard-only-write' },
  { method: 'GET', path: '/auth/google', controller: 'AuthController', category: 'guard-only-write', note: 'OAuth redirect; expect 302/3xx not 500' },
  { method: 'GET', path: '/auth/google/callback', controller: 'AuthController', category: 'guard-only-write', note: 'no real OAuth code available; expect 400/401 not 500' },
  { method: 'POST', path: '/auth/google/callback', controller: 'AuthController', category: 'guard-only-write' },

  // broadcast/broadcast.controller.ts
  { method: 'POST', path: '/admin/broadcast/group/:groupId', controller: 'BroadcastController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'POST', path: '/admin/broadcast/groups/batch', controller: 'BroadcastController', category: 'admin-read' },
  { method: 'POST', path: '/admin/broadcast/petition/:petitionId', controller: 'BroadcastController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'GET', path: '/admin/broadcast/group/:groupId/history', controller: 'BroadcastController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'GET', path: '/admin/broadcast/petition/:petitionId/stats', controller: 'BroadcastController', category: 'admin-read', paramFallback: 'fake' },

  // cms/cms.controller.ts
  { method: 'GET', path: '/cms/public/pages/:slug', controller: 'CMSController', category: 'public-read', note: 'slug: about' },
  { method: 'POST', path: '/cms/blocks/:blockId/track-view', controller: 'CMSController', category: 'public-write-safe', paramFallback: 'fake' },
  { method: 'POST', path: '/cms/blocks/:blockId/track-click', controller: 'CMSController', category: 'public-write-safe', paramFallback: 'fake' },
  { method: 'GET', path: '/cms/pages', controller: 'CMSController', category: 'admin-read' },
  { method: 'GET', path: '/cms/pages/:id', controller: 'CMSController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'POST', path: '/cms/pages', controller: 'CMSController', category: 'admin-read' },
  { method: 'PATCH', path: '/cms/pages/:id', controller: 'CMSController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'DELETE', path: '/cms/pages/:id', controller: 'CMSController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'GET', path: '/cms/templates', controller: 'CMSController', category: 'admin-read' },
  { method: 'GET', path: '/cms/templates/:id', controller: 'CMSController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'POST', path: '/cms/templates', controller: 'CMSController', category: 'admin-read' },
  { method: 'PATCH', path: '/cms/templates/:id', controller: 'CMSController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'DELETE', path: '/cms/templates/:id', controller: 'CMSController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'PATCH', path: '/cms/blocks/:blockId', controller: 'CMSController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'DELETE', path: '/cms/blocks/:blockId', controller: 'CMSController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'POST', path: '/cms/files/upload', controller: 'CMSController', category: 'admin-read' },
  { method: 'GET', path: '/cms/files', controller: 'CMSController', category: 'admin-read' },
  { method: 'PATCH', path: '/cms/files/:fileId', controller: 'CMSController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'DELETE', path: '/cms/files/:fileId', controller: 'CMSController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'GET', path: '/cms/pages/:pageId/blocks', controller: 'CMSController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'POST', path: '/cms/pages/:pageId/blocks', controller: 'CMSController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'GET', path: '/cms/pages/:pageId/versions', controller: 'CMSController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'GET', path: '/cms/versions/:versionId', controller: 'CMSController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'POST', path: '/cms/versions/:versionId/restore', controller: 'CMSController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'GET', path: '/cms/versions/:versionId1/compare/:versionId2', controller: 'CMSController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'PATCH', path: '/cms/pages/:pageId/draft', controller: 'CMSController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'POST', path: '/cms/pages/:pageId/publish', controller: 'CMSController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'POST', path: '/cms/pages/:pageId/unpublish', controller: 'CMSController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'POST', path: '/cms/pages/:pageId/schedule', controller: 'CMSController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'GET', path: '/cms/pages/:pageId/schedules', controller: 'CMSController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'GET', path: '/cms/schedules/upcoming', controller: 'CMSController', category: 'admin-read' },
  { method: 'DELETE', path: '/cms/schedules/:scheduleId', controller: 'CMSController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'GET', path: '/cms/blocks/:blockId/analytics', controller: 'CMSController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'GET', path: '/cms/pages/:pageId/analytics', controller: 'CMSController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'GET', path: '/cms/blocks/:blockId/compare-variants', controller: 'CMSController', category: 'admin-read', paramFallback: 'fake' },

  // contact-directory/admin-directory.controller.ts
  { method: 'POST', path: '/admin/directory/institutions', controller: 'AdminDirectoryController', category: 'admin-read' },
  { method: 'GET', path: '/admin/directory/institutions', controller: 'AdminDirectoryController', category: 'admin-read' },
  { method: 'GET', path: '/admin/directory/institutions/:id', controller: 'AdminDirectoryController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'PATCH', path: '/admin/directory/institutions/:id', controller: 'AdminDirectoryController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'POST', path: '/admin/directory/institutions/:id/verify', controller: 'AdminDirectoryController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'DELETE', path: '/admin/directory/institutions/:id', controller: 'AdminDirectoryController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'POST', path: '/admin/directory/institutions/:institutionId/departments', controller: 'AdminDirectoryController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'GET', path: '/admin/directory/institutions/:institutionId/departments', controller: 'AdminDirectoryController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'GET', path: '/admin/directory/departments/:id', controller: 'AdminDirectoryController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'PATCH', path: '/admin/directory/departments/:id', controller: 'AdminDirectoryController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'DELETE', path: '/admin/directory/departments/:id', controller: 'AdminDirectoryController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'POST', path: '/admin/directory/institutions/:institutionId/contacts', controller: 'AdminDirectoryController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'GET', path: '/admin/directory/institutions/:institutionId/contacts', controller: 'AdminDirectoryController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'GET', path: '/admin/directory/contacts/:id', controller: 'AdminDirectoryController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'PATCH', path: '/admin/directory/contacts/:id', controller: 'AdminDirectoryController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'DELETE', path: '/admin/directory/contacts/:id', controller: 'AdminDirectoryController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'GET', path: '/admin/directory/search/by-tags', controller: 'AdminDirectoryController', category: 'admin-read' },
  { method: 'GET', path: '/admin/directory/routing/stats', controller: 'AdminDirectoryController', category: 'admin-read' },
  { method: 'POST', path: '/admin/directory/import/upload', controller: 'AdminDirectoryController', category: 'admin-read' },
  { method: 'GET', path: '/admin/directory/import/template', controller: 'AdminDirectoryController', category: 'admin-read' },
  { method: 'GET', path: '/admin/directory/import/stats', controller: 'AdminDirectoryController', category: 'admin-read' },
  { method: 'POST', path: '/admin/directory/petitions/:petitionId/routing/override', controller: 'AdminDirectoryController', category: 'admin-read', paramFallback: 'fake' },

  // endorsements
  { method: 'GET', path: '/admin/endorsements/pending', controller: 'AdminEndorsementsController', category: 'admin-read' },
  { method: 'PATCH', path: '/admin/endorsements/:id/approve', controller: 'AdminEndorsementsController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'PATCH', path: '/admin/endorsements/:id/reject', controller: 'AdminEndorsementsController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'GET', path: '/petitions/:petitionId/endorsements', controller: 'EndorsementsController', category: 'public-read', note: 'petitionId from petitions list' },
  { method: 'POST', path: '/petitions/:petitionId/endorsements', controller: 'EndorsementsController', category: 'guard-only-write', note: 'petitionId from petitions list' },

  // feedback
  { method: 'POST', path: '/feedback', controller: 'FeedbackController', category: 'execute-once', note: 'goes to an internal review inbox, not publicly visible' },

  // facebook/challenge.controller.ts
  { method: 'GET', path: '/challenges/active', controller: 'ChallengeController', category: 'public-read' },
  { method: 'GET', path: '/challenges/active/:petitionId', controller: 'ChallengeController', category: 'public-read', paramFallback: 'fake' },
  { method: 'GET', path: '/challenges/user', controller: 'ChallengeController', category: 'auth-read' },
  { method: 'POST', path: '/challenges/track-progress', controller: 'ChallengeController', category: 'guard-only-write' },
  { method: 'GET', path: '/challenges/:challengeId/leaderboard', controller: 'ChallengeController', category: 'public-read', paramFallback: 'fake' },
  { method: 'GET', path: '/challenges/user/history', controller: 'ChallengeController', category: 'auth-read' },
  { method: 'POST', path: '/challenges/create', controller: 'ChallengeController', category: 'guard-only-write' },
  { method: 'GET', path: '/challenges/petition/:petitionId/summary', controller: 'ChallengeController', category: 'public-read', paramFallback: 'fake' },

  // facebook/facebook.controller.ts
  { method: 'GET', path: '/facebook/sdk-init', controller: 'FacebookController', category: 'public-read' },
  { method: 'GET', path: '/facebook/pixel', controller: 'FacebookController', category: 'public-read' },
  { method: 'GET', path: '/facebook/og-meta/:petitionId', controller: 'FacebookController', category: 'public-read', note: 'petitionId from petitions list' },
  { method: 'GET', path: '/facebook/share-dialog/:petitionId', controller: 'FacebookController', category: 'public-read', note: 'petitionId from petitions list' },
  { method: 'POST', path: '/facebook/record-share', controller: 'FacebookController', category: 'guard-only-write' },
  { method: 'POST', path: '/facebook/track-view', controller: 'FacebookController', category: 'public-write-safe' },
  { method: 'POST', path: '/facebook/track-lead', controller: 'FacebookController', category: 'public-write-safe' },
  { method: 'POST', path: '/facebook/track-share', controller: 'FacebookController', category: 'public-write-safe' },
  { method: 'POST', path: '/facebook/track-purchase', controller: 'FacebookController', category: 'public-write-safe' },
  { method: 'GET', path: '/facebook/pixel-stats/:petitionId', controller: 'FacebookController', category: 'public-read', note: 'petitionId from petitions list' },
  { method: 'POST', path: '/facebook/create-audience', controller: 'FacebookController', category: 'guard-only-write' },
  { method: 'POST', path: '/facebook/validate-url', controller: 'FacebookController', category: 'public-write-safe' },
  { method: 'GET', path: '/facebook/share-count', controller: 'FacebookController', category: 'public-read' },
  { method: 'GET', path: '/facebook/health', controller: 'FacebookController', category: 'public-read' },
  { method: 'POST', path: '/facebook/share', controller: 'FacebookController', category: 'guard-only-write' },
  { method: 'POST', path: '/facebook/track/:shortCode', controller: 'FacebookController', category: 'public-write-safe', paramFallback: 'fake' },
  { method: 'GET', path: '/facebook/pixel-report', controller: 'FacebookController', category: 'public-read' },

  // facebook/badge.controller.ts
  { method: 'GET', path: '/badges', controller: 'BadgeController', category: 'public-read' },
  { method: 'GET', path: '/badges/user/:userId', controller: 'BadgeController', category: 'public-read', note: 'own test user id' },
  { method: 'GET', path: '/badges/progress/:userId/:petitionId/:badgeType', controller: 'BadgeController', category: 'auth-read', paramFallback: 'fake' },
  { method: 'GET', path: '/badges/leaderboard', controller: 'BadgeController', category: 'public-read' },
  { method: 'GET', path: '/badges/petition/:petitionId', controller: 'BadgeController', category: 'public-read', note: 'petitionId from petitions list' },

  // fraud/fraud.controller.ts
  { method: 'GET', path: '/fraud/rules', controller: 'FraudController', category: 'admin-read' },
  { method: 'PATCH', path: '/fraud/rules/:key', controller: 'FraudController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'GET', path: '/fraud/analytics', controller: 'FraudController', category: 'admin-read' },
  { method: 'POST', path: '/fraud/jobs/anomaly-scan', controller: 'FraudController', category: 'admin-read' },
  { method: 'POST', path: '/fraud/jobs/process-next', controller: 'FraudController', category: 'admin-read' },
  { method: 'GET', path: '/fraud/metrics', controller: 'FraudController', category: 'admin-read' },

  // government/government.controller.ts
  { method: 'POST', path: '/government/submit', controller: 'GovernmentController', category: 'guard-only-write' },
  { method: 'GET', path: '/government/status/:petitionId', controller: 'GovernmentController', category: 'public-read', note: 'petitionId from petitions list' },
  { method: 'GET', path: '/government/report/:petitionId', controller: 'GovernmentController', category: 'public-read', note: 'petitionId from petitions list' },
  { method: 'GET', path: '/government/report/:petitionId/csv', controller: 'GovernmentController', category: 'auth-read', note: 'petitionId from petitions list' },
  { method: 'GET', path: '/government/submissions', controller: 'GovernmentController', category: 'auth-read' },
  { method: 'GET', path: '/government/contacts', controller: 'GovernmentController', category: 'public-read' },
  { method: 'POST', path: '/government/contacts', controller: 'GovernmentController', category: 'admin-read' },
  { method: 'POST', path: '/government/status/:petitionId', controller: 'GovernmentController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'GET', path: '/government/stats', controller: 'GovernmentController', category: 'admin-read' },

  // membership/membership.controller.ts
  { method: 'GET', path: '/membership/count', controller: 'MembershipController', category: 'public-read' },
  { method: 'GET', path: '/membership/me', controller: 'MembershipController', category: 'auth-read' },
  { method: 'POST', path: '/membership/join', controller: 'MembershipController', category: 'execute-once', note: 'paired with DELETE /membership/leave right after' },
  { method: 'DELETE', path: '/membership/leave', controller: 'MembershipController', category: 'execute-once', note: 'cleans up the join above' },

  // moderator/moderator.controller.ts
  { method: 'GET', path: '/moderator/petitions', controller: 'ModeratorController', category: 'auth-read', note: 'authorization is manual inside the method, not a guard; expect a clean 403, not 500' },
  { method: 'GET', path: '/moderator/scope', controller: 'ModeratorController', category: 'auth-read' },
  { method: 'GET', path: '/moderator/stats', controller: 'ModeratorController', category: 'auth-read' },
  { method: 'GET', path: '/moderator/fraud-flags', controller: 'ModeratorController', category: 'auth-read' },
  { method: 'POST', path: '/moderator/petitions/:id/approve', controller: 'ModeratorController', category: 'guard-only-write', paramFallback: 'fake' },
  { method: 'POST', path: '/moderator/petitions/:id/reject', controller: 'ModeratorController', category: 'guard-only-write', paramFallback: 'fake' },
  { method: 'POST', path: '/moderator/fraud-flags/:id/resolve', controller: 'ModeratorController', category: 'guard-only-write', paramFallback: 'fake' },

  // messages/messages.controller.ts
  { method: 'GET', path: '/messages/inbox', controller: 'MessagesController', category: 'auth-read' },
  { method: 'GET', path: '/messages/unread-count', controller: 'MessagesController', category: 'auth-read' },
  { method: 'POST', path: '/messages', controller: 'MessagesController', category: 'guard-only-write' },
  { method: 'GET', path: '/messages/:id', controller: 'MessagesController', category: 'auth-read', paramFallback: 'fake' },
  { method: 'GET', path: '/messages/:id/thread', controller: 'MessagesController', category: 'auth-read', paramFallback: 'fake' },
  { method: 'PUT', path: '/messages/:id/read', controller: 'MessagesController', category: 'guard-only-write', paramFallback: 'fake' },
  { method: 'PUT', path: '/messages/mark-read/bulk', controller: 'MessagesController', category: 'guard-only-write' },
  { method: 'PUT', path: '/messages/:id/archive', controller: 'MessagesController', category: 'guard-only-write', paramFallback: 'fake' },
  { method: 'DELETE', path: '/messages/:id', controller: 'MessagesController', category: 'guard-only-write', paramFallback: 'fake' },
  { method: 'GET', path: '/messages/search/query', controller: 'MessagesController', category: 'auth-read' },

  // notifications/notifications.controller.ts — KNOWN BUG: double-prefixed
  { method: 'GET', path: '/api/v1/notifications', controller: 'NotificationsController', category: 'auth-read', note: 'BUG: @Controller declares its own api/v1 prefix on top of the global one — actual path is /api/v1/api/v1/notifications. Verify the bug (this path 404s) and that NotificationController below covers the intended path.' },

  // notifications/notification.controller.ts
  { method: 'GET', path: '/notifications', controller: 'NotificationController', category: 'auth-read' },
  { method: 'GET', path: '/notifications/unread-count', controller: 'NotificationController', category: 'auth-read' },
  { method: 'PATCH', path: '/notifications/:id/read', controller: 'NotificationController', category: 'guard-only-write', paramFallback: 'fake' },
  { method: 'POST', path: '/notifications/mark-all-read', controller: 'NotificationController', category: 'guard-only-write' },
  { method: 'PATCH', path: '/notifications/:id/archive', controller: 'NotificationController', category: 'guard-only-write', paramFallback: 'fake' },
  { method: 'DELETE', path: '/notifications/:id', controller: 'NotificationController', category: 'guard-only-write', paramFallback: 'fake' },
  { method: 'GET', path: '/notifications/preferences', controller: 'NotificationController', category: 'auth-read' },
  { method: 'POST', path: '/notifications/preferences', controller: 'NotificationController', category: 'guard-only-write' },

  // officials/*
  { method: 'GET', path: '/admin/officials/pending', controller: 'AdminOfficialsController', category: 'admin-read' },
  { method: 'PATCH', path: '/admin/officials/:institutionId/approve', controller: 'AdminOfficialsController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'PATCH', path: '/admin/officials/:institutionId/reject', controller: 'AdminOfficialsController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'POST', path: '/officials/apply', controller: 'OfficialsController', category: 'guard-only-write' },
  { method: 'GET', path: '/officials/claimable', controller: 'OfficialsController', category: 'auth-read' },
  { method: 'POST', path: '/officials/claim', controller: 'OfficialsController', category: 'guard-only-write' },
  { method: 'GET', path: '/officials/me', controller: 'OfficialsController', category: 'auth-read' },
  { method: 'PATCH', path: '/officials/me/profile', controller: 'OfficialsController', category: 'guard-only-write' },
  { method: 'GET', path: '/officials/me/dashboard', controller: 'OfficialsController', category: 'auth-read' },
  { method: 'GET', path: '/officials/me/constituency', controller: 'OfficialsController', category: 'auth-read' },
  { method: 'GET', path: '/officials/me/feed', controller: 'OfficialsController', category: 'auth-read' },
  { method: 'GET', path: '/officials/me/inbox', controller: 'OfficialsController', category: 'auth-read' },
  { method: 'POST', path: '/officials/responses/:responseId/advance', controller: 'OfficialsController', category: 'guard-only-write', paramFallback: 'fake' },
  { method: 'GET', path: '/officials/responses/:petitionId', controller: 'OfficialsController', category: 'public-read', note: 'petitionId from petitions list' },
  { method: 'GET', path: '/officials/staff', controller: 'OfficialStaffController', category: 'auth-read' },
  { method: 'PATCH', path: '/officials/staff/:staffId', controller: 'OfficialStaffController', category: 'guard-only-write', paramFallback: 'fake' },
  { method: 'POST', path: '/officials/staff/:staffId/revoke', controller: 'OfficialStaffController', category: 'guard-only-write', paramFallback: 'fake' },
  { method: 'GET', path: '/officials/staff/invites/mine', controller: 'OfficialStaffController', category: 'auth-read' },
  { method: 'POST', path: '/officials/staff/invites/:staffId/accept', controller: 'OfficialStaffController', category: 'guard-only-write', paramFallback: 'fake' },
  { method: 'POST', path: '/officials/staff/invite', controller: 'OfficialStaffController', category: 'guard-only-write' },
  { method: 'GET', path: '/official/:slug', controller: 'OfficialProfileController', category: 'public-read', paramFallback: 'fake' },

  // payments/payment.controller.ts
  { method: 'POST', path: '/payments/intent', controller: 'PaymentController', category: 'guard-only-write' },
  { method: 'POST', path: '/payments/confirm/:intentId', controller: 'PaymentController', category: 'guard-only-write', paramFallback: 'fake' },
  { method: 'POST', path: '/payments/checkout', controller: 'PaymentController', category: 'guard-only-write' },
  { method: 'GET', path: '/payments/status/:intentId', controller: 'PaymentController', category: 'auth-read', paramFallback: 'fake' },
  { method: 'POST', path: '/payments/subscription', controller: 'PaymentController', category: 'guard-only-write' },
  { method: 'PUT', path: '/payments/subscription/:subscriptionId', controller: 'PaymentController', category: 'guard-only-write', paramFallback: 'fake' },
  { method: 'DELETE', path: '/payments/subscription/:subscriptionId', controller: 'PaymentController', category: 'guard-only-write', paramFallback: 'fake' },
  { method: 'GET', path: '/payments/history/:userId', controller: 'PaymentController', category: 'auth-read', note: 'own test user id' },
  { method: 'POST', path: '/payments/refund/:paymentId', controller: 'PaymentController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'POST', path: '/payments/create', controller: 'PaymentController', category: 'guard-only-write' },
  { method: 'POST', path: '/payments/subscription/create', controller: 'PaymentController', category: 'guard-only-write' },
  { method: 'POST', path: '/payments/momo/webhook', controller: 'PaymentController', category: 'webhook' },
  { method: 'GET', path: '/payments/momo/balance', controller: 'PaymentController', category: 'admin-read' },
  { method: 'POST', path: '/payments/validate-phone', controller: 'PaymentController', category: 'guard-only-write' },
  { method: 'POST', path: '/payments/webhook', controller: 'PaymentController', category: 'webhook', note: 'Stripe — the raw-body stream bug fixed this session' },

  // polls/polls.controller.ts + voting.controller.ts
  { method: 'POST', path: '/polls', controller: 'PollsController', category: 'admin-read' },
  { method: 'POST', path: '/polls/submit', controller: 'PollsController', category: 'guard-only-write' },
  { method: 'POST', path: '/polls/:id/approve', controller: 'PollsController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'POST', path: '/polls/:id/reject', controller: 'PollsController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'GET', path: '/polls', controller: 'PollsController', category: 'public-read' },
  { method: 'GET', path: '/polls/trending', controller: 'PollsController', category: 'public-read' },
  { method: 'GET', path: '/polls/slug/:slug', controller: 'PollsController', category: 'public-read', note: 'slug from polls list' },
  { method: 'GET', path: '/polls/:id/results', controller: 'PollsController', category: 'public-read', note: 'id from polls list' },
  { method: 'GET', path: '/polls/:id', controller: 'PollsController', category: 'public-read', note: 'id from polls list' },
  { method: 'GET', path: '/polls/:id/geographic-breakdown', controller: 'PollsController', category: 'public-read', note: 'id from polls list' },
  { method: 'DELETE', path: '/polls/:id', controller: 'PollsController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'POST', path: '/polls/:pollId/vote', controller: 'VotingController', category: 'guard-only-write', note: 'never cast a real vote — garbage body only', paramFallback: 'fake' },

  // push/push.controller.ts
  { method: 'GET', path: '/push/vapid-public-key', controller: 'PushController', category: 'public-read' },
  { method: 'POST', path: '/push/subscribe', controller: 'PushController', category: 'guard-only-write' },
  { method: 'POST', path: '/push/unsubscribe', controller: 'PushController', category: 'guard-only-write' },

  // rbac/rbac.controller.ts
  { method: 'GET', path: '/rbac/roles', controller: 'RbacController', category: 'admin-read' },
  { method: 'GET', path: '/rbac/users/:userId/roles', controller: 'RbacController', category: 'admin-read', note: 'own test user id' },
  { method: 'POST', path: '/rbac/users/:userId/roles/:roleId', controller: 'RbacController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'DELETE', path: '/rbac/users/:userId/roles/:roleId', controller: 'RbacController', category: 'admin-read', paramFallback: 'fake' },

  // sms/sms-inbound.controller.ts
  { method: 'POST', path: '/sms/inbound', controller: 'SmsInboundController', category: 'webhook' },

  // signatures/signatures.controller.ts
  { method: 'GET', path: '/signatures/:petitionId/has-signed', controller: 'SignaturesController', category: 'public-read', note: 'petitionId from petitions list' },
  { method: 'POST', path: '/signatures', controller: 'SignaturesController', category: 'guard-only-write', note: 'never sign a real petition — garbage body only' },

  // sponsors
  { method: 'GET', path: '/sponsors', controller: 'SponsorsController', category: 'public-read' },
  { method: 'GET', path: '/admin/sponsors', controller: 'AdminSponsorsController', category: 'admin-read' },
  { method: 'POST', path: '/admin/sponsors', controller: 'AdminSponsorsController', category: 'admin-read' },
  { method: 'PATCH', path: '/admin/sponsors/:id', controller: 'AdminSponsorsController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'DELETE', path: '/admin/sponsors/:id', controller: 'AdminSponsorsController', category: 'admin-read', paramFallback: 'fake' },

  // stakeholder-groups
  { method: 'GET', path: '/admin/stakeholder-groups/petition/:petitionId', controller: 'StakeholderGroupController', category: 'admin-read', note: 'petitionId from petitions list' },
  { method: 'GET', path: '/admin/stakeholder-groups/group/:groupId/members', controller: 'StakeholderGroupController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'GET', path: '/admin/stakeholder-groups/petition/:petitionId/summary', controller: 'StakeholderGroupController', category: 'admin-read', note: 'petitionId from petitions list' },
  { method: 'DELETE', path: '/admin/stakeholder-groups/group/:groupId/members/:userId', controller: 'StakeholderGroupController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'GET', path: '/admin/stakeholder-groups/group/:groupId/members/:userId/check', controller: 'StakeholderGroupController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'POST', path: '/admin/stakeholder-groups/group/:groupId/members', controller: 'StakeholderGroupController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'POST', path: '/admin/stakeholder-groups/group/:groupId/members/bulk', controller: 'StakeholderGroupController', category: 'admin-read', paramFallback: 'fake' },

  // supporters/supporters.controller.ts
  { method: 'GET', path: '/supporters/count', controller: 'SupportersController', category: 'public-read' },
  { method: 'POST', path: '/supporters/join', controller: 'SupportersController', category: 'guard-only-write', note: 'would inflate a real public counter — never execute' },
  { method: 'POST', path: '/supporters/update-contact', controller: 'SupportersController', category: 'guard-only-write' },

  // users/users.controller.ts
  { method: 'GET', path: '/users/me', controller: 'UsersController', category: 'auth-read' },
  { method: 'PATCH', path: '/users/me', controller: 'UsersController', category: 'execute-once', note: 'harmless profile-field update on our own disposable test account' },
  { method: 'PATCH', path: '/users/me/password', controller: 'UsersController', category: 'guard-only-write', note: 'never actually change the password — would break subsequent auth calls' },
  { method: 'GET', path: '/users/me/petitions', controller: 'UsersController', category: 'auth-read' },

  // whatsapp/growth.controller.ts
  { method: 'GET', path: '/growth/trending', controller: 'GrowthController', category: 'public-read' },
  { method: 'GET', path: '/growth/leaderboard/:county', controller: 'GrowthController', category: 'public-read', note: 'county: Montserrado' },
  { method: 'GET', path: '/growth/petition/:petitionId/metrics', controller: 'GrowthController', category: 'public-read', note: 'petitionId from petitions list' },
  { method: 'GET', path: '/growth/petition/:petitionId/milestones', controller: 'GrowthController', category: 'public-read', note: 'petitionId from petitions list' },
  { method: 'GET', path: '/growth/petition/:petitionId/government-readiness', controller: 'GrowthController', category: 'public-read', note: 'petitionId from petitions list' },
  { method: 'GET', path: '/growth/petition/:petitionId/share-trigger', controller: 'GrowthController', category: 'public-read', note: 'petitionId from petitions list' },
  { method: 'POST', path: '/growth/petition/:petitionId/check-milestone', controller: 'GrowthController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'POST', path: '/growth/petition/:petitionId/recalculate-milestones', controller: 'GrowthController', category: 'admin-read', paramFallback: 'fake' },

  // whatsapp/whatsapp.controller.ts
  { method: 'POST', path: '/whatsapp/generate-message', controller: 'WhatsAppController', category: 'public-write-safe' },
  { method: 'POST', path: '/whatsapp/create-referral', controller: 'WhatsAppController', category: 'guard-only-write' },
  { method: 'GET', path: '/whatsapp/share-link/:shortCode', controller: 'WhatsAppController', category: 'public-read', paramFallback: 'fake' },
  { method: 'POST', path: '/whatsapp/track-conversion', controller: 'WhatsAppController', category: 'guard-only-write' },
  { method: 'GET', path: '/whatsapp/metrics/:petitionId', controller: 'WhatsAppController', category: 'public-read', note: 'petitionId from petitions list' },
  { method: 'GET', path: '/whatsapp/referral/:referralCode', controller: 'WhatsAppController', category: 'public-read', paramFallback: 'fake' },
  { method: 'GET', path: '/whatsapp/my-referrals', controller: 'WhatsAppController', category: 'auth-read' },

  // verification/verification.controller.ts
  { method: 'GET', path: '/verification/completed', controller: 'VerificationController', category: 'auth-read' },
  { method: 'POST', path: '/verification/phone/request-otp', controller: 'VerificationController', category: 'guard-only-write', note: 'sends a real SMS via Twilio — never execute' },
  { method: 'POST', path: '/verification/phone/verify-otp', controller: 'VerificationController', category: 'guard-only-write' },
  { method: 'POST', path: '/verification/phone', controller: 'VerificationController', category: 'guard-only-write' },
  { method: 'POST', path: '/verification/geo', controller: 'VerificationController', category: 'guard-only-write' },
  { method: 'POST', path: '/verification/device', controller: 'VerificationController', category: 'guard-only-write' },
  { method: 'GET', path: '/verification/id-documents/:id/file', controller: 'VerificationController', category: 'auth-read', paramFallback: 'fake' },
  { method: 'POST', path: '/verification/id-document', controller: 'VerificationController', category: 'guard-only-write' },
  { method: 'POST', path: '/verification/id', controller: 'VerificationController', category: 'guard-only-write' },

  // petitions/petitions.controller.ts
  { method: 'GET', path: '/petitions', controller: 'PetitionsController', category: 'public-read' },
  { method: 'GET', path: '/petitions/trending', controller: 'PetitionsController', category: 'public-read' },
  { method: 'GET', path: '/petitions/stats', controller: 'PetitionsController', category: 'public-read' },
  { method: 'GET', path: '/petitions/browse/all', controller: 'PetitionsController', category: 'public-read' },
  { method: 'GET', path: '/petitions/:id/updates', controller: 'PetitionsController', category: 'public-read', note: 'id from petitions list' },
  { method: 'GET', path: '/petitions/:id/comments', controller: 'PetitionsController', category: 'public-read', note: 'id from petitions list' },
  { method: 'GET', path: '/petitions/media/:filename', controller: 'PetitionsController', category: 'public-read', paramFallback: 'fake' },
  { method: 'GET', path: '/petitions/:id', controller: 'PetitionsController', category: 'public-read', note: 'id from petitions list' },
  { method: 'GET', path: '/petitions/:id/signature-breakdown', controller: 'PetitionsController', category: 'public-read', note: 'id from petitions list' },
  { method: 'GET', path: '/petitions/:id/community-insights', controller: 'PetitionsController', category: 'public-read', note: 'id from petitions list' },
  { method: 'GET', path: '/petitions/:id/report/csv', controller: 'PetitionsController', category: 'public-read', note: 'id from petitions list' },
  { method: 'GET', path: '/petitions/:id/report/excel', controller: 'PetitionsController', category: 'public-read', note: 'id from petitions list' },
  { method: 'GET', path: '/petitions/:id/report/pdf', controller: 'PetitionsController', category: 'public-read', note: 'id from petitions list' },
  { method: 'GET', path: '/petitions/:id/share-link', controller: 'PetitionsController', category: 'public-read', note: 'id from petitions list' },
  { method: 'GET', path: '/petitions/:id/is-creator', controller: 'PetitionsController', category: 'public-read', note: 'optional auth; id from petitions list' },
  { method: 'POST', path: '/petitions', controller: 'PetitionsController', category: 'guard-only-write' },
  { method: 'POST', path: '/petitions/:id/updates', controller: 'PetitionsController', category: 'guard-only-write', paramFallback: 'fake' },
  { method: 'POST', path: '/petitions/:id/comments', controller: 'PetitionsController', category: 'guard-only-write', paramFallback: 'fake' },
  { method: 'PATCH', path: '/petitions/:id', controller: 'PetitionsController', category: 'guard-only-write', paramFallback: 'fake' },
  { method: 'GET', path: '/petitions/:id/follow', controller: 'PetitionsController', category: 'auth-read', paramFallback: 'fake' },
  { method: 'POST', path: '/petitions/:id/follow', controller: 'PetitionsController', category: 'guard-only-write', paramFallback: 'fake' },
  { method: 'DELETE', path: '/petitions/:id/follow', controller: 'PetitionsController', category: 'guard-only-write', paramFallback: 'fake' },
  { method: 'POST', path: '/petitions/:id/media', controller: 'PetitionsController', category: 'guard-only-write', paramFallback: 'fake' },
  { method: 'PATCH', path: '/petitions/:id/approve', controller: 'PetitionsController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'PATCH', path: '/petitions/:id/reject', controller: 'PetitionsController', category: 'admin-read', paramFallback: 'fake' },
  { method: 'GET', path: '/petitions/:id/status-log', controller: 'PetitionsController', category: 'public-read', note: 'id from petitions list' },
  { method: 'GET', path: '/petitions/:id/live', controller: 'PetitionsController', category: 'public-read', note: 'SSE endpoint — assert connection opens (2xx + text/event-stream), then close; do not wait for stream to end', paramFallback: 'skip' },

  // email/controllers/email.controller.ts
  { method: 'GET', path: '/email/track/open/:emailLogId/:pixelId', controller: 'EmailController', category: 'public-write-safe', paramFallback: 'fake' },
  { method: 'GET', path: '/email/track/click/:emailLogId/:linkId', controller: 'EmailController', category: 'public-write-safe', paramFallback: 'fake' },
  { method: 'GET', path: '/email/unsubscribe/:userId/:token', controller: 'EmailController', category: 'public-read', paramFallback: 'fake' },
  { method: 'GET', path: '/email/preferences', controller: 'EmailController', category: 'auth-read' },
  { method: 'PATCH', path: '/email/preferences', controller: 'EmailController', category: 'guard-only-write' },
  { method: 'GET', path: '/email/logs', controller: 'EmailController', category: 'auth-read' },
  { method: 'GET', path: '/admin/email/stats', controller: 'AdminEmailController', category: 'admin-read' },
  { method: 'GET', path: '/admin/email/queue-stats', controller: 'AdminEmailController', category: 'admin-read' },
  { method: 'POST', path: '/admin/email/verify-domain', controller: 'AdminEmailController', category: 'admin-read' },
  { method: 'GET', path: '/admin/email/health', controller: 'AdminEmailController', category: 'admin-read' },

  // email/webhooks/mailersend-webhook.controller.ts
  { method: 'POST', path: '/webhooks/mailersend', controller: 'MailerSendWebhookController', category: 'webhook' },
];
