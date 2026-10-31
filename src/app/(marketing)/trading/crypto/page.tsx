import { LiveMarketTable } from '@/components/live-market-table';
import { CTASection, PageHero, Section, FeatureGrid } from '@/components/marketing-ui';

export const metadata = { title: 'Crypto spot trading' };
export const dynamic = 'force-dynamic';

export default function CryptoPage() {
  return (
    <>
      <PageHero
        eyebrow="Crypto spot"
        title="Ten USDT markets with real balance reservation"
        body="BTC, ETH, SOL, XRP, LTC, DOGE, BNB, ADA, TRX and USDC against USDT. Buys debit cash and credit a holding; sells do the reverse — both posted as balanced ledger transactions."
      />
      <Section title="Live spot markets">
        <LiveMarketTable category="SPOT" />
      </Section>
      <Section title="Spot terminal capabilities">
        <FeatureGrid items={[
          { title: 'Order book & depth', body: 'Depth ladder derived from the live top-of-book quote, clearly labelled as a depth model rather than exchange-native depth.' },
          { title: 'Order management', body: 'Market and limit orders, open-order cancellation with automatic release of reserved balance.' },
          { title: 'Holdings accounting', body: 'Each asset is tracked per wallet with amount and locked quantity, valued from live prices in your portfolio.' },
          { title: 'Recent trades', body: 'A live print tape seeded from the provider quote, never fabricated history.' },
          { title: 'Market statistics', body: '24h high, low, change and volume straight from the provider response.' },
          { title: 'Portfolio view', body: 'Cash, holdings, margin and short-expiry exposure in a single allocation breakdown.' },
        ]} />
      </Section>
      <CTASection title="Buy your first crypto position" body="Spot trading works with your paper balance for testing, and your live balance once funded." primary={{ href: '/register', label: 'Create account' }} secondary={{ href: '/trading/futures', label: 'Explore futures' }} />
    </>
  );
}
