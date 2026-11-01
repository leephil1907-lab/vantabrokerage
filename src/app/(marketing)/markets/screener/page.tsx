import Link from 'next/link';
import { Screener } from '@/components/markets/screener';
import { NewsFeed } from '@/components/markets/news-feed';
import { MarketSessions } from '@/components/markets/market-sessions';
import { Section } from '@/components/marketing-ui';

export const metadata = { title: 'Global market screener · PRIMEVEST' };

export default function ScreenerPage() {
  return <>
    <section className="shell pt-10 sm:pt-14">
      <p className="eyebrow">Research tools</p>
      <h1 className="display mt-2 text-[30px] sm:text-[38px]">Global market screener</h1>
      <p className="mt-3 max-w-2xl text-[13.5px] leading-relaxed text-muted">
        Scan thousands of listed stocks, crypto pairs, currencies and CFDs by momentum, activity, size and
        technical rating. Results come from TradingView&apos;s public scanner as reference data — they are
        not PRIMEVEST executable quotes, and availability depends on the upstream provider.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link href="/markets" className="btn-ghost px-4 py-2.5 text-[12px]">← All markets</Link>
        <Link href="/register" className="btn-primary px-4 py-2.5 text-[12px]">Create account</Link>
      </div>
    </section>
    <section className="shell pt-8 sm:pt-10">
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2"><Screener /></div>
        <div className="space-y-4">
          <NewsFeed title="Top market headlines" />
          <NewsFeed title="Crypto wire" category="crypto" />
        </div>
      </div>
    </section>
    <Section eyebrow="Trading hours" title="Session clock" body="Check which currency centres are in window before acting on screener results."><MarketSessions /></Section>
  </>;
}
