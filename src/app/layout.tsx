import type { Metadata, Viewport } from 'next';
import './globals.css';

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
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
