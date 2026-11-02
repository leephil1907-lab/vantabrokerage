import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono, Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { RouteProgress } from '@/components/motion/page-transition';

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

export const metadata: Metadata = {
  title: {
    default: 'PRIMEVEST — Multi-asset brokerage, forex, CFDs and crypto',
    template: '%s · PRIMEVEST',
  },
  description:
    'PRIMEVEST is a multi-asset brokerage platform: forex, CFDs, short-expiry CALL/PUT, crypto spot and perpetual futures — with a unified wallet, full portfolio accounting and an audit-logged back office.',
  applicationName: 'PRIMEVEST',
  robots: {
    index: false, follow: false, nocache: true,
    googleBot: { index: false, follow: false, noarchive: true, nosnippet: true, noimageindex: true },
  },
  openGraph: {
    title: 'PRIMEVEST — Multi-asset brokerage terminal',
    description: 'Forex, CFDs, short-expiry, crypto spot and perpetual futures in one multi-asset terminal.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0908',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${plexMono.variable} ${playfair.variable}`}>
      <body className="min-h-screen antialiased">
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('primevest.theme');if(t==='light'||t==='dark'){document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t}}catch(e){}})();` }} />
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-lime focus:px-4 focus:py-2 focus:text-ink-950">Skip to content</a>
        <RouteProgress />
        {children}
      </body>
    </html>
  );
}
