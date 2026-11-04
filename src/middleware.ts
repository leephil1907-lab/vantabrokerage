import { NextResponse, type NextRequest } from 'next/server';

/**
 * Pre-launch privacy vs. rich link previews.
 * Search engines stay fully blocked (robots.txt Disallow / + X-Robots-Tag
 * noindex on every response). Social/platform unfurlers are exempt from the
 * X-Robots-Tag so WhatsApp, X/Twitter, LinkedIn, Slack, Telegram, Discord and
 * iMessage can read the OpenGraph tags and render the share card — they never
 * index the site, they only preview the shared link.
 */
const SOCIAL_CRAWLERS = [
  'twitterbot',
  'facebookexternalhit',
  'fbexternalhit',
  'facebot',
  'linkedinbot',
  'slackbot',
  'slack-imgproxy',
  'telegrambot',
  'whatsapp',
  'discordbot',
  'pinterestbot',
  'iframely',
  'embedly',
  'skypeuripreview',
  'viberbot',
  'applebot',          // Safari/iMessage reader previews
  'googlebot-image',   // not a search indexer for our purposes
];

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  if (process.env.PUBLIC_INDEXABLE === 'true') return response;
  const ua = (request.headers.get('user-agent') ?? '').toLowerCase();
  const isSocial = SOCIAL_CRAWLERS.some((token) => ua.includes(token));
  if (!isSocial) {
    response.headers.set(
      'X-Robots-Tag',
      'noindex, nofollow, noarchive, nosnippet, noimageindex'
    );
  }
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpe?g|webp|svg|gif|ico|woff2?)$).*)'],
};
