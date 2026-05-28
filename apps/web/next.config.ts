import type { NextConfig } from 'next';

const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.RAILWAY_API_URL || 'https://api-production-8873.up.railway.app/api/v1';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/api/v1/:path*',
          destination: `${backendUrl}/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
