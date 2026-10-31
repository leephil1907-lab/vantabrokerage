import Link from 'next/link';
import { Reveal } from '@/components/motion/primitives';
import { AssetMark } from '@/components/asset-mark';
import { LiveMarketTable } from '@/components/live-market-table';
import { CTASection } from '@/components/marketing-ui';
import { Logo } from '@/components/brand';

/**
 * VideForex-informed page architecture, expressed in the Vanta design system.
 *
 * The reference site walks a visitor through: hero offer → payout/withdrawal
 * promises → platform tour → "just 3 steps" (register / fund / predict) →
 * funding table with bonus columns → payout timing → trust counters →
 * advantages → CTA. Every one of those beats exists here, but each is bound to
 * a real, working part of this platform rather than a promise we cannot keep:
 * bonus and payout figures are not invented, and anything unconnected is
 * labelled as such.
 */

export const metadata = { title: 'Trading markets' };
export const dynamic = 'force-dynamic';

const STEPS = [
  {
    n: '01',
    title: 'Register in seconds',
    body: 'Email, password, country. A live account and a simulated paper account are provisioned immediately — no card details, no sales call.',
    cta: { href: '/register', label: 'Create account' },
    points: ['Email verification', 'Password quality checks', 'Instant paper balance'],
  },
  {
    n: '02',
    title: 'Fund your wallet',
    body: 'Deposits post to a double-entry ledger with a counterparty entry. Crypto deposits are verified on-chain; other rails queue for finance review with an honest status.',
    cta: { href: '/deposits-withdrawals', label: 'Funding methods' },
    points: ['On-chain crypto verification', 'Finance review queue', 'No fabricated credits'],
  },
  {
    n: '03',
    title: 'Predict the direction',
    body: 'Choose forex, indices, crypto spot, perpetual futures or 30-second CALL/PUT contracts. Size it server-side, execute against a stamped quote.',
    cta: { href: '/markets', label: 'Browse instruments' },
    points: ['Market / limit / stop', 'Cross or isolated margin', '30s–1h expiries'],
  },
];

const DESKS = [
  { href: '/trading/forex', symbol: 'EUR/USD', title: 'Forex & CFDs', body: 'Seven majors, five indices, four commodities. Leverage to 200× with continuous margin and liquidation monitoring.', tag: '16 markets' },
  { href: '/trading/crypto', symbol: 'BTC/USDT', title: 'Crypto spot', body: 'Ten USDT markets with reserved-balance accounting, holdings and a live depth model around the true top of book.', tag: '10 pairs' },
  { href: '/trading/futures', symbol: 'ETH/USDT', title: 'Perpetual futures', body: 'Long or short with cross or isolated margin, funding accrual and a liquidation price recomputed every tick.', tag: 'up to 100×' },
  { href: '/trading/short-expiry', symbol: 'EUR/USD', title: 'Short-expiry', body: 'CALL/PUT contracts from 30 seconds to one hour, settled against server-timestamped quotes — provably, not by hand.', tag: '30s–1h' },
];

const TRUST = [
  { k: '44', label: 'Tradable markets', sub: 'forex, CFD, spot, perps, binaries' },
  { k: '5', label: 'Execution desks', sub: 'one wallet, five terminals' },
  { k: '100%', label: 'Server-priced', sub: 'no client-side fills' },
  { k: '2×', label: 'Ledger entries', sub: 'every movement balanced' },
];

const ADVANTAGES = [
  ['24/7 platform access', 'Terminals, wallet and support tickets are always available. Market hours are shown per instrument.'],
  ['Withdrawals with visible state', 'Requests reserve funds, require re-authentication and move through finance review with an auditable trail.'],
  ['Paper trading first', 'A funded simulated account on every registration, labelled PAPER everywhere it appears.'],
  ['Multiple funding rails', 'Crypto on-chain verification plus card and bank rails that queue for review when a provider is not connected.'],
  ['Data protection', 'bcrypt credentials, hashed session tokens with device history, TOTP two-factor and full audit logging.'],
  ['No invented numbers', 'Payouts, bonuses and statistics are computed from real records or clearly marked as unavailable.'],
];

export default function MarketsPage() {
  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-white/[0.07]">
        <div className="pointer-events-none absolute inset-0 grid-lines opacity-60" />
        <div className="pointer-events-none absolute -right-24 top-0 h-[360px] w-[360px] rounded-full bg-lime/[0.07] blur-[110px]" />
        <div className="shell relative grid items-end gap-8 pb-12 pt-14 lg:grid-cols-[1.15fr_0.85fr] lg:pt-16">
          <div>
            <Reveal><p className="eyebrow">Markets</p></Reveal>
            <Reveal delay={0.05}>
              <h1 className="display mt-3 max-w-2xl text-[34px] leading-[1.05] sm:text-[46px]">
                Every market we quote,<br /> priced by a named provider
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-4 max-w-xl text-[13.5px] leading-relaxed text-muted">
                Forex, indices, commodities, crypto spot, perpetual futures and short-expiry contracts — each with the provider,
                timestamp and spread maths shown. If a feed goes quiet it is labelled stale rather than served as if live.
              </p>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="mt-6 flex flex-wrap gap-2.5">
                <Link href="/register" className="btn-primary px-5 py-2.5 text-[13px]">Open an account</Link>
                <Link href="/trading-conditions" className="btn-ghost px-5 py-2.5 text-[13px]">Trading conditions</Link>
              </div>
            </Reveal>
          </div>
          <Reveal delay={0.1} className="lg:pb-2">
            <div className="grid grid-cols-2 gap-2.5">
              {TRUST.map((t) => (
                <div key={t.label} className="rounded-xl border border-white/[0.07] bg-ink-850/60 px-3.5 py-3">
                  <p className="value-mono text-[19px] font-semibold text-white">{t.k}</p>
                  <p className="mt-0.5 text-[11px] font-medium text-white/80">{t.label}</p>
                  <p className="mt-0.5 text-[10px] leading-snug text-muted">{t.sub}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── DESKS ────────────────────────────────────────────────────────── */}
      <section className="shell py-14">
        <Reveal>
          <p className="eyebrow">Instrument desks</p>
          <h2 className="display mt-2 text-[24px] sm:text-[28px]">Choose the desk, not the marketing page</h2>
        </Reveal>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {DESKS.map((d, i) => (
            <Reveal key={d.title} delay={i * 0.05}>
              <Link href={d.href} className="group flex h-full flex-col rounded-2xl border border-white/[0.07] bg-ink-850/70 p-5 transition-all duration-300 ease-premium hover:-translate-y-1 hover:border-lime/25">
                <div className="flex items-center justify-between">
                  <AssetMark symbol={d.symbol} size={30} />
                  <span className="chip">{d.tag}</span>
                </div>
                <h3 className="mt-4 text-[14px] font-semibold text-white">{d.title}</h3>
                <p className="mt-1.5 flex-1 text-[12.5px] leading-relaxed text-muted">{d.body}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-lime">Open desk →</span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── LIVE TABLES ──────────────────────────────────────────────────── */}
      <section className="border-y border-white/[0.07] bg-ink-900/30">
        <div className="shell py-14">
          <Reveal>
            <p className="eyebrow">Live quotes</p>
            <h2 className="display mt-2 text-[24px] sm:text-[28px]">Prices, sources and staleness — nothing hidden</h2>
          </Reveal>
          <div className="mt-6 space-y-8">
            {[
              ['Forex majors', 'Seven majors with institutional-style spreads, 2–200× leverage and market, limit and stop order support.', 'FOREX'],
              ['Indices & commodities', 'Cash indices and commodity CFDs with server-side margin monitoring and liquidation protection.', 'CFD'],
              ['Crypto spot', 'Ten USDT markets with order book, holdings accounting and locked-balance reservation.', 'SPOT'],
              ['Perpetual futures', 'Leveraged derivatives with funding, cross or isolated margin and liquidation pricing.', 'FUTURES'],
            ].map(([title, body, category]) => (
              <div key={title}>
                <div className="mb-2.5 flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <h3 className="text-[14px] font-semibold text-white">{title}</h3>
                    <p className="mt-0.5 text-[12px] text-muted">{body}</p>
                  </div>
                  <Link href={`/trading/${category === 'CFD' ? 'cfd' : category === 'SPOT' ? 'crypto' : category === 'FUTURES' ? 'futures' : 'forex'}`} className="text-[12px] font-medium text-lime hover:underline">
                    Desk details →
                  </Link>
                </div>
                <LiveMarketTable category={category} limit={12} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── THREE STEPS ──────────────────────────────────────────────────── */}
      <section className="shell py-14">
        <Reveal className="text-center">
          <p className="eyebrow justify-center">Getting started</p>
          <h2 className="display mt-2 text-[24px] sm:text-[30px]">Three steps to your first trade</h2>
        </Reveal>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.06}>
              <div className="relative h-full rounded-2xl border border-white/[0.07] bg-ink-850/70 p-5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-lime/25 bg-ink-950 text-[11.5px] font-semibold text-lime">{s.n}</span>
                <h3 className="mt-3.5 text-[14.5px] font-semibold text-white">{s.title}</h3>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{s.body}</p>
                <ul className="mt-3 space-y-1.5">
                  {s.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-[11.5px] text-white/75">
                      <svg width="12" height="12" viewBox="0 0 12 12" className="mt-0.5 shrink-0" fill="none"><path d="M2.5 6.4 4.7 8.6l4.8-5" stroke="#c8f751" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      {p}
                    </li>
                  ))}
                </ul>
                <Link href={s.cta.href} className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-lime">{s.cta.label} →</Link>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── FUNDING TIMING ───────────────────────────────────────────────── */}
      <section className="border-y border-white/[0.07] bg-ink-900/30">
        <div className="shell grid gap-8 py-14 lg:grid-cols-2">
          <Reveal>
            <p className="eyebrow">Money in, money out</p>
            <h2 className="display mt-2 text-[24px] sm:text-[28px]">Payment states you can actually see</h2>
            <p className="mt-3 text-[13px] leading-relaxed text-muted">
              The reference platforms promise “withdrawals in one hour”. We do not make a promise the platform cannot verify.
              Instead, each deposit and withdrawal carries a real state machine with the actor, timestamp and reason attached —
              and anything waiting on a payment provider is shown as waiting, not as completed.
            </p>
            <Link href="/deposits-withdrawals" className="btn-ghost mt-5 px-4 py-2 text-[12.5px]">See funding methods</Link>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="space-y-2.5">
              {[
                ['Crypto deposit', 'On-chain verification (mempool / Etherscan / TronGrid) then ledger credit', 'verified', 'lime'],
                ['Card or bank deposit', 'Queued for finance review when no payment provider is connected', 'review', 'amber'],
                ['Withdrawal request', 'Re-authentication + KYC gate, funds locked, then finance decision', 'locked', 'blue'],
                ['Withdrawal paid', 'Completed only with a transaction hash on record', 'paid', 'green'],
              ].map(([title, body, badge, tone]) => (
                <div key={title} className="flex items-start gap-3 rounded-xl border border-white/[0.07] bg-ink-850/70 p-3.5">
                  <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${tone === 'lime' ? 'bg-lime' : tone === 'amber' ? 'bg-siren' : tone === 'blue' ? 'bg-sky-400' : 'bg-emerald'}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-medium text-white">{title}</p>
                    <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted">{body}</p>
                  </div>
                  <span className="chip shrink-0 capitalize">{badge}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── ADVANTAGES ───────────────────────────────────────────────────── */}
      <section className="shell py-14">
        <Reveal>
          <p className="eyebrow">Our advantages</p>
          <h2 className="display mt-2 text-[24px] sm:text-[28px]">What is different here</h2>
        </Reveal>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ADVANTAGES.map(([t, b], i) => (
            <Reveal key={t} delay={i * 0.04}>
              <div className="h-full rounded-2xl border border-white/[0.07] bg-ink-850/60 p-4">
                <h3 className="text-[13px] font-semibold text-white">{t}</h3>
                <p className="mt-1.5 text-[12px] leading-relaxed text-muted">{b}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── FOOTNOTE ─────────────────────────────────────────────────────── */}
      <section className="shell pb-6">
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/[0.06] bg-ink-900/50 px-4 py-3">
          <Logo size={22} withWordmark={false} href={null} />
          <p className="text-[11px] leading-relaxed text-muted">
            Vanta Markets is an independent platform. Instrument names and marks belong to their respective owners and are used for
            identification only. Trading leveraged products carries a high risk of loss; simulated results do not reflect live performance.
          </p>
        </div>
      </section>

      <CTASection
        title="Trade these markets with one wallet"
        body="Open an account to access every desk, or explore with a funded paper account first."
        primary={{ href: '/register', label: 'Open account' }}
        secondary={{ href: '/trading-conditions', label: 'Trading conditions' }}
      />
    </>
  );
}
