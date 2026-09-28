import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://changeliberia.org';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/',
          '/moderator',
          '/cms',
          '/cms/',
          '/official/dashboard',
          '/government/submissions',
          '/dashboard',
          '/settings',
          '/notifications',
          '/messages',
          '/auth/change-password',
          '/auth/reset-password',
          '/auth/sessions',
          '/auth/verify-email',
          '/components-showcase',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
