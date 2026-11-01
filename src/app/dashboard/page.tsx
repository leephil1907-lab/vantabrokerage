'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { usePolling, Badge, EmptyState, Skeleton, apiFetch, useToast } from '@/components/ui';
import { fmtMoney, fmtPct, fmtPrice, fmtSigned, fmtQty, priceDp, relTime } from '@/lib/format';
import { useAccount } from '@/components/terminal/account-bar';

type EquityPoint = { day: string; balance: number };
type Overview = {
  profile: { firstName: string | null; lastName: string | null; email: string; kycStatus: string; emailVerified: boolean };
  accounts: { id: string; type: string; available: number; locked: number; isDefault: boolean; equity: { equity: number; unrealizedPnl: number; realizedPnl: number; marginUsed: number; binaryAtRisk: number } }[];
  activeAccount: { id: string; type: string };
  equity: { available: number; locked: number; unrealizedPnl: number; realizedPnl: number; binaryAtRisk: number; marginUsed: number; equity: number };
  openPositions: { id: string; symbol: string; side: string; qty: number; entryPrice: number; markPrice: number | null; unrealizedPnl: number; leverage: number; margin: number; liquidationPrice: number | null }[];
  openOrders: { id: string; symbol: string; side: string; type: string; qty: number; price: number | null; status: string; createdAt: string }[];
  openBinary: { id: string; symbol: string; direction: string; stake: number; entryPrice: number; expiresAt: string; env: string }[];
  recentTransactions: { id: string; direction: string; amount: number; type: string; description: string | null; createdAt: string }[];
  markets: { symbol: string; category: string; last: number | null; change24h: number | null; source: string | null; stale: boolean }[];
  unreadNotifications: number;
  executionMode: 'paper' | 'internal';
  equityCurve: EquityPoint[];
  allocation: { label: string; value: number }[];
};

const DONUT_COLORS = ['#dfc088', '#2ee6a8', '#60a5fa', '#ffb020', '#ff5b6e', '#a78bfa', '#f472b6', '#8a97a6'];

function StatCard({ label, value, sub, tone, icon }: { label: string; value: string; sub?: React.ReactNode; tone?: 'up' | 'down' | 'neutral'; icon: React.ReactNode }) {
  return (
    <div className="panel relative overflow-hidden p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-muted">{label}</p>
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-lime">{icon}</span>
      </div>
      <p className={`mt-2 font-mono text-[22px] font-semibold leading-none tracking-tight sm:text-[26px] ${tone === 'up' ? 'text-emerald' : tone === 'down' ? 'text-danger' : 'text-white'}`}>{value}</p>
      {sub && <div className="mt-2 text-[11px] text-muted">{sub}</div>}
    </div>
  );
}

function EquityChart({ curve, equity, range }: { curve: EquityPoint[]; equity: number; range: '7D' | '30D' | 'ALL' }) {
  const points = useMemo(() => {
    const cutoff = range === 'ALL' ? 0 : Date.now() - (range === '7D' ? 7 : 30) * 86_400_000;
    const filtered = curve.filter((p) => new Date(p.day).getTime() >= cutoff);
    const withNow = [...filtered, { day: new Date().toISOString().slice(0, 10), balance: equity }];
    return withNow.length > 1 ? withNow : [{ day: 'a', balance: equity }, { day: 'b', balance: equity }];
  }, [curve, equity, range]);
  const W = 600, H = 190, PAD = 8;
  const vals = points.map((p) => p.balance);
  const min = Math.min(...vals), max = Math.max(...vals);
  const span = max - min || Math.max(1, Math.abs(max) * 0.02);
  const x = (i: number) => PAD + (i * (W - PAD * 2)) / Math.max(1, points.length - 1);
  const y = (v: number) => H - PAD - ((v - (min - span * 0.15)) / (span * 1.3)) * (H - PAD * 2);
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.balance).toFixed(1)}`).join(' ');
  const area = `${path} L${x(points.length - 1).toFixed(1)},${H} L${x(0).toFixed(1)},${H} Z`;
  const up = points[points.length - 1].balance >= points[0].balance;
  const stroke = up ? 'var(--chart-up)' : 'var(--chart-down)';
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-[170px] w-full sm:h-[210px]" preserveAspectRatio="none" role="img" aria-label="Account balance history">
        <defs>
          <linearGradient id="eqfill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => <line key={f} x1={PAD} x2={W - PAD} y1={H * f} y2={H * f} stroke="var(--line)" strokeWidth="1" />)}
        <path d={area} fill="url(#eqfill)" />
        <path d={path} fill="none" stroke={stroke} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={x(points.length - 1)} cy={y(points[points.length - 1].balance)} r="4" fill={stroke} />
      </svg>
      <div className="pointer-events-none absolute right-2 top-1 text-right">
        <p className="font-mono text-sm font-semibold text-white">{fmtMoney(equity)}</p>
        <p className="text-[10px] text-muted">{points[0].day} → today</p>
      </div>
    </div>
  );
}

function Donut({ allocation }: { allocation: { label: string; value: number }[] }) {
  const total = allocation.reduce((s, a) => s + a.value, 0);
  if (total <= 0) return <p className="px-1 py-6 text-center text-[12px] text-muted">No allocation yet — place your first trade or add funds to see diversification.</p>;
  const R = 42, C = 2 * Math.PI * R;
  let acc = 0;
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 100 100" className="h-[124px] w-[124px] shrink-0 -rotate-90" role="img" aria-label="Portfolio allocation">
        <circle cx="50" cy="50" r={R} fill="none" stroke="var(--line)" strokeWidth="11" />
        {allocation.map((a, i) => {
          const frac = a.value / total;
          const dash = `${frac * C} ${C}`;
          const off = -acc * C;
          acc += frac;
          return <circle key={a.label} cx="50" cy="50" r={R} fill="none" stroke={DONUT_COLORS[i % DONUT_COLORS.length]} strokeWidth="11" strokeDasharray={dash} strokeDashoffset={off} strokeLinecap="butt" />;
        })}
      </svg>
      <ul className="min-w-0 flex-1 space-y-1.5">
        {allocation.slice(0, 6).map((a, i) => (
          <li key={a.label} className="flex items-center justify-between gap-2 text-[11.5px]">
            <span className="flex min-w-0 items-center gap-2 text-muted"><i className="h-2 w-2 shrink-0 rounded-full" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />{a.label}</span>
            <span className="font-mono text-white">{((a.value / total) * 100).toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function DashboardOverview() {
  const { accounts, accountId, select, active } = useAccount();
  const [range, setRange] = useState<'7D' | '30D' | 'ALL'>('30D');
  const { data, error, loading, refresh } = usePolling<Overview>(accountId ? `/api/overview?accountId=${accountId}` : null, 10_000);
  const { push } = useToast();

  const closePosition = async (id: string, symbol: string) => {
    try {
      const res = await apiFetch<{ pnl: number; exitPrice: number }>(`/api/trades/positions/${id}`, { method: 'DELETE' });
      push({ tone: res.pnl >= 0 ? 'success' : 'info', title: `${symbol} closed`, body: `Realised ${fmtSigned(res.pnl)} at ${fmtPrice(res.exitPrice, priceDp(symbol))}.` });
      refresh();
    } catch (e) {
      push({ tone: 'error', title: 'Could not close position', body: (e as Error).message });
    }
  };

  const cancelOrder = async (id: string) => {
    try {
      await apiFetch(`/api/trades/orders/${id}`, { method: 'DELETE' });
      push({ tone: 'success', title: 'Order cancelled', body: 'Reserved funds released back to your available balance.' });
      refresh();
    } catch (e) {
      push({ tone: 'error', title: 'Could not cancel order', body: (e as Error).message });
    }
  };

  const eq = data?.equity;
  const freeMargin = eq ? eq.equity - eq.marginUsed : 0;
  const marginLevel = eq && eq.marginUsed > 0 ? (eq.equity / eq.marginUsed) * 100 : null;

  return (
    <div className="space-y-5">
      {/* ── Header: greeting + account switcher ─────────────────────────── */}
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-lime">Account overview</p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {data?.profile.firstName ? `Good day, ${data.profile.firstName}` : 'Your trading account'}
          </h1>
          <p className="mt-1 text-[12px] text-muted">
            {active?.type === 'PAPER' ? 'Demo account · virtual funds, internal dealing' : 'Live account · internal dealing at reference quotes'} · refreshed every 10s
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {accounts.map((a) => (
            <button
              key={a.id}
              onClick={() => select(a.id)}
              className={`rounded-xl border px-3.5 py-2 text-left transition ${accountId === a.id ? 'border-lime/60 bg-lime/10 shadow-glow' : 'border-white/10 bg-white/[0.03] hover:border-white/25'}`}
            >
              <span className="block text-[10px] font-semibold uppercase tracking-[.14em] text-muted">{a.type === 'PAPER' ? 'Demo account' : 'Live account'}</span>
              <span className="mt-0.5 block font-mono text-[13px] font-semibold text-white">{fmtMoney(a.equity?.equity ?? a.available)}</span>
            </button>
          ))}
          <Link href="/dashboard/trade" className="btn-primary px-4 py-2.5 text-xs">Open terminal ↗</Link>
        </div>
      </section>

      {/* ── Live price ticker ────────────────────────────────────────────── */}
      {data && data.markets.length > 0 && (
        <div className="panel -mx-1 overflow-x-auto px-1 py-2">
          <div className="flex min-w-max gap-2 px-1">
            {data.markets.map((m) => (
              <span key={m.symbol} className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 text-[11px]">
                <strong className="font-semibold text-white">{m.symbol}</strong>
                <span className="font-mono text-muted">{m.last != null ? fmtPrice(m.last, priceDp(m.symbol)) : '—'}</span>
                <span className={`font-mono ${((m.change24h ?? 0) >= 0) ? 'text-emerald' : 'text-danger'}`}>{fmtPct(m.change24h)}</span>
                {m.stale && <Badge tone="amber">delayed</Badge>}
              </span>
            ))}
          </div>
        </div>
      )}

      {data && data.profile.kycStatus !== 'APPROVED' && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-siren/25 bg-siren/[0.07] px-4 py-3">
          <div>
            <p className="text-[12.5px] font-semibold text-siren">{data.profile.kycStatus === 'PENDING' ? 'Identity review in progress' : 'Complete identity verification'}</p>
            <p className="mt-0.5 text-[11.5px] text-muted">{data.profile.kycStatus === 'PENDING' ? 'Your documents are queued for compliance review. Withdrawals unlock once approved.' : 'Verification is required before withdrawals. It takes a couple of minutes to submit.'}</p>
          </div>
          <Link href="/dashboard/verification" className="btn-ghost px-3 py-1.5 text-[12px]">Open verification</Link>
        </div>
      )}

      {/* ── Stat cards ───────────────────────────────────────────────────── */}
      {!eq ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[104px]" />)}</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Account balance" value={fmtMoney(eq.equity)} tone="neutral"
            sub={<span>{fmtMoney(eq.available)} available · {fmtMoney(eq.locked)} in orders</span>}
            icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="3" /><path d="M2 10h20" /></svg>} />
          <StatCard label="Realised P&L" value={fmtSigned(eq.realizedPnl)} tone={eq.realizedPnl >= 0 ? 'up' : 'down'}
            sub={<span>earned across closed trades</span>}
            icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 17l6-6 4 4 8-8" /><path d="M14 7h7v7" /></svg>} />
          <StatCard label="Open P&L" value={fmtSigned(eq.unrealizedPnl)} tone={eq.unrealizedPnl >= 0 ? 'up' : 'down'}
            sub={<span>{data?.openPositions.length ?? 0} open position{(data?.openPositions.length ?? 0) === 1 ? '' : 's'} · marked live</span>}
            icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>} />
          <StatCard label="Margin & buying power" value={fmtMoney(freeMargin)} tone="neutral"
            sub={<span>{fmtMoney(eq.marginUsed)} used{marginLevel != null ? <> · level {fmtPct(marginLevel, 0)}</> : null}</span>}
            icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v18" /><path d="M5 8l7-5 7 5" /><path d="M5 16l7 5 7-5" /></svg>} />
        </div>
      )}

      {/* ── Main grid ────────────────────────────────────────────────────── */}
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          {/* Portfolio performance */}
          <section className="panel p-4 sm:p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div><h2 className="text-[15px] font-semibold text-white">Portfolio performance</h2><p className="text-[11px] text-muted">Balance history from your ledger</p></div>
              <div className="flex items-center gap-0.5 rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
                {(['7D', '30D', 'ALL'] as const).map((r) => (
                  <button key={r} onClick={() => setRange(r)} className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${range === r ? 'bg-white/10 text-white' : 'text-muted hover:text-white'}`}>{r}</button>
                ))}
              </div>
            </div>
            {data ? <EquityChart curve={data.equityCurve} equity={eq?.equity ?? 0} range={range} /> : <Skeleton className="h-[190px]" />}
          </section>

          {/* Transactions */}
          <section className="panel overflow-hidden">
            <div className="flex items-center justify-between px-4 pt-4 sm:px-5">
              <div><h2 className="text-[15px] font-semibold text-white">Recent activity</h2><p className="text-[11px] text-muted">Deposits, trades, fees and settlements</p></div>
              <Link href="/dashboard/transactions" className="text-[11.5px] font-semibold text-lime hover:underline">View all</Link>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[540px] text-left text-[12px]">
                <thead><tr className="border-b border-white/[0.07] text-[10px] uppercase tracking-[.14em] text-muted">
                  <th className="px-4 py-2 font-semibold sm:px-5">Date</th><th className="px-4 py-2 font-semibold">Description</th><th className="px-4 py-2 font-semibold">Type</th><th className="px-4 py-2 text-right font-semibold sm:px-5">Amount</th>
                </tr></thead>
                <tbody>
                  {!data ? <tr><td colSpan={4} className="px-5 py-6"><Skeleton className="h-16" /></td></tr>
                    : data.recentTransactions.length === 0 ? <tr><td colSpan={4} className="px-5 py-8 text-center text-muted">No activity yet — your trades and funding will appear here.</td></tr>
                    : data.recentTransactions.map((t) => (
                      <tr key={t.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]">
                        <td className="whitespace-nowrap px-4 py-2.5 text-muted sm:px-5">{relTime(t.createdAt)}</td>
                        <td className="max-w-[260px] truncate px-4 py-2.5 text-white">{t.description ?? t.type}</td>
                        <td className="px-4 py-2.5"><Badge tone="gray">{t.type.replace(/_/g, ' ').toLowerCase()}</Badge></td>
                        <td className={`whitespace-nowrap px-4 py-2.5 text-right font-mono font-semibold sm:px-5 ${t.direction === 'CREDIT' ? 'text-emerald' : 'text-danger'}`}>{t.direction === 'CREDIT' ? '+' : '−'}{fmtMoney(t.amount)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Wallet card */}
          <section className="relative overflow-hidden rounded-2xl border border-lime/25 bg-gradient-to-br from-[#16240f] via-[#101a0c] to-[#0b120a] p-5 shadow-panel">
            <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-lime/15 blur-3xl" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-lime">Trading wallet</p>
                <span className="font-mono text-[10px] text-white/50">{active?.type === 'PAPER' ? 'DEMO' : 'LIVE'} · USD</span>
              </div>
              <p className="mt-3 font-mono text-[30px] font-semibold leading-none tracking-tight text-white">{eq ? fmtMoney(eq.equity) : '—'}</p>
              <dl className="mt-4 space-y-2 text-[12px]">
                <div className="flex items-center justify-between"><dt className="flex items-center gap-2 text-white/60"><i className="h-1.5 w-1.5 rounded-full bg-lime" />Available</dt><dd className="font-mono font-semibold text-white">{eq ? fmtMoney(eq.available) : '—'}</dd></div>
                <div className="flex items-center justify-between"><dt className="flex items-center gap-2 text-white/60"><i className="h-1.5 w-1.5 rounded-full bg-sky" />In orders & margin</dt><dd className="font-mono font-semibold text-white">{eq ? fmtMoney(eq.locked + eq.marginUsed) : '—'}</dd></div>
                <div className="flex items-center justify-between"><dt className="flex items-center gap-2 text-white/60"><i className="h-1.5 w-1.5 rounded-full bg-siren" />At risk (short-expiry)</dt><dd className="font-mono font-semibold text-white">{eq ? fmtMoney(eq.binaryAtRisk) : '—'}</dd></div>
              </dl>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <Link href="/dashboard/deposits" className="btn-primary justify-center px-3 py-2.5 text-[12px]">↓ Deposit</Link>
                <Link href="/dashboard/withdrawals" className="btn-ghost justify-center px-3 py-2.5 text-[12px]">↑ Withdraw</Link>
              </div>
              <p className="mt-3 text-[10px] leading-relaxed text-white/40">Virtual trading capital — no cash value. Real funding rails are not connected to this environment.</p>
            </div>
          </section>

          {/* Diversification */}
          <section className="panel p-4 sm:p-5">
            <h2 className="text-[15px] font-semibold text-white">Diversification</h2>
            <p className="mb-4 text-[11px] text-muted">Cash, committed funds and holdings at reference marks</p>
            {data ? <Donut allocation={data.allocation} /> : <Skeleton className="h-[124px]" />}
          </section>

          {/* Open positions */}
          <section className="panel overflow-hidden">
            <div className="flex items-center justify-between px-4 pt-4 sm:px-5">
              <h2 className="text-[15px] font-semibold text-white">Open positions</h2>
              <Link href="/dashboard/positions" className="text-[11.5px] font-semibold text-lime hover:underline">All</Link>
            </div>
            <div className="mt-2 px-2 pb-3 sm:px-3">
              {!data ? <Skeleton className="h-20" /> : data.openPositions.length === 0 ? (
                <EmptyState title="No open positions" body="Place an order from the terminal to see live positions here."
                  action={<Link href="/dashboard/trade" className="btn-primary px-3 py-1.5 text-[11.5px]">Open terminal</Link>} />
              ) : data.openPositions.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 mb-2 last:mb-0">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-[12.5px] font-semibold text-white">{p.symbol}
                      <Badge tone={p.side === 'LONG' ? 'green' : 'red'}>{p.side} {p.leverage > 1 ? `${p.leverage}x` : ''}</Badge>
                    </p>
                    <p className="mt-0.5 font-mono text-[10.5px] text-muted">{fmtQty(p.qty, priceDp(p.symbol) + 2)} @ {fmtPrice(p.entryPrice, priceDp(p.symbol))} → {p.markPrice != null ? fmtPrice(p.markPrice, priceDp(p.symbol)) : '…'}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-mono text-[12.5px] font-semibold ${p.unrealizedPnl >= 0 ? 'text-emerald' : 'text-danger'}`}>{fmtSigned(p.unrealizedPnl)}</p>
                    <button onClick={() => closePosition(p.id, p.symbol)} className="mt-1 text-[10.5px] font-semibold text-muted hover:text-white">Close</button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Working orders */}
          <section className="panel overflow-hidden">
            <div className="flex items-center justify-between px-4 pt-4 sm:px-5">
              <h2 className="text-[15px] font-semibold text-white">Working orders</h2>
              <Link href="/dashboard/orders" className="text-[11.5px] font-semibold text-lime hover:underline">All</Link>
            </div>
            <div className="mt-2 px-2 pb-3 sm:px-3">
              {!data ? <Skeleton className="h-16" /> : data.openOrders.length === 0 ? (
                <p className="px-2 py-5 text-center text-[11.5px] text-muted">No resting orders. Limit and stop orders wait here until triggered.</p>
              ) : data.openOrders.map((o) => (
                <div key={o.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 mb-2 last:mb-0">
                  <div><p className="text-[12.5px] font-semibold text-white">{o.symbol} <Badge tone="gray">{o.type}</Badge></p>
                    <p className="mt-0.5 font-mono text-[10.5px] text-muted">{o.side} {fmtQty(o.qty)} @ {o.price != null ? fmtPrice(o.price, priceDp(o.symbol)) : 'market'}</p></div>
                  <button onClick={() => cancelOrder(o.id)} className="text-[10.5px] font-semibold text-danger hover:underline">Cancel</button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {error && <p className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-[12px] text-danger">{error}</p>}
      {loading && !data && <Skeleton className="h-40" />}
    </div>
  );
}
