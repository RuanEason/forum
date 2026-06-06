import { MetadataRoute } from 'next';
import { resolveSiteOrigin } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = resolveSiteOrigin({ allowLocalhost: true }) || "http://localhost:3000";

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/', '/settings/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
