'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AssetMark } from '@/components/asset-mark';
import { AnimatedNumber, EASE, Reveal, Stagger, StaggerItem, Counter } from '@/components/motion/primitives';
import { HeroScene } from '@/components/three/hero-scene';
import { MarketSparkline } from '@/components/market-visual';
import { FeedStatus } from '@/components/motion/skeletons';
import { fmtPct, fmtPrice, priceDp } from '@/lib/format';
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
};

/* ── Hero terminal preview: real quotes, animated chrome ─────────────────── */
const TABS = [
  { id: 'EUR/USD', label: 'EUR/USD', kind: 'Forex' },
  { id: 'BTC/USDT', label: 'BTC/USDT', kind: 'Crypto' },
  { id: 'XAUUSD', label: 'XAU/USD', kind: 'Metal' },
  { id: 'NAS100', label: 'NAS100', kind: 'Index' },
];

function HeroTerminal({ markets, source }: { markets: M[]; source: string | null }) {
  const [tab, setTab] = useState(0);
  const [tick, setTick] = useState(0);
  const current = TABS[tab];
  const market = markets.find((m) => m.symbol === current.id);

  useEffect(() => {
    const id = setInterval(() => setTab((t) => (t + 1) % TABS.length), 6500);
    return () => clearInterval(id);
  }, []);
  useEffect(() => setTick((t) => t + 1), [market?.last]);

  const dp = priceDp(current.id);
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
          <span className="ml-1 text-[10.5px] uppercase tracking-[0.16em] text-muted">Vanta terminal</span>
        </div>
        <FeedStatus state={market?.stale ? 'delayed' : 'live'} label={market?.stale ? 'Delayed' : source ? `Live · ${source}` : 'Live'} />
      </div>

      {/* symbol tabs */}
      <div className="flex items-center gap-1 border-b border-white/[0.06] px-3 py-2">
        {TABS.map((t, i) => (
          <button
            key={t.id}
            onClick={() => setTab(i)}
            className={`relative rounded-lg px-2.5 py-1.5 text-[11.5px] font-medium transition-colors ${i === tab ? 'text-white' : 'text-muted hover:text-white'}`}
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
                <p className="text-[14px] font-semibold leading-none text-white">{current.label}</p>
                <p className="mt-1 text-[10.5px] leading-none text-muted">{current.kind} · {market?.source ?? 'provider'}</p>
              </div>
            </div>
            <div className="text-right">
              <AnimatedNumber value={market?.last ?? null} decimals={dp} className={`text-[21px] font-semibold leading-none ${up ? 'text-white' : 'text-white'}`} />
              <p className={`mt-1 text-[11px] font-medium ${up ? 'text-emerald' : 'text-danger'}`}>{market ? fmtPct(market.change24h) : '·'}</p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-4 gap-2 rounded-xl border border-white/[0.06] bg-ink-950/40 p-2">
            {[
              ['Bid', market?.bid != null ? fmtPrice(market.bid, dp) : '—'],
              ['Ask', market?.ask != null ? fmtPrice(market.ask, dp) : '—'],
              ['Spread', spread != null ? fmtPrice(spread, dp) : '—'],
              ['24h High', market?.high24h != null ? fmtPrice(market.high24h, dp) : '—'],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-[9.5px] uppercase tracking-[0.12em] text-muted">{label}</p>
                <p className="value-mono mt-0.5 text-[11.5px] text-white">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 h-[132px]">
            <SparkArea symbol={current.id} up={up} tick={tick} />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-emerald/25 bg-emerald/[0.07] px-3 py-2 text-center">
              <p className="text-[10px] uppercase tracking-[0.14em] text-emerald/80">Buy / Long</p>
              <p className="value-mono mt-0.5 text-[13px] font-semibold text-emerald">{market?.ask != null ? fmtPrice(market.ask, dp) : '—'}</p>
            </div>
            <div className="rounded-xl border border-danger/25 bg-danger/[0.07] px-3 py-2 text-center">
              <p className="text-[10px] uppercase tracking-[0.14em] text-danger/80">Sell / Short</p>
              <p className="value-mono mt-0.5 text-[13px] font-semibold text-danger">{market?.bid != null ? fmtPrice(market.bid, dp) : '—'}</p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/** Area sparkline drawn from real candle closes (fetched, never synthesised). */
function SparkArea({ symbol, up, tick }: { symbol: string; up: boolean; tick: number }) {
  const [points, setPoints] = useState<number[]>([]);
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/markets/${encodeURIComponent(symbol)}/candles?interval=5m&limit=48`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled && d?.candles?.length) setPoints(d.candles.map((c: { close: number }) => c.close)); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [symbol]);

  if (points.length < 2) return <div className="skeleton-shimmer h-full w-full" />;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const path = points.map((v, i) => `${i === 0 ? 'M' : 'L'}${((i / (points.length - 1)) * 300).toFixed(2)},${(80 - ((v - min) / range) * 70).toFixed(2)}`).join(' ');
  const stroke = up ? '#2ee6a8' : '#ff5b6e';
  const gid = `hero-area-${up ? 'u' : 'd'}`;

  return (
    <svg viewBox="0 0 300 84" preserveAspectRatio="none" className="h-full w-full" aria-hidden>
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
    </svg>
  );
}

/* ── Data sections ────────────────────────────────────────────────────────── */

const INSTRUMENTS = [
  { title: 'Forex', href: '/trading/forex', symbol: 'EUR/USD', copy: 'Seven majors with tight institutional spreads, market, limit and stop orders and up to 200× leverage.', tag: '7 pairs' },
  { title: 'Indices & CFDs', href: '/trading/cfd', symbol: 'NAS100', copy: 'NASDAQ, S&P 500, Dow, DAX and FTSE, marked and margined by a server-side risk engine.', tag: '5 indices' },
  { title: 'Commodities', href: '/trading/cfd', symbol: 'XAUUSD', copy: 'Gold, silver, WTI crude and natural gas CFDs priced from live futures feeds.', tag: '4 markets' },
  { title: 'Crypto spot', href: '/trading/crypto', symbol: 'BTC/USDT', copy: 'Ten USDT markets with order book, depth, holdings and locked-balance accounting.', tag: '10 pairs' },
  { title: 'Perpetual futures', href: '/trading/futures', symbol: 'ETH/USDT', copy: 'Long and short with cross or isolated margin, funding, liquidation price and risk engine.', tag: 'Up to 100×' },
  { title: 'Short-expiry', href: '/trading/short-expiry', symbol: 'SOL/USDT', copy: 'CALL / PUT contracts from 30 seconds to 1 hour, settled on verifiable price timestamps.', tag: '30s–1h' },
];

const STEPS = [
  { n: '01', title: 'Create your account', body: 'Register with an email address. A live account and a simulated paper account are provisioned instantly — no payment details required.', href: '/register', cta: 'Register' },
  { n: '02', title: 'Fund your wallet', body: 'Deposits are credited to a double-entry ledger. Crypto deposits are verified on-chain; other rails queue for finance review and show their status honestly.', href: '/deposits-withdrawals', cta: 'Funding methods' },
  { n: '03', title: 'Trade the markets', body: 'Choose an instrument, size the position server-side and execute. Every fill records its quote, provider and timestamp so nothing is invented.', href: '/markets', cta: 'Browse markets' },
];

const ADVANTAGES = [
  { title: 'Server-side execution', body: 'Every fill is priced from a server-fetched quote and written to an immutable execution record with its quote timestamp.', icon: 'server' },
  { title: 'Double-entry ledger', body: 'Balances are never a mutable number. Each movement is a balanced transaction with a counterparty entry, reconcilable to the cent.', icon: 'ledger' },
  { title: 'Continuous risk engine', body: 'Mark prices, margin ratios, liquidation prices and funding are recomputed by a background worker — never by the browser.', icon: 'shield' },
  { title: 'Paper and live separated', body: 'Simulated balances are labelled PAPER throughout. Live trading activates only when an execution provider is connected.', icon: 'split' },
  { title: 'Audited back office', body: 'Administrators act through logged workflows. Every approval, restriction and configuration change records actor, IP and timestamp.', icon: 'audit' },
  { title: 'Verifiable market data', body: 'Prices come from named providers — Kraken, Coinbase and Yahoo Finance — and every quote stores its source and fetch time.', icon: 'feed' },
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
  ['Is this a live brokerage?', 'The platform is a complete brokerage application: authentication, KYC, order management, position accounting, ledger, wallet, back office. Live trading, custody and payment rails activate only when the corresponding providers are configured for a deployment. Until then the platform runs with clearly-labelled paper trading so every workflow can be exercised end to end.'],
  ['Where do the prices come from?', 'Market data is pulled server-side from named providers — Kraken and Coinbase for crypto, Yahoo Finance for FX, indices and commodities. Each quote records its provider and fetch time, and stale quotes are labelled as delayed rather than silently served.'],
  ['How are balances protected from client manipulation?', 'Balances live in a double-entry ledger on the server. The browser never sends a price, a fill or a resulting balance — it sends an intent, and the server validates, prices and settles it.'],
  ['Can I try it without depositing?', 'Yes. Every account is created with a paper trading account funded with a simulated balance. Paper trades are flagged as PAPER everywhere they appear.'],
  ['What do I need before withdrawing?', 'Identity verification must be approved, and withdrawals re-authenticate the session (password plus two-factor if enabled) before reserving funds and queueing them for finance review.'],
];

export function LiveHome({ markets }: { markets: M[] }) {
  const { markets: liveMarkets } = useMarkets();
  const table = (liveMarkets.length ? liveMarkets : markets) as M[];
  const majors = table.filter((m) => ['EUR/USD', 'GBP/USD', 'USD/JPY', 'XAUUSD', 'BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'NAS100'].includes(m.symbol));
  const source = table.find((m) => m.source)?.source ?? null;
  const crypto = table.filter((m) => m.category === 'SPOT').slice(0, 4);
  const [faq, setFaq] = useState<number | null>(0);

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pb-10 pt-8 sm:pt-12">
        <div className="pointer-events-none absolute inset-0 grid-lines opacity-70" />
        <div className="pointer-events-none absolute -left-32 top-10 h-[420px] w-[420px] rounded-full bg-lime/[0.06] blur-[120px]" />
        <div className="pointer-events-none absolute right-0 top-40 h-[380px] w-[380px] rounded-full bg-emerald/[0.05] blur-[120px]" />

        <div className="shell relative grid items-center gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 backdrop-blur"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald" />
              </span>
              <span className="text-[11px] font-medium text-white/85">
                Market data {source ? `live from ${source}` : 'streaming'}
              </span>
              <span className="h-3 w-px bg-white/15" />
              <span className="text-[11px] text-muted">44 instruments</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: EASE, delay: 0.05 }}
              className="display mt-6 text-[40px] leading-[1.03] sm:text-[54px] lg:text-[58px]"
            >
              Trade forex, crypto and
              <br className="hidden sm:block" /> short-expiry{' '}
              <span className="relative whitespace-nowrap">
                <span className="bg-gradient-to-r from-lime via-lime-400 to-emerald bg-clip-text text-transparent">in seconds.</span>
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.12 }}
              className="mt-5 max-w-xl text-[14.5px] leading-relaxed text-muted"
            >
              One account across five terminals — forex and CFDs, perpetual futures, crypto spot and 30-second CALL/PUT contracts.
              Executed server-side, settled in a double-entry ledger, reconciled to the cent.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.18 }}
              className="mt-7 flex flex-wrap items-center gap-3"
            >
              <Link href="/register" className="btn-primary px-5 py-3 text-[13.5px]">Open a free account</Link>
              <Link href="/markets" className="btn-ghost px-5 py-3 text-[13.5px]">
                Explore markets
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2.5 6.5h8M7 3l3.5 3.5L7 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </Link>
            </motion.div>

            <motion.dl
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.28 }}
              className="mt-9 grid max-w-lg grid-cols-3 gap-4 border-t border-white/[0.07] pt-5"
            >
              {[
                { v: 44, suffix: '', label: 'Tradable markets' },
                { v: 5, suffix: '', label: 'Terminals' },
                { v: 100, suffix: '%', label: 'Server-side pricing' },
              ].map((s) => (
                <div key={s.label}>
                  <dt className="text-[22px] font-semibold text-white"><Counter value={s.v} suffix={s.suffix} /></dt>
                  <dd className="mt-1 text-[10.5px] uppercase tracking-[0.13em] text-muted">{s.label}</dd>
                </div>
              ))}
            </motion.dl>
          </div>

          <div className="relative">
            <div className="absolute -inset-8 rounded-[40px] bg-gradient-to-br from-lime/10 via-transparent to-emerald/10 blur-3xl" />
            <div className="pointer-events-none absolute inset-0 -z-0 hidden lg:block">
              <div className="absolute -left-16 -top-20 h-[440px] w-[440px]">
                <HeroScene />
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 22, rotateX: 6 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.15 }}
              className="relative"
            >
              <HeroTerminal markets={table} source={source} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── LIVE MARKET STRIP ────────────────────────────────────────────── */}
      <section className="relative border-y border-white/[0.06] bg-ink-900/40">
        <div className="shell grid grid-cols-2 divide-x divide-white/[0.05] sm:grid-cols-4">
          {majors.slice(0, 4).map((m) => {
            const up = (m.change24h ?? 0) >= 0;
            return (
              <Reveal key={m.symbol} className="px-3 py-4" y={10}>
                <div className="flex items-center gap-2">
                  <AssetMark symbol={m.symbol} size={20} />
                  <p className="text-[12px] font-medium text-white">{m.symbol}</p>
                  <span className="ml-auto text-[10px] text-muted">{m.source ?? '—'}</span>
                </div>
                <div className="mt-2 flex items-baseline justify-between gap-2">
                  <AnimatedNumber value={m.last} decimals={priceDp(m.symbol)} className="text-[15px] font-semibold text-white" />
                  <span className={`value-mono text-[11px] ${up ? 'text-emerald' : 'text-danger'}`}>{fmtPct(m.change24h)}</span>
                </div>
                <div className="mt-1.5 h-6">
                  <MarketSparkline series={[m.low24h ?? m.last ?? 0, m.last ?? 0, m.high24h ?? m.last ?? 0].filter((v) => v > 0)} up={up} />
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ── MARKET OVERVIEW ──────────────────────────────────────────────── */}
      <section className="shell py-16 sm:py-20">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Market overview</p>
            <h2 className="display mt-2 text-[26px] sm:text-[30px]">Live prices, named sources</h2>
            <p className="mt-2.5 max-w-xl text-[13.5px] leading-relaxed text-muted">
              Every quote is fetched server-side and stamped with the provider that produced it. Stale feeds are labelled, never hidden.
            </p>
          </div>
          <Link href="/markets" className="group inline-flex items-center gap-1.5 text-[13px] font-medium text-lime">
            All markets
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="transition-transform group-hover:translate-x-0.5"><path d="M2.5 6.5h8M7 3l3.5 3.5L7 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </Link>
        </Reveal>

        <Reveal delay={0.05} className="mt-6 overflow-hidden rounded-2xl border border-white/[0.07] bg-ink-850/60">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-white/[0.02]">
                <tr>
                  <th className="th">Instrument</th>
                  <th className="th text-right">Bid</th>
                  <th className="th text-right">Ask</th>
                  <th className="th text-right">24h</th>
                  <th className="th hidden text-right sm:table-cell">Source</th>
                  <th className="th hidden text-right md:table-cell">Trend</th>
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
                        <div className="ml-auto w-24">
                          <MarketSparkline series={[m.low24h ?? m.last ?? 0, m.last ?? 0, m.high24h ?? m.last ?? 0].filter((v) => v > 0)} up={up} />
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Reveal>
      </section>

      {/* ── INSTRUMENTS ──────────────────────────────────────────────────── */}
      <section className="relative border-y border-white/[0.07] bg-ink-900/30">
        <div className="shell py-16 sm:py-20">
          <Reveal>
            <p className="eyebrow">Trading instruments</p>
            <h2 className="display mt-2 text-[26px] sm:text-[30px]">Five terminals, one account</h2>
            <p className="mt-2.5 max-w-xl text-[13.5px] leading-relaxed text-muted">
              Each desk has its own execution semantics — margin and liquidation for derivatives, reserved balance for spot,
              server-timestamped settlement for short-expiry.
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
          <h2 className="display mt-2 text-[26px] sm:text-[32px]">Three steps to your first trade</h2>
          <p className="mx-auto mt-2.5 max-w-lg text-[13.5px] leading-relaxed text-muted">
            No sales call, no minimum deposit to test. Open an account and the platform provisions everything you need.
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
            <p className="eyebrow">Why Vanta</p>
            <h2 className="display mt-2 text-[26px] sm:text-[30px]">Built like a brokerage, not a demo</h2>
            <p className="mt-3 text-[13.5px] leading-relaxed text-muted">
              The visible charts are the smallest part of the system. Underneath sit authentication with device history, a KYC
              review queue, order management, margin and liquidation logic, ledger accounting and a permissioned back office.
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
          <h2 className="display mt-2 text-[26px] sm:text-[30px]">Straight answers</h2>
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
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(700px_260px_at_50%_-30%,rgba(200,247,81,0.16),transparent)]" />
          <div className="pointer-events-none absolute inset-0 grid-lines opacity-40" />
          <h2 className="display relative text-[26px] sm:text-[34px]">Open your account in under a minute</h2>
          <p className="relative mx-auto mt-3 max-w-xl text-[13.5px] leading-relaxed text-muted">
            Register to get a live account, a funded paper account and access to every terminal. No payment details required to start.
          </p>
          <div className="relative mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/register" className="btn-primary px-6 py-3 text-[13.5px]">Create account</Link>
            <Link href="/login" className="btn-ghost px-6 py-3 text-[13.5px]">Sign in</Link>
          </div>
          <p className="relative mt-4 text-[10.5px] text-muted">Simulated results on paper accounts. Trading involves risk of loss.</p>
        </Reveal>
      </section>
    </>
  );
}
