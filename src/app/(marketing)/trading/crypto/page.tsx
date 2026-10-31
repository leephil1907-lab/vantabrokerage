import Link from 'next/link';
import { PageHero, Section, StatBand, Split, FeatureGrid, Callout, CTASection, SpecTable } from '@/components/marketing-ui';
import { LiveMarketTable } from '@/components/live-market-table';
import { Accordion } from '@/components/accordion';

export const metadata = { title: 'Crypto spot trading' };
export const dynamic = 'force-dynamic';

const FAQS = [
  { q: 'Which crypto markets are listed?', a: 'Eleven USDT markets: BTC, ETH, SOL, XRP, LTC, DOGE, BNB, ADA, TRX, USDC and USDT. The live table below is generated from the platform’s instrument configuration, so it always matches what the terminals allow.' },
  { q: 'How are balances held?', a: 'Crypto bought on spot is recorded as holdings per asset, and cash leg movements post through the double-entry ledger. Selling reserves the base asset first, then credits the quote asset on fill.' },
  { q: 'Can I deposit crypto?', a: 'Yes, when deposit addresses are configured for the deployment. You submit the transaction hash and the platform verifies it with the configured explorer provider; without one, the deposit queues for finance review instead of pretending to credit itself.' },
  { q: 'Is this an exchange order book?', a: 'No. The depth ladder in the terminal is a labelled model around the live top of book from the connected provider. It is explicitly marked as a model so it is never mistaken for exchange-native depth.' },
];

export default function CryptoPage() {
  return (
    <>
      <PageHero
        eyebrow="Crypto spot"
        title="Spot crypto with holdings and locked-balance accounting"
        body="Eleven USDT markets with reserved-balance settlement, per-asset holdings and on-chain deposit verification. Prices come from Kraken and Coinbase; if a feed is stale the platform says so instead of guessing."
        breadcrumbs={[{ href: '/markets', label: 'Markets' }, { label: 'Crypto spot' }]}
        symbol="BTC/USDT"
        badge="11 markets"
        aside={<StatBand items={[
          { k: '11', label: 'USDT markets', sub: 'majors + stablecoins' },
          { k: '2', label: 'Price providers', sub: 'Kraken · Coinbase' },
          { k: 'on-chain', label: 'Deposit checks', sub: 'mempool · Etherscan · TronGrid' },
          { k: '24/7', label: 'Availability', sub: 'unlike FX sessions' },
        ]} />}
      />
      <Section eyebrow="Live quotes" title="Spot markets" body="Every quote is stamped with its provider and fetch time; stale rows are labelled." aside={<Link href="/dashboard/crypto" className="btn-ghost px-4 py-2 text-[12.5px]">Open the desk →</Link>}>
        <LiveMarketTable category="SPOT" limit={12} />
      </Section>
      <Section eyebrow="Accounting" title="How a spot trade settles">
        <Split
          left={<FeatureGrid cols={2} items={[
            { title: 'Reserve, then settle', body: 'A buy reserves quote balance; a sell reserves base holdings. Settlement credits the opposite leg atomically.' },
            { title: 'Holdings ledger', body: 'Asset balances are tracked per asset and reconciled against ledger entries, not stored as free-floating numbers.' },
            { title: 'Fees recorded', body: 'Taker fees are captured per execution with the venue and quote timestamp.' },
            { title: 'Deposit verification', body: 'Transaction hashes are checked against the configured explorer before any credit is posted.' },
          ]} />}
          right={
            <div className="space-y-3">
              <SpecTable
                columns={['Flow', 'Reserved', 'Credited']}
                rows={[
                  ['Buy', 'Quote asset', 'Base asset (minus fee)'],
                  ['Sell', 'Base asset', 'Quote asset (minus fee)'],
                  ['Deposit', '—', 'Asset after verification'],
                  ['Withdrawal', 'Asset locked', 'Paid on txHash'],
                ]}
                caption="Locked balances are always visible next to available balances in the wallet."
              />
              <Callout tone="info" title="Depth is a model">
                The order-book ladder in the terminal is generated around the live top of book and labelled as a model — not exchange-native depth.
              </Callout>
            </div>
          }
        />
      </Section>
      <Section eyebrow="Questions" title="Crypto spot FAQ" tight><Accordion items={FAQS} /></Section>
      <CTASection title="Buy your first crypto on paper" body="Practise buying, selling and tracking holdings with simulated funds, then switch to live once your account is verified." primary={{ href: '/register', label: 'Create account' }} secondary={{ href: '/deposits-withdrawals', label: 'Funding methods' }} />
    </>
  );
}
