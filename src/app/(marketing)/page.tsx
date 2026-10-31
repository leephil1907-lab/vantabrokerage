import Link from 'next/link';
import { listMarkets } from '@/lib/markets';
import { TickerTape, HeroChart, MarketSparkline } from '@/components/market-visual';
import { fmtPct, fmtPrice, priceDp } from '@/lib/format';

export const dynamic = 'force-dynamic';

const INSTRUMENTS = [
  { title: 'Forex', copy: 'Seven majors with institutional spreads, market, limit and stop orders, and 2–200× leverage.', href: '/trading/forex', tag: '7 pairs' },
  { title: 'Indices & CFDs', copy: 'NASDAQ, S&P 500, Dow, DAX and FTSE with server-side margin monitoring.', href: '/trading/cfd', tag: '5 indices' },
  { title: 'Commodities', copy: 'Gold, silver, WTI crude and natural gas CFDs priced from live futures feeds.', href: '/trading/cfd', tag: '4 markets' },
  { title: 'Crypto spot', copy: 'Ten USDT markets with order book, depth, holdings and locked-balance accounting.', href: '/trading/crypto', tag: '10 pairs' },
  { title: 'Perpetual futures', copy: 'Long/short with cross or isolated margin, funding, liquidation price and risk engine.', href: '/trading/futures', tag: 'Up to 100×' },
  { title: 'Short-expiry', copy: 'CALL/PUT contracts from 30 seconds to 1 hour, settled on verifiable price timestamps.', href: '/trading/short-expiry', tag: '30s–1h' },
];

const ADVANTAGES = [
  { title: 'Server-side execution', body: 'Every fill is priced from a server-fetched quote and written to an immutable execution record with its quote timestamp.' },
  { title: 'Double-entry ledger', body: 'Balances are never stored as a mutable number you can edit — each movement is a balanced ledger transaction with a counterparty entry.' },
  { title: 'Risk engine', body: 'Mark prices, margin ratios, liquidation prices and funding are recomputed by a background worker, not by the browser.' },
  { title: 'Paper and live separated', body: 'Simulated balances are labelled PAPER throughout. Live trading only activates when an execution provider is connected.' },
  { title: 'Audited back office', body: 'Administrators act through logged workflows. Every approval, restriction and configuration change is recorded with actor, IP and timestamp.' },
  { title: 'Verifiable market data', body: 'Prices come from named providers (Kraken, Coinbase, Yahoo Finance) and every quote stores its source and fetch time.' },
];

const FAQS = [
  ['Is this a live brokerage?', 'The platform is a complete brokerage application. Live trading, custody and payment rails activate only when the corresponding providers are configured for a deployment. Until then the platform operates with clearly-labelled paper trading so every workflow can be exercised end to end.'],
  ['Where do prices come from?', 'Market data is pulled server-side from named providers — Kraken and Coinbase for crypto, Yahoo Finance for FX, indices and commodities. Each quote records its source and fetch timestamp so executions can be reconciled.'],
  ['How are balances protected from client manipulation?', 'Balances live in a double-entry ledger on the server. The browser never sends a price, a fill or a resulting balance — it sends an intent, and the server validates, prices and settles it.'],
  ['Can I try it without depositing?', 'Yes. Every account is created with a paper trading account funded with a simulated balance. Paper trades are flagged as PAPER everywhere they appear.'],
  ['What do I need before withdrawing?', 'Identity verification must be approved, and withdrawals re-authenticate the session (password plus two-factor if enabled) before reserving funds for finance review.'],
];

export default async function HomePage() {
  const markets = await listMarkets({});
  const majors = markets.filter((m) => ['EUR/USD', 'GBP/USD', 'USD/JPY', 'XAUUSD', 'BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'NAS100'].includes(m.symbol));
  const crypto = markets.filter((m) => m.category === 'SPOT').slice(0, 6);
  const liveSource = markets.find((m) => m.source)?.source ?? null;

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 grid-faint opacity-70" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 pb-16 pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pt-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald" />
              <span className="text-[11px] font-medium text-white/80">
                Market data {liveSource ? `live from ${liveSource}` : 'connecting'}
              </span>
            </div>
            <h1 className="mt-6 text-[40px] font-semibold leading-[1.06] tracking-[-0.02em] text-white sm:text-[54px]">
              One terminal.<br />
              <span className="bg-gradient-to-r from-lime via-lime-400 to-emerald bg-clip-text text-transparent">Every market.</span>
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted">
              Forex, indices, commodities, short-expiry contracts, crypto spot and perpetual futures — executed server-side,
              settled in a double-entry ledger, and managed from a single wallet.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/register" className="btn-primary px-5 py-3 text-[14px]">Open a free account</Link>
              <Link href="/markets" className="btn-ghost px-5 py-3 text-[14px]">Explore markets</Link>
            </div>
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-white/[0.07] pt-6">
              {[
                ['41', 'tradable markets'],
                ['5', 'terminals'],
                ['100%', 'server-side pricing'],
              ].map(([v, l]) => (
                <div key={l}>
                  <dt className="text-xl font-semibold text-white">{v}</dt>
                  <dd className="mt-0.5 text-[11px] uppercase tracking-wide text-muted">{l}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 rounded-[32px] bg-gradient-to-br from-lime/10 via-transparent to-emerald/10 blur-2xl" />
            <HeroChart symbol="BTC/USDT" />
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {majors.slice(0, 4).map((m) => {
                const up = (m.change24h ?? 0) >= 0;
                return (
                  <div key={m.symbol} className="panel-flat px-3 py-2">
                    <p className="text-[10.5px] font-medium text-muted">{m.symbol}</p>
                    <p className="value-mono mt-0.5 text-[12.5px] font-semibold text-white">{fmtPrice(m.last, priceDp(m.symbol))}</p>
                    <p className={`value-mono text-[10.5px] ${up ? 'text-emerald' : 'text-danger'}`}>{fmtPct(m.change24h)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <TickerTape markets={markets.filter((m) => m.category !== 'BINARY')} />
      </section>

      {/* MARKET OVERVIEW */}
      <section className="mx-auto max-w-7xl px-5 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="label">Market overview</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Live prices, named sources</h2>
            <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-muted">
              Every quote below is fetched server-side and stamped with the provider that produced it. No synthetic prices, no stale placeholders.
            </p>
          </div>
          <Link href="/markets" className="text-[13px] font-medium text-lime hover:underline">View all markets →</Link>
        </div>
        <div className="mt-6 overflow-hidden rounded-2xl border border-white/[0.07]">
          <table className="w-full">
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
              {majors.map((m) => {
                const up = (m.change24h ?? 0) >= 0;
                const dp = priceDp(m.symbol);
                return (
                  <tr key={m.symbol} className="table-row">
                    <td className="td">
                      <span className="font-medium text-white">{m.symbol}</span>
                      <span className="ml-2 rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted">{m.category}</span>
                    </td>
                    <td className="td text-right value-mono">{fmtPrice(m.bid, dp)}</td>
                    <td className="td text-right value-mono">{fmtPrice(m.ask, dp)}</td>
                    <td className={`td text-right value-mono ${up ? 'text-emerald' : 'text-danger'}`}>{fmtPct(m.change24h)}</td>
                    <td className="td hidden text-right text-[11px] uppercase tracking-wide text-muted sm:table-cell">{m.source ?? (m.stale ? 'stale' : '—')}</td>
                    <td className="td hidden md:table-cell">
                      <div className="ml-auto w-24">
                        <MarketSparkline
                          series={[m.low24h ?? m.last ?? 0, m.last ?? 0, m.high24h ?? m.last ?? 0].filter((v) => v > 0)}
                          up={up}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* PLATFORM INTRO */}
      <section className="border-y border-white/[0.07] bg-ink-900/40">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="label">The platform</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">A brokerage, not a landing page.</h2>
            <p className="mt-3 text-[13.5px] leading-relaxed text-muted">
              Vanta Markets ships the infrastructure behind the charts: authentication with session and device management, KYC workflows,
              order management, position accounting, margin and liquidation logic, a unified wallet ledger, deposit and withdrawal review,
              referrals, support and a permissioned administrative back office.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                'Market, limit and stop orders with reserved-margin accounting',
                'Cross and isolated futures margin with funding and liquidation price',
                'Short-expiry settlement against server-timestamped quotes',
                'Deposit/withdrawal workflows with finance review and reconciliation',
              ].map((t) => (
                <li key={t} className="flex gap-2.5 text-[13px] text-white/85">
                  <svg width="15" height="15" viewBox="0 0 15 15" className="mt-0.5 shrink-0" fill="none"><path d="M3 8l3 3 6-7" stroke="#c8f751" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  {t}
                </li>
              ))}
            </ul>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/register" className="btn-primary px-5 py-2.5 text-[13px]">Create your account</Link>
              <Link href="/trading-conditions" className="btn-ghost px-5 py-2.5 text-[13px]">Trading conditions</Link>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {crypto.map((m) => {
              const up = (m.change24h ?? 0) >= 0;
              return (
                <div key={m.symbol} className="panel p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[12.5px] font-semibold text-white">{m.symbol}</span>
                    <span className={`value-mono text-[11px] ${up ? 'text-emerald' : 'text-danger'}`}>{fmtPct(m.change24h)}</span>
                  </div>
                  <p className="value-mono mt-1.5 text-[17px] font-semibold text-white">{fmtPrice(m.last, priceDp(m.symbol))}</p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted">{m.source ?? 'provider'} · 24h vol {m.volume24h ? m.volume24h.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '—'}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* INSTRUMENTS */}
      <section className="mx-auto max-w-7xl px-5 py-16">
        <p className="label">Trading instruments</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Five terminals, one account</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {INSTRUMENTS.map((i) => (
            <Link key={i.title} href={i.href} className="panel group p-5 transition-colors hover:border-white/15">
              <div className="flex items-start justify-between">
                <h3 className="text-[14px] font-semibold text-white">{i.title}</h3>
                <span className="chip">{i.tag}</span>
              </div>
              <p className="mt-2 text-[12.5px] leading-relaxed text-muted">{i.copy}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-[12px] font-medium text-lime opacity-80 transition group-hover:opacity-100">
                Open terminal
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6h7M6 2.5 9.5 6 6 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ADVANTAGES */}
      <section className="border-y border-white/[0.07] bg-ink-900/40">
        <div className="mx-auto max-w-7xl px-5 py-16">
          <p className="label">Why Vanta</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Built like a brokerage, not a demo</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {ADVANTAGES.map((a) => (
              <div key={a.title} className="panel p-5">
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg border border-lime/25 bg-lime/10">
                  <span className="h-2 w-2 rounded-sm bg-lime" />
                </div>
                <h3 className="text-[13.5px] font-semibold text-white">{a.title}</h3>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{a.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ACCOUNT TYPES */}
      <section className="mx-auto max-w-7xl px-5 py-16">
        <p className="label">Account types</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Start on paper, move to live when connected</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            { name: 'Paper', price: 'Simulated', body: 'Every new account includes a paper account funded with a simulated balance. All terminals, all order types — clearly labelled as simulated.', cta: 'Included by default', tone: 'blue' },
            { name: 'Standard', price: 'From $100', body: 'Live account with market, limit and stop orders across forex, CFDs, crypto spot and futures. Leverage up to 200× on FX.', cta: 'Requires live execution', tone: 'lime' },
            { name: 'Pro', price: 'From $5,000', body: 'Priority execution review, higher withdrawal limits, dedicated account support and extended futures leverage limits.', cta: 'Application reviewed', tone: 'emerald' },
          ].map((a) => (
            <div key={a.name} className={`panel p-5 ${a.name === 'Standard' ? 'ring-1 ring-lime/25' : ''}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-[14px] font-semibold text-white">{a.name}</h3>
                <span className="chip">{a.price}</span>
              </div>
              <p className="mt-2 text-[12.5px] leading-relaxed text-muted">{a.body}</p>
              <Link href="/accounts" className="btn-ghost mt-4 w-full py-2 text-[12.5px]">{a.cta}</Link>
            </div>
          ))}
        </div>
      </section>

      {/* SECURITY */}
      <section className="border-y border-white/[0.07] bg-ink-900/40">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <p className="label">Security & account protection</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Integrity enforced server-side</h2>
            <p className="mt-3 text-[13.5px] leading-relaxed text-muted">
              Passwords are hashed with bcrypt, sessions are stored as hashes with device and IP metadata, and withdrawal requests require
              re-authentication plus two-factor confirmation. Rate limiting, input validation and audit logging cover every privileged action.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ['bcrypt + sessions', 'Hashed credentials, revocable sessions with device history'],
              ['Two-factor', 'TOTP authenticator support for sign-in and withdrawals'],
              ['KYC workflow', 'Document submission, review queue and approval gating'],
              ['Audit trail', 'Every admin action logged with actor, IP and diff'],
            ].map(([t, b]) => (
              <div key={t} className="panel-flat p-4">
                <p className="text-[12.5px] font-semibold text-white">{t}</p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-muted">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-4xl px-5 py-16">
        <p className="label">Frequently asked</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Straight answers</h2>
        <div className="mt-6 divide-y divide-white/[0.07] overflow-hidden rounded-2xl border border-white/[0.07]">
          {FAQS.map(([q, a]) => (
            <details key={q} className="group bg-ink-850/60 px-5 py-4 open:bg-ink-850">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[13.5px] font-medium text-white">
                {q}
                <span className="text-muted transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2.5 text-[12.5px] leading-relaxed text-muted">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-5 pb-20">
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-ink-850 p-10 text-center">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_220px_at_50%_-30%,rgba(200,247,81,0.16),transparent)]" />
          <h2 className="relative text-2xl font-semibold tracking-tight text-white sm:text-3xl">Open your account in under a minute</h2>
          <p className="relative mx-auto mt-3 max-w-xl text-[13.5px] leading-relaxed text-muted">
            Register to get a live account, a funded paper account and access to every terminal. No payment details required to start.
          </p>
          <div className="relative mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/register" className="btn-primary px-6 py-3 text-[14px]">Create account</Link>
            <Link href="/login" className="btn-ghost px-6 py-3 text-[14px]">Sign in</Link>
          </div>
        </div>
      </section>
    </>
  );
}
