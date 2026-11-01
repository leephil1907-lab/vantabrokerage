import Link from 'next/link';
import { Screener } from '@/components/markets/screener';
import { NewsFeed } from '@/components/markets/news-feed';
import { MarketSessions } from '@/components/markets/market-sessions';
import { Section } from '@/components/marketing-ui';
import { Magnetic, MaskLine } from '@/components/motion/primitives';
import { ShaderHero } from '@/components/three/shader-hero';

export const metadata = { title: 'Global market screener · PRIMEVEST' };

export default function ScreenerPage() {
  return <>
    <section className="relative overflow-hidden border-b border-white/[0.07]">
      <ShaderHero />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-ink-950/60 to-transparent" />
      <div className="shell relative pt-10 sm:pt-14">
      <p className="eyebrow"><span className="story-dot" /> Research tools</p>
      <h1 className="display mt-2 text-[30px] sm:text-[38px]"><MaskLine>Global market screener</MaskLine></h1>
      <p className="mt-3 max-w-2xl text-[13.5px] leading-relaxed text-muted">
        Scan thousands of listed stocks, crypto pairs, currencies and CFDs by momentum, activity, size and
        technical rating — powered by TradingView&apos;s public scanner.
      </p>
      <div className="mt-5 flex flex-wrap gap-3 pb-10 sm:pb-14">
        <Magnetic strength={0.22}><Link href="/markets" className="btn-ghost px-4 py-2.5 text-[12px]">← All markets</Link></Magnetic>
        <Magnetic strength={0.22}><Link href="/register" className="btn-primary px-4 py-2.5 text-[12px]">Create account</Link></Magnetic>
      </div>
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
