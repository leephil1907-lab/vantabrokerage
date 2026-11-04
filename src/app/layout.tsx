import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono, Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { RouteProgress } from '@/components/motion/page-transition';
import { ServiceWorkerRegistrar } from '@/components/service-worker-registrar';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
  adjustFontFallback: true,
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-display',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-mono',
});

const APP_BASE = process.env.APP_URL ?? 'https://primevest-web.onrender.com';

export const metadata: Metadata = {
  metadataBase: new URL(APP_BASE),
  title: {
    default: 'PRIMEVEST — Multi-asset brokerage, forex, CFDs and crypto',
    template: '%s · PRIMEVEST',
  },
  description:
    'PRIMEVEST is a multi-asset brokerage platform: forex, CFDs, short-expiry CALL/PUT, crypto spot and perpetual futures — with a unified wallet, full portfolio accounting and an audit-logged back office.',
  applicationName: 'PRIMEVEST',
  alternates: { canonical: '/' },
  robots: process.env.PUBLIC_INDEXABLE === 'true'
    ? { index: true, follow: true }
    : {
        index: false, follow: false, nocache: true,
        googleBot: { index: false, follow: false, noarchive: true, nosnippet: true, noimageindex: true },
      },
  openGraph: {
    title: 'PRIMEVEST — Multi-asset brokerage terminal',
    description: 'Forex, CFDs, short-expiry, crypto spot and perpetual futures in one multi-asset terminal.',
    type: 'website',
    url: APP_BASE,
    siteName: 'PRIMEVEST',
    locale: 'en_US',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'PRIMEVEST — Precision, in every fill.' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PRIMEVEST — Multi-asset brokerage terminal',
    description: 'Forex, CFDs, short-expiry, crypto spot and perpetual futures in one multi-asset terminal.',
    images: ['/og.png'],
  },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'PRIMEVEST' },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: '#0a0e16',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${plexMono.variable} ${playfair.variable}`}>
      <body className="min-h-screen antialiased">
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('primevest.theme');if(t==='light'||t==='dark'){document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t}}catch(e){}})();` }} />
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-lime focus:px-4 focus:py-2 focus:text-ink-950">Skip to content</a>
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <RouteProgress />
        <ServiceWorkerRegistrar />
        {children}
      </body>
    </html>
  );
}
