import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono, Inter } from 'next/font/google';
import './globals.css';
import { RouteProgress } from '@/components/motion/page-transition';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
  adjustFontFallback: true,
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: {
    default: 'Vanta Markets — Multi-asset brokerage, forex, CFDs and crypto',
    template: '%s · Vanta Markets',
  },
  description:
    'Vanta Markets is a multi-asset brokerage platform: forex, CFDs, short-expiry CALL/PUT, crypto spot and perpetual futures — with a unified wallet, full portfolio accounting and an audited back office.',
  applicationName: 'Vanta Markets',
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Vanta Markets — Multi-asset brokerage terminal',
    description: 'Forex, CFDs, short-expiry, crypto spot and perpetual futures in one institutional-grade terminal.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#08090b',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${plexMono.variable}`}>
      <body className="min-h-screen antialiased">
        <RouteProgress />
        {children}
      </body>
    </html>
  );
}
