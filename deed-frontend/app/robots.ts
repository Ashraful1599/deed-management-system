import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard',
          '/admin',
          '/login',
          '/register',
          '/forgot-password',
        ],
      },
    ],
    sitemap: 'https://dolilbd.com/sitemap.xml',
  };
}
