import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) return new NextResponse('Missing url', { status: 400 });

  try {
    const upstream = await fetch(url, { cache: 'force-cache' });
    if (!upstream.ok) return new NextResponse('Upstream error', { status: upstream.status });
    const buffer = await upstream.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': upstream.headers.get('content-type') ?? 'image/jpeg',
        'Cache-Control': 'public, max-age=86400, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return new NextResponse('Proxy failed', { status: 502 });
  }
}
