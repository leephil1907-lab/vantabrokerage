import { LiveMarketTable } from '@/components/live-market-table';
import { CTASection, PageHero, Section, FeatureGrid } from '@/components/marketing-ui';

export const metadata = { title: 'Forex trading' };
export const dynamic = 'force-dynamic';

export default function ForexPage() {
  return (
    <>
      <PageHero
        eyebrow="Forex"
        title="Trade the majors with server-side execution"
        body="EUR/USD, GBP/USD, USD/JPY, USD/CHF, AUD/USD, USD/CAD and NZD/USD. Orders are priced from a server-fetched quote, never from the browser, and every fill is written to an execution record with the quote timestamp."
      >
        <div className="flex flex-wrap gap-2">
          {['Market orders', 'Limit orders', 'Stop orders', 'Stop-loss', 'Take-profit', '2–200× leverage'].map((t) => <span key={t} className="chip">{t}</span>)}
        </div>
      </PageHero>
      <Section title="Live majors" body="Spreads are modelled per asset class and applied to the provider mid; bid and ask are shown separately.">
        <LiveMarketTable category="FOREX" />
      </Section>
      <Section title="How the terminal works" body="A professional multi-panel layout with a persistent watchlist, candlestick charts, indicators, drawing tools and a bottom activity tray.">
        <FeatureGrid items={[
          { title: 'Charting', body: '1m to 1D candles aggregated from provider data, EMA/SMA overlays, volume, crosshair inspection and horizontal price drawings.' },
          { title: 'Order handling', body: 'Market orders fill immediately at the quoted side; limit and stop orders reserve margin until the background worker triggers them.' },
          { title: 'Risk controls', body: 'Margin ratio, liquidation price and protective exits are recomputed by the risk engine against live marks.' },
          { title: 'Position management', body: 'Partial and full closes, take-profit/stop-loss editing, realised P/L captured in the ledger.' },
          { title: 'Account separation', body: 'Paper and live balances are separate accounts with separate ledgers — never mixed.' },
          { title: 'Auditability', body: 'Every fill records venue, price, fee, quantity and quote timestamp for reconciliation.' },
        ]} />
      </Section>
      <CTASection title="Open the forex terminal" body="Your paper account is funded automatically so you can test the full order lifecycle immediately." primary={{ href: '/register', label: 'Create account' }} secondary={{ href: '/login', label: 'Sign in' }} />
    </>
  );
}
