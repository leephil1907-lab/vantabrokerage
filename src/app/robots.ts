import type { MetadataRoute } from 'next';

/**
 * Pre-launch search privacy: crawlers are asked to stay out entirely.
 * Combined with the site-wide noindex metadata and the X-Robots-Tag
 * response header, no page, API or dashboard surface should enter a
 * search index. Flip to an allow-list only at public launch.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', disallow: ['/'] }],
  };
}
