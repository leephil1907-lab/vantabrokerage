'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AssetMark } from '@/components/asset-mark';
import { AnimatedNumber, EASE, Magnetic, MaskLine, Reveal, Stagger, StaggerItem } from '@/components/motion/primitives';
import { GoldBand } from '@/components/home/gold-band';
import { HeroCarousel } from '@/components/home/hero-carousel';
import { MarketShowcase } from '@/components/home/market-showcase';
import { MarketSessions } from '@/components/markets/market-sessions';
import { CryptoPreview, useCryptoPreview, formatUsd } from '@/components/crypto-discovery';
import { FeedStatus } from '@/components/motion/skeletons';
import { fmtPct, fmtPrice, priceDp, relTime } from '@/lib/format';
import { useMarkets } from '@/lib/use-markets';

type M = {
  symbol: string;
  last: number | null;
  bid?: number | null;
  ask?: number | null;
  change24h: number | null;
  high24h?: number | null;
  low24h?: number | null;
  source?: string | null;
  stale?: boolean;
  category: string;
  pricePrecision?: number;
};

/* ── Hero terminal preview: real quotes, animated chrome ─────────────────── */
const TABS = [
  { id: 'BTC/USDT', label: 'Bitcoin', kind: 'Crypto', coinId: 'bitcoin' },
  { id: 'ETH/USDT', label: 'Ethereum', kind: 'Crypto', coinId: 'ethereum' },
  { id: 'SOL/USDT', label: 'Solana', kind: 'Crypto', coinId: 'solana' },
  { id: 'EUR/USD', label: 'EUR/USD', kind: 'Forex', coinId: null },
  { id: 'XAUUSD', label: 'Gold', kind: 'Metal', coinId: null },
];

function HeroTerminal({ markets, feed }: { markets: M[]; feed: ReturnType<typeof useCryptoPreview> }) {
  const [tab, setTab] = useState(0);
  const [tick, setTick] = useState(0);
  const current = TABS[tab];
  const configured = markets.find((m) => m.symbol === current.id);
  const asset = current.coinId ? feed.data?.assets.find((a) => a.id === current.coinId) : null;
  const useReference = !configured?.last && asset?.priceUsd != null && asset.priceUsd > 0;
  const referenceDelayed = feed.delayed || !asset?.updatedAt || (feed.clock > 0 && feed.clock - Date.parse(asset.updatedAt) > 300_000);
  const market: M | undefined = useReference && asset ? { symbol: `${asset.symbol}/USD`, last: asset.priceUsd, change24h: asset.change24h, source: 'CoinGecko', stale: referenceDelayed, category: 'REFERENCE', pricePrecision: 2 } : configured;
  const displayLabel = useReference && asset ? `${asset.symbol}/USD` : current.id;
  useEffect(() => setTick((t) => t + 1), [market?.last]);
  const dp = market?.pricePrecision ?? priceDp(current.id);
  const up = (market?.change24h ?? 0) >= 0;
  const spread = market?.bid != null && market?.ask != null ? Math.abs(market.ask - market.bid) : null;

  return (
    <div className="glass relative overflow-hidden">
      {/* window chrome */}
      <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex gap-1.5">
            <span className="h-2 w-2 rounded-full bg-white/15" />
            <span className="h-2 w-2 rounded-full bg-white/15" />
            <span className="h-2 w-2 rounded-full bg-lime/70" />
          </span>
          <span className="ml-1 text-[10.5px] uppercase tracking-[0.16em] text-muted">PRIMEVEST terminal</span>
        </div>
        <FeedStatus state={!market?.last || !market.source ? 'offline' : market.stale ? 'delayed' : 'live'} label={!market?.last || !market.source ? 'Feed unavailable' : market.stale ? 'Delayed reference' : 'Reference price'} />
      </div>

      {/* symbol tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-white/[0.06] px-3 py-2">
        {TABS.map((t, i) => (
          <button
            key={t.id}
            onClick={() => setTab(i)}
            className={`relative shrink-0 rounded-lg px-2.5 py-1.5 text-[11.5px] font-medium transition-colors ${i === tab ? 'text-white' : 'text-muted hover:text-white'}`}
          >
            {i === tab && (
              <motion.span layoutId="hero-tab" className="absolute inset-0 rounded-lg border border-white/10 bg-white/[0.07]" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
            )}
            <span className="relative">{t.label}</span>
          </button>
        ))}
        <span className="ml-auto hidden text-[10px] uppercase tracking-[0.14em] text-muted sm:block">{current.kind}</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28, ease: EASE }}
          className="p-4"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <AssetMark symbol={current.id} size={34} />
              <div>
                <p className="text-[14px] font-semibold leading-none text-white">{displayLabel}</p>
                <p className="mt-1 text-[10.5px] leading-none text-muted">{useReference ? 'CoinGecko · USD reference' : `${current.kind} · Market overview`}</p>
              </div>
            </div>
            <div className="text-right">
              <AnimatedNumber value={market?.last ?? null} decimals={dp} className={`text-[21px] font-semibold leading-none ${up ? 'text-white' : 'text-white'}`} />
              <p className={`mt-1 text-[11px] font-medium ${market?.change24h == null ? 'text-muted' : up ? 'text-emerald' : 'text-danger'}`}>{market ? fmtPct(market.change24h) : '·'}</p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-4 gap-2 rounded-xl border border-white/[0.06] bg-ink-950/40 p-2">
            {(useReference && asset ? [
              ['24h change', fmtPct(asset.change24h)],
              ['Market cap', asset.marketCap != null ? '$' + Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(asset.marketCap) : '—'],
              ['24h volume', asset.volume24h != null ? '$' + Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(asset.volume24h) : '—'],
              ['Source', 'CoinGecko'],
            ] : [
              ['Bid', market?.bid != null ? fmtPrice(market.bid, dp) : '—'],
              ['Ask', market?.ask != null ? fmtPrice(market.ask, dp) : '—'],
              ['Spread', spread != null ? fmtPrice(spread, dp) : '—'],
              ['24h High', market?.high24h != null ? fmtPrice(market.high24h, dp) : '—'],
            ]).map(([label, value]) => (
              <div key={label}>
                <p className="text-[9.5px] uppercase tracking-[0.12em] text-muted">{label}</p>
                <p className="value-mono mt-0.5 text-[11.5px] text-white">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 h-[132px]">
            {market?.last ? <SparkArea symbol={current.id} up={up} tick={tick} referenceId={useReference ? current.coinId ?? undefined : undefined} /> : <div className="flex h-full items-center justify-center rounded-xl border border-white/[0.06] bg-black/20 px-4 text-center text-[11px] text-muted">Chart unavailable for this market</div>}
          </div>

          {useReference && asset ? <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[0.07] bg-ink-950/40 px-3 py-2.5 text-[10.5px] text-muted"><span>CoinGecko reference · {asset.updatedAt ? `updated ${relTime(asset.updatedAt)}` : 'update time unavailable'}</span><Link href="/markets#crypto-discovery-heading" className="font-medium text-lime">View assets →</Link></div> : <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-emerald/25 bg-emerald/[0.07] px-3 py-2 text-center"><p className="text-[10px] uppercase tracking-[0.14em] text-emerald/80">Bid reference</p><p className="value-mono mt-0.5 text-[13px] font-semibold text-emerald">{market?.bid != null ? fmtPrice(market.bid, dp) : '—'}</p></div>
            <div className="rounded-xl border border-danger/25 bg-danger/[0.07] px-3 py-2 text-center"><p className="text-[10px] uppercase tracking-[0.14em] text-danger/80">Ask reference</p><p className="value-mono mt-0.5 text-[13px] font-semibold text-danger">{market?.ask != null ? fmtPrice(market.ask, dp) : '—'}</p></div>
          </div>}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/** Area sparkline drawn from real candle closes (fetched, never synthesised). */
function SparkArea({ symbol, up, tick, referenceId }: { symbol: string; up: boolean; tick: number; referenceId?: string }) {
  const [points, setPoints] = useState<number[]>([]);
  const [unavailable, setUnavailable] = useState(false);
  const [chartDelayed, setChartDelayed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setPoints([]);
    setUnavailable(false);
    setChartDelayed(false);
    const endpoint = referenceId ? `/api/markets/crypto-reference-chart?asset=${encodeURIComponent(referenceId)}` : `/api/markets/${encodeURIComponent(symbol)}/candles?interval=5m&limit=48`;
    fetch(endpoint)
      .then((r) => r.json())
      .then((d) => { if (cancelled) return; const values = referenceId ? d?.prices?.map((p: { price: number }) => p.price) : d?.candles?.map((c: { close: number }) => c.close); if (values?.length >= 2) { setPoints(values); setChartDelayed(!!d.stale); } else setUnavailable(true); })
      .catch(() => { if (!cancelled) setUnavailable(true); });
    return () => { cancelled = true; };
  }, [symbol, referenceId]);

  if (unavailable) return <div className="flex h-full items-center justify-center text-[11px] text-muted">Chart data unavailable</div>;
  if (points.length < 2) return <div className="skeleton-shimmer h-full w-full" />;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const path = points.map((v, i) => `${i === 0 ? 'M' : 'L'}${((i / (points.length - 1)) * 300).toFixed(2)},${(80 - ((v - min) / range) * 70).toFixed(2)}`).join(' ');
  const stroke = up ? 'var(--chart-up)' : 'var(--chart-down)';
  const gid = `hero-area-${up ? 'u' : 'd'}`;

  return (
    <div className="relative h-full"><svg viewBox="0 0 300 84" preserveAspectRatio="none" className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.55, 0.85].map((r) => (
        <line key={r} x1="0" x2="300" y1={84 * r} y2={84 * r} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 6" />
      ))}
      <path d={`${path} L300,84 L0,84 Z`} fill={`url(#${gid})`} />
      <motion.path
        key={`${symbol}-${tick}-${points.length}`}
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0.85, opacity: 0.85 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.7, ease: EASE }}
        vectorEffect="non-scaling-stroke"
      />
    </svg>{referenceId && <span className="absolute bottom-0 left-0 rounded bg-ink-950/70 px-2 py-1 text-[9px] text-muted">24h USD reference · CoinGecko{chartDelayed ? ' · delayed' : ''}</span>}</div>
  );
}

/* ── Data sections ────────────────────────────────────────────────────────── */

const INSTRUMENTS = [
  { title: 'Forex', href: '/trading/forex', symbol: 'EUR/USD', copy: 'Follow major currency pairs and explore indicative reference prices.', tag: 'Currencies' },
  { title: 'Indices & commodities', href: '/trading/cfd', symbol: 'NAS100', copy: 'Explore information on indices and commodity-linked markets.', tag: 'Global markets' },
  { title: 'Crypto', href: '/trading/crypto', symbol: 'BTC/USDT', copy: 'Discover digital assets and follow reference prices.', tag: 'Digital assets' },
  { title: 'Futures', href: '/trading/futures', symbol: 'ETH/USDT', copy: 'Learn about futures and market risk.', tag: 'Market education' },
];

const STEPS = [
  { n: '01', title: 'Create your account', body: 'Register with your email address and set up your profile.', href: '/register', cta: 'Register' },
  { n: '02', title: 'Explore your dashboard', body: 'Review your account information and security settings.', href: '/accounts', cta: 'Your account' },
  { n: '03', title: 'Follow the markets', body: 'Explore currencies and digital assets with provider-sourced reference prices.', href: '/markets', cta: 'Browse markets' },
];

const ADVANTAGES = [
  { title: 'Market overview', body: 'Explore a range of market information in one workspace.', icon: 'server' },
  { title: 'Account dashboard', body: 'Review your profile and account activity in one place.', icon: 'ledger' },
  { title: 'Security settings', body: 'Manage your credentials and review account sessions.', icon: 'shield' },
  { title: 'Market discovery', body: 'Follow currency pairs and digital asset reference prices.', icon: 'split' },
  { title: 'Account support', body: 'Open a support request from your dashboard.', icon: 'audit' },
  { title: 'Provider-sourced data', body: 'Market prices are supplied by third parties and may be delayed or unavailable.', icon: 'feed' },
];

const ICONS: Record<string, React.ReactNode> = {
  server: <><rect x="3" y="4" width="18" height="6" rx="2" /><rect x="3" y="14" width="18" height="6" rx="2" /><path d="M7 7h.01M7 17h.01" /></>,
  ledger: <><path d="M4 4.5h13a2 2 0 0 1 2 2V20H6a2 2 0 0 1-2-2z" /><path d="M8 9h7M8 13h7" /></>,
  shield: <><path d="M12 3 19 6v6c0 4.6-3 8-7 9-4-1-7-4.4-7-9V6z" /><path d="M9 12.3l2.2 2.2 4-4.4" /></>,
  split: <><path d="M4 7h6l8 10M4 17h6l8-10" /><circle cx="19" cy="7" r="1.6" /><circle cx="19" cy="17" r="1.6" /></>,
  audit: <><circle cx="11" cy="11" r="6.5" /><path d="M15.8 15.8 21 21" /><path d="M8.5 11.2l1.8 1.8 3-3.4" /></>,
  feed: <><path d="M5 19a14 14 0 0 1 14-14" /><path d="M5 13a8 8 0 0 1 8-8" /><circle cx="5.5" cy="18.5" r="1.4" /></>,
};

const FAQS = [
  ['What can I explore on PRIMEVEST?', 'Explore market information, manage your profile and access your account dashboard.'],
  ['Where do the prices come from?', 'Prices come from third-party market data providers. Reference prices may be delayed or unavailable and are not executable quotes.'],
  ['How can I protect my account?', 'Use a strong password and review the security settings and active sessions in your dashboard.'],
  ['Where can I find support?', 'Sign in and open a support request from your dashboard.'],
];

export function LiveHome({ markets, authenticated = false }: { markets: M[]; authenticated?: boolean }) {
  const { markets: liveMarkets } = useMarkets();
  const cryptoFeed = useCryptoPreview();
  const table = (liveMarkets.length ? liveMarkets : markets) as M[];
  const majors = table.filter((m) => m.last != null && m.last > 0 && !!m.source && ['EUR/USD', 'GBP/USD', 'USD/JPY', 'XAUUSD', 'BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'NAS100'].includes(m.symbol));
  const crypto = table.filter((m) => m.category === 'SPOT').slice(0, 4);
  const [faq, setFaq] = useState<number | null>(0);

  return (
    <>
      <HeroCarousel><HeroTerminal markets={table} feed={cryptoFeed} /></HeroCarousel>
      <MarketShowcase authenticated={authenticated} />
      <div id="market-sessions" className="shell pb-8"><MarketSessions /></div>
      <CryptoPreview {...cryptoFeed} />
      <GoldBand />

      {/* ── MARKET OVERVIEW ──────────────────────────────────────────────── */}
      <section className="shell py-16 sm:py-20">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Market overview</p>
            <h2 className="display mt-2 text-[26px] sm:text-[30px]"><MaskLine>The markets at a glance</MaskLine></h2>
            <p className="mt-2.5 max-w-xl text-[13.5px] leading-relaxed text-muted">
              Follow indicative forex, commodity and digital-asset quotes. Provider and freshness details remain visible alongside each market.
            </p>
          </div>
          <Link href="/markets" className="group inline-flex items-center gap-1.5 text-[13px] font-medium text-lime">
            All markets
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="transition-transform group-hover:translate-x-0.5"><path d="M2.5 6.5h8M7 3l3.5 3.5L7 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </Link>
        </Reveal>

        {!majors.length && cryptoFeed.data?.assets.some((a) => a.priceUsd != null && a.priceUsd > 0) ? <Reveal delay={0.05} className="mt-6 overflow-hidden rounded-2xl border border-white/[0.07] bg-ink-850/60">
          <p className="border-b border-white/[0.07] px-4 py-3 text-[11px] text-muted">Crypto USD reference prices from CoinGecko · not bid/ask or executable quotes{cryptoFeed.delayed ? ' · delayed' : ''}</p>
          <table className="w-full"><thead className="bg-white/[0.02]"><tr><th className="th">Asset</th><th className="th text-right">USD price</th><th className="th text-right">24h</th></tr></thead><tbody>{cryptoFeed.data.assets.filter((a) => a.priceUsd != null && a.priceUsd > 0).slice(0, 8).map((asset) => <tr key={asset.id} className="table-row"><td className="td"><span className="flex items-center gap-2"><AssetMark symbol={`${asset.symbol}/USD`} size={22} /><span><span className="block font-medium text-white">{asset.name}</span><span className="block text-[10px] uppercase text-muted">{asset.symbol}/USD{(!asset.updatedAt || (cryptoFeed.clock > 0 && cryptoFeed.clock - Date.parse(asset.updatedAt) > 300_000)) ? ' · delayed' : ''}</span></span></span></td><td className="td whitespace-nowrap text-right value-mono">{formatUsd(asset.priceUsd)}</td><td className={`td whitespace-nowrap text-right value-mono ${asset.change24h == null ? 'text-muted' : asset.change24h >= 0 ? 'text-emerald' : 'text-danger'}`}>{fmtPct(asset.change24h)}</td></tr>)}</tbody></table>
        </Reveal> : <Reveal delay={0.05} className="mt-6 overflow-hidden rounded-2xl border border-white/[0.07] bg-ink-850/60">
          {majors.length === 0 ? <div className="px-5 py-8 text-center text-[12px] text-muted">No market quotes are available right now.</div> : <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-white/[0.02]">
                <tr>
                  <th className="th">Instrument</th>
                  <th className="th text-right">Bid</th>
                  <th className="th text-right">Ask</th>
                  <th className="th text-right">24h</th>
                  <th className="th hidden text-right sm:table-cell">Source</th>
                  <th className="th hidden text-right md:table-cell">24h range</th>
                </tr>
              </thead>
              <tbody>

                {majors.map((m, i) => {
                  const up = (m.change24h ?? 0) >= 0;
                  const dp = priceDp(m.symbol);
                  return (
                    <motion.tr
                      key={m.symbol}
                      className="table-row"
                      initial={{ opacity: 0, y: 6 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.35, delay: i * 0.03 }}
                    >
                      <td className="td">
                        <span className="flex items-center gap-2.5">
                          <AssetMark symbol={m.symbol} size={22} />
                          <span>
                            <span className="block font-medium text-white">{m.symbol}</span>
                            <span className="block text-[10px] uppercase tracking-[0.1em] text-muted">{m.category}</span>
                          </span>
                        </span>
                      </td>
                      <td className="td text-right value-mono">{m.bid != null ? fmtPrice(m.bid, dp) : '—'}</td>
                      <td className="td text-right value-mono">{m.ask != null ? fmtPrice(m.ask, dp) : '—'}</td>
                      <td className={`td text-right value-mono ${up ? 'text-emerald' : 'text-danger'}`}>{fmtPct(m.change24h)}</td>
                      <td className="td hidden text-right text-[11px] uppercase tracking-[0.1em] text-muted sm:table-cell">{m.source ?? (m.stale ? 'delayed' : '—')}</td>
                      <td className="td hidden md:table-cell">
                        <span className="block whitespace-nowrap text-right value-mono text-[11px] text-muted">{m.low24h != null ? fmtPrice(m.low24h, dp) : '—'} – {m.high24h != null ? fmtPrice(m.high24h, dp) : '—'}</span>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>}
        </Reveal>}
      </section>

      {/* ── INSTRUMENTS ──────────────────────────────────────────────────── */}
      <section className="relative border-y border-white/[0.07] bg-ink-900/30">
        <div className="shell py-16 sm:py-20">
          <Reveal>
            <p className="eyebrow">Market categories</p>
            <h2 className="display mt-2 text-[26px] sm:text-[30px]"><MaskLine>Explore markets in one place</MaskLine></h2>
            <p className="mt-2.5 max-w-xl text-[13.5px] leading-relaxed text-muted">
              Discover currencies, digital assets and information about global markets.
            </p>
          </Reveal>
          <Stagger className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {INSTRUMENTS.map((i) => (
              <StaggerItem key={i.title}>
                <Link href={i.href} className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-ink-850/70 p-5 transition-all duration-300 ease-premium hover:-translate-y-1 hover:border-lime/25 hover:bg-ink-800/80">
                  <span className="pointer-events-none absolute -right-14 -top-14 h-32 w-32 rounded-full bg-lime/[0.07] opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
                  <div className="flex items-start justify-between">
                    <AssetMark symbol={i.symbol} size={30} />
                    <span className="chip">{i.tag}</span>
                  </div>
                  <h3 className="mt-4 text-[14px] font-semibold text-white">{i.title}</h3>
                  <p className="mt-1.5 flex-1 text-[12.5px] leading-relaxed text-muted">{i.copy}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-lime">
                    Open terminal
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="transition-transform duration-200 group-hover:translate-x-1"><path d="M2.5 6h7M6 2.5 9.5 6 6 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </span>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ── 3 STEPS ──────────────────────────────────────────────────────── */}
      <section className="shell py-16 sm:py-20">
        <Reveal className="text-center">
          <p className="eyebrow justify-center">Getting started</p>
          <h2 className="display mt-2 text-[26px] sm:text-[32px]"><MaskLine>Three steps to get started</MaskLine></h2>
          <p className="mx-auto mt-2.5 max-w-lg text-[13.5px] leading-relaxed text-muted">
            Create an account and explore your market workspace in a few simple steps.
          </p>
        </Reveal>
        <div className="relative mt-10">
          <div className="pointer-events-none absolute left-0 right-0 top-[42px] hidden h-px bg-gradient-to-r from-transparent via-lime/30 to-transparent md:block" />
          <Stagger className="grid gap-5 md:grid-cols-3" gap={0.1}>
            {STEPS.map((s) => (
              <StaggerItem key={s.n}>
                <div className="group relative h-full rounded-2xl border border-white/[0.07] bg-ink-850/70 p-6 transition-colors duration-300 hover:border-white/15">
                  <span className="relative z-10 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-lime/25 bg-ink-950 text-[12px] font-semibold text-lime">{s.n}</span>
                  <h3 className="mt-4 text-[15px] font-semibold text-white">{s.title}</h3>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-muted">{s.body}</p>
                  <Link href={s.href} className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-white/80 transition-colors group-hover:text-lime">
                    {s.cta}
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6h7M6 2.5 9.5 6 6 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </Link>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ── ADVANTAGES ───────────────────────────────────────────────────── */}
      <section className="border-y border-white/[0.07] bg-ink-900/40">
        <div className="shell grid gap-10 py-16 sm:py-20 lg:grid-cols-[0.85fr_1.15fr]">
          <Reveal>
            <p className="eyebrow">Why PRIMEVEST</p>
            <h2 className="display mt-2 text-[26px] sm:text-[30px]"><MaskLine>A closer look at the platform</MaskLine></h2>
            <p className="mt-3 text-[13.5px] leading-relaxed text-muted">
              Follow the markets, manage your account and find the information you need in a focused workspace.
            </p>
            {crypto.length > 0 && (
              <div className="mt-6 grid grid-cols-2 gap-2.5">
                {crypto.map((m) => {
                  const up = (m.change24h ?? 0) >= 0;
                  return (
                    <div key={m.symbol} className="rounded-xl border border-white/[0.07] bg-ink-850/70 px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <AssetMark symbol={m.symbol} size={16} />
                        <span className="text-[11.5px] font-medium text-white">{m.symbol}</span>
                        <span className={`ml-auto value-mono text-[10.5px] ${up ? 'text-emerald' : 'text-danger'}`}>{fmtPct(m.change24h)}</span>
                      </div>
                      <AnimatedNumber value={m.last} decimals={priceDp(m.symbol)} className="mt-1 block text-[13px] font-semibold text-white" />
                    </div>
                  );
                })}
              </div>
            )}
          </Reveal>
          <Stagger className="grid gap-3 sm:grid-cols-2">
            {ADVANTAGES.map((a) => (
              <StaggerItem key={a.title}>
                <div className="h-full rounded-2xl border border-white/[0.07] bg-ink-850/60 p-4 transition-colors duration-300 hover:border-white/15">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-lime/20 bg-lime/[0.08] text-lime">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{ICONS[a.icon]}</svg>
                  </span>
                  <h3 className="mt-3 text-[13px] font-semibold text-white">{a.title}</h3>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-muted">{a.body}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="shell max-w-4xl py-16 sm:py-20">
        <Reveal>
          <p className="eyebrow">Frequently asked</p>
          <h2 className="display mt-2 text-[26px] sm:text-[30px]"><MaskLine>Straight answers</MaskLine></h2>
        </Reveal>
        <div className="mt-6 divide-y divide-white/[0.07] overflow-hidden rounded-2xl border border-white/[0.07] bg-ink-850/50">
          {FAQS.map(([q, a], i) => (
            <div key={q}>
              <button
                onClick={() => setFaq(faq === i ? null : i)}
                aria-expanded={faq === i}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-[13.5px] font-medium text-white transition-colors hover:bg-white/[0.02]"
              >
                {q}
                <motion.span animate={{ rotate: faq === i ? 45 : 0 }} transition={{ duration: 0.2 }} className="shrink-0 text-muted">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {faq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: EASE }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-4 text-[12.5px] leading-relaxed text-muted">{a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="shell pb-20">
        <Reveal className="relative overflow-hidden rounded-3xl border border-white/[0.09] bg-gradient-to-b from-ink-800 to-ink-900 p-9 text-center sm:p-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(700px_260px_at_50%_-30%,rgba(223,192,136,0.16),transparent)]" />
          <div className="pointer-events-none absolute inset-0 grid-lines opacity-40" />
          <h2 className="display relative text-[26px] sm:text-[34px]"><MaskLine>Open your PRIMEVEST account</MaskLine></h2>
          <p className="relative mx-auto mt-3 max-w-xl text-[13.5px] leading-relaxed text-muted">
            Register to access your account dashboard and explore market information.
          </p>
          <div className="relative mt-6 flex flex-wrap justify-center gap-3">
            <Magnetic strength={0.25}><Link href="/register" className="btn-primary px-6 py-3 text-[13.5px]">Create account</Link></Magnetic>
            <Magnetic strength={0.25}><Link href="/login" className="btn-ghost px-6 py-3 text-[13.5px]">Sign in</Link></Magnetic>
          </div>
          <p className="relative mt-4 text-[10.5px] text-muted">Market prices are for reference. Trading involves risk of loss.</p>
        </Reveal>
      </section>
    </>
  );
}
