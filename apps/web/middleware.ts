import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Proxy /api/v1 requests to the backend
  if (pathname.startsWith('/api/v1')) {
    // Get the backend URL from environment variable
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://api:4000/api/v1';
    
    // Remove /api/v1 prefix and forward to backend
    const forwardPath = pathname.slice('/api/v1'.length) || '';
    const targetUrl = new URL(forwardPath, backendUrl);

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
      const newResponse = new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: new Headers(response.headers),
      });

      // Allow CORS
      newResponse.headers.set('Access-Control-Allow-Origin', '*');
      newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      return newResponse;
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/v1/:path*'],
};
