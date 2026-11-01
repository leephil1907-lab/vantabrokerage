import Link from 'next/link';
import { Magnetic, MaskLine, Reveal } from '@/components/motion/primitives';
import { ShaderHero } from '@/components/three/shader-hero';
import { AssetMark } from '@/components/asset-mark';
import { LiveMarketTable } from '@/components/live-market-table';
import { CryptoDiscovery } from '@/components/crypto-discovery';
import { MarketMovers } from '@/components/markets/market-movers';
import { NewsFeed } from '@/components/markets/news-feed';
import { CTASection } from '@/components/marketing-ui';
import { HeroScene } from '@/components/three/hero-scene';

export const metadata = { title: 'Markets' };
export const dynamic = 'force-dynamic';

const DESKS = [
  { href: '/trading/forex', symbol: 'EUR/USD', title: 'Forex', body: 'Explore currency pairs with a focused trading workspace.', tag: 'Currencies' },
  { href: '/trading/crypto', symbol: 'BTC/USDT', title: 'Crypto spot', body: 'Follow digital asset prices and market information.', tag: 'Digital assets' },
  { href: '/trading/futures', symbol: 'ETH/USDT', title: 'Perpetual futures', body: 'Learn about futures, market movements and risk.', tag: 'Derivatives' },
  { href: '/trading/cfd', symbol: 'XAUUSD', title: 'Indices & commodities', body: 'Follow major indices and commodity-linked markets.', tag: 'Multi-asset' },
];

export default function MarketsPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-white/[0.07] bg-ink-950">
        <ShaderHero />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink-950/85 via-ink-950/55 to-transparent" />
        <div className="shell relative grid min-h-[390px] items-center gap-4 py-14 sm:py-20 lg:grid-cols-[1fr_0.75fr]">
          <div className="relative z-10">
            <Reveal><p className="eyebrow">Market intelligence</p></Reveal>
            <h1 className="display mt-4 max-w-2xl text-[40px] leading-[1.05] sm:text-[56px]"><MaskLine delay={0.05}>The markets move.</MaskLine><MaskLine delay={0.14}><span className="text-lime">Stay ready.</span></MaskLine></h1>
            <Reveal delay={0.1}><p className="mt-5 max-w-xl text-[14px] leading-7 text-muted">Explore global currencies and digital assets in one considered workspace. Follow provider-sourced prices and discover crypto markets.</p></Reveal>
            <Reveal delay={0.15}><div className="mt-7 flex flex-wrap gap-3"><Magnetic strength={0.25}><a href="#crypto-discovery-heading" className="btn-primary px-5 py-3">Explore crypto markets <span aria-hidden>↗</span></a></Magnetic><Magnetic strength={0.25}><Link href="/dashboard/forex" className="btn-ghost px-5 py-3">Open forex desk</Link></Magnetic></div></Reveal>
            <p className="mt-5 text-[11px] text-white/45">Live prices from institutional-grade data providers.</p>
          </div>
          <div className="absolute -right-12 top-1/2 hidden h-[370px] w-[370px] -translate-y-1/2 opacity-80 lg:block xl:right-16" aria-hidden="true"><HeroScene /></div>
        </div>
      </section>
      <section className="shell pt-14 sm:pt-16">
        <Reveal><p className="eyebrow">One platform · multiple markets</p><h2 className="display mt-2 text-[26px] sm:text-[32px]">Find your market</h2><p className="mt-2 text-[13px] text-muted">Move between global currencies, crypto and more.</p></Reveal>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{DESKS.map((desk, i) => <Reveal key={desk.title} delay={i * 0.045}><Link href={desk.href} className="group flex h-full flex-col rounded-2xl border border-white/[0.07] bg-ink-850/70 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-lime/25 hover:bg-ink-800/80"><div className="flex items-center justify-between"><AssetMark symbol={desk.symbol} size={32}/><span className="chip">{desk.tag}</span></div><h3 className="mt-5 text-[15px] font-semibold text-white">{desk.title}</h3><p className="mt-2 flex-1 text-[12.5px] leading-6 text-muted">{desk.body}</p><span className="mt-5 text-[12px] font-medium text-lime">Explore <span aria-hidden>↗</span></span></Link></Reveal>)}</div>
      </section>
      <section className="shell pt-14 sm:pt-16"><MarketMovers /></section>
      <section className="shell pt-8"><div className="grid gap-4 xl:grid-cols-3"><div className="xl:col-span-2"><NewsFeed title="Market headlines" /></div><div className="panel flex flex-col justify-center gap-3 p-5"><div><h3 className="text-[15px] font-semibold text-white">Want the whole universe?</h3><p className="mt-1 text-[12px] leading-relaxed text-muted">The global screener scans thousands of listed instruments by momentum, activity and technical rating.</p></div><Link href="/markets/screener" className="btn-primary px-4 py-2.5 text-[12px]">Open the screener ↗</Link></div></div></section>
      <CryptoDiscovery />
      <section className="border-y border-white/[0.07] bg-ink-900/30">
        <div className="shell py-16">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">Currencies</p><h2 className="display mt-2 text-[26px] sm:text-[32px]">Forex at a glance</h2><p className="mt-2 text-[13px] text-muted">Live quotes from third-party market data providers.</p></div><Link href="/trading/forex" className="btn-ghost px-4 py-2 text-[12px]">Explore forex →</Link></div>
          <LiveMarketTable category="FOREX" limit={12} />
        </div>
      </section>
      <CTASection title="Find your rhythm in the markets" body="Explore live prices and market information in your account workspace." primary={{ href: '/register', label: 'Create account' }} secondary={{ href: '/trading-conditions', label: 'Trading conditions' }} />
    </>
  );
}
