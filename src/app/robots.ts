import { MetadataRoute } from 'next';
import { getSiteOriginOrThrow } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteOriginOrThrow();

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/', '/settings/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
