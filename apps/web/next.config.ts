import type { NextConfig } from 'next';

// /api/v1/* is proxied by middleware.ts, not by a rewrite here — that
// handler needs to run regardless (it preserves multiple Set-Cookie
// headers and strips the stale Content-Encoding/Content-Length left after
// fetch() auto-decompresses), and it always matches this path first, so a
// rewrite for the same path would be unreachable dead code.
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
};

export default nextConfig;
