import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Proxy /api/v1 requests to the backend
  if (pathname.startsWith('/api/v1')) {
    // Get the backend URL from environment variable
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://api:4000/api/v1';

    // Remove /api/v1 prefix and forward to backend. Built by string
    // concatenation rather than `new URL(forwardPath, backendUrl)` — a
    // forwardPath starting with '/' would otherwise resolve against
    // backendUrl's origin and silently drop its own path (e.g. the
    // '/api/v1' suffix baked into backendUrl), per the WHATWG URL spec's
    // handling of absolute-path relative references.
    const forwardPath = pathname.slice('/api/v1'.length);
    const targetUrl = new URL(backendUrl.replace(/\/$/, '') + forwardPath);

    // Copy query parameters
    targetUrl.search = request.nextUrl.search;

    // Create a new request to the backend
    const newRequest = new NextRequest(targetUrl, {
      method: request.method,
      headers: new Headers(request.headers),
      body: request.body,
    });

    // Remove Host header to let the destination set it
    newRequest.headers.delete('host');

    return fetch(newRequest).then((response) => {
      // Create a new response with the same status and body
      // The backend already sets its own CORS headers, scoped to the
      // configured CORS_ORIGIN allowlist — pass them through as-is rather
      // than overwriting them with a wildcard here.
      const newResponse = new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: new Headers(response.headers),
      });

      return newResponse;
    });
  }

  // Clickjacking protection for every page except the embeddable petition
  // widget, which exists specifically to be framed by third-party sites.
  const response = NextResponse.next();
  const isEmbedRoute = /^\/petitions\/[^/]+\/embed$/.test(pathname);
  if (!isEmbedRoute) {
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('Content-Security-Policy', "frame-ancestors 'self'");
  }
  return response;
}

export const config = {
  // Covers /api/v1/* (the proxy branch above) and every page route (the
  // framing-headers branch below) in one matcher — Next.js excludes nothing
  // by default, so static assets are carved out explicitly.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
