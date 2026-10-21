import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/login', '/profile', '/settings', '/tools/trading'],
    },
    sitemap: 'https://slwen.cn/sitemap.xml',
    host: 'https://slwen.cn',
  };
}
