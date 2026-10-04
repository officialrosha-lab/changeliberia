/**
 * This API's own publicly-reachable base URL, used to build URLs for
 * served files (petition media, ID documents, CMS files, constituency
 * reports). Prefers an explicit override, then Railway's auto-injected
 * public domain for this service, then localhost for local dev.
 *
 * Without this, services previously fell back to a hardcoded
 * 'http://localhost:4000' in production whenever their own dedicated
 * override var wasn't set — which it never was — so every stored file URL
 * pointed at an address no browser outside the container could reach.
 */
export function apiPublicBaseUrl(override?: string): string {
  const explicit = override?.trim();
  if (explicit) return explicit.replace(/\/$/, '');

  const railwayDomain = process.env.RAILWAY_PUBLIC_DOMAIN?.trim();
  if (railwayDomain) return `https://${railwayDomain}`;

  return 'http://localhost:4000';
}
