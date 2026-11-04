import type { MetadataRoute } from 'next';

/**
 * Search privacy switch. Pre-launch (default) crawlers are asked to stay out
 * entirely. At public launch set PUBLIC_INDEXABLE=true in the Render web
 * environment and redeploy: robots.txt opens up, the site-wide noindex
 * metadata lifts and the X-Robots-Tag header stops being sent.
 */
export default function robots(): MetadataRoute.Robots {
  const base = process.env.APP_URL ?? 'https://primevest-web.onrender.com';
  if (process.env.PUBLIC_INDEXABLE === 'true') {
    return {
      rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/admin', '/dashboard', '/wallet'] }],
      sitemap: `${base}/sitemap.xml`,
    };
  }
  const social = [
    'Twitterbot', 'facebookexternalhit', 'Facebot', 'LinkedInBot', 'Slackbot',
    'Slack-ImgProxy', 'TelegramBot', 'WhatsApp', 'Discordbot', 'Pinterestbot',
    'Iframely', 'Embedly', 'SkypeUriPreview', 'ViberBot', 'Applebot',
  ];
  return {
    rules: [
      { userAgent: '*', disallow: ['/'] },
      ...social.map((userAgent) => ({ userAgent, allow: ['/'] })),
    ],
  };
}
