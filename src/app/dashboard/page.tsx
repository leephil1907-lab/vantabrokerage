'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePolling, Badge, StatusBadge, EmptyState, Skeleton, apiFetch, useToast, SectionHeader } from '@/components/ui';
import { fmtMoney, fmtPct, fmtPrice, fmtSigned, fmtQty, priceDp, relTime, countdown } from '@/lib/format';
import { useAccount } from '@/components/terminal/account-bar';

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
  executionMode: 'unavailable';
};

export default function DashboardOverview() {
  const { accountId, select } = useAccount({ liveOnly: true });
  const [now] = useState(() => Date.now());
  const { data, error, loading, refresh } = usePolling<Overview>(accountId ? `/api/overview?accountId=${accountId}` : null, 12_000);
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

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-2xl border border-white/[.08] bg-[#111916] px-5 py-7 sm:px-8 sm:py-9">
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-32 h-80 w-80 rounded-full bg-lime/[.09] blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div><p className="text-[10px] font-semibold uppercase tracking-[.22em] text-lime">Your workspace / Overview</p><h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Welcome back{data?.profile.firstName ? `, ${data.profile.firstName}` : ''}<span className="text-lime">.</span></h1><p className="mt-3 max-w-xl text-sm leading-relaxed text-white/50">Your markets, activity and account in one place.</p>
            <div className="mt-6 flex flex-wrap gap-2"><Link href="/dashboard/trade" className="btn-primary px-4 py-2.5 text-xs">Explore trading <span aria-hidden="true">↗</span></Link><Link href="/dashboard/deposits" className="btn-ghost px-4 py-2.5 text-xs">View funding</Link></div></div>
          <div className="min-w-[210px] rounded-xl border border-white/[.08] bg-black/20 p-4"><p className="text-[10px] uppercase tracking-[.16em] text-white/45">Market information</p><p className="mt-2 text-sm font-medium text-white">Reference prices</p><p className="mt-1 text-[11px] text-white/45">Subject to data availability</p></div>
        </div>
      </section>

      {data && data.profile.kycStatus !== 'APPROVED' && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-siren/25 bg-siren/[0.07] px-4 py-3">
          <div>
            <p className="text-[12.5px] font-semibold text-siren">
              {data.profile.kycStatus === 'PENDING' ? 'Identity review in progress' : 'Complete identity verification'}
            </p>
            <p className="mt-0.5 text-[11.5px] text-muted">
              {data.profile.kycStatus === 'PENDING'
                ? 'Your documents are queued for compliance review. Withdrawals unlock once approved.'
                : 'Verification is required before withdrawals. It takes a couple of minutes to submit.'}
            </p>
          </div>
          <Link href="/dashboard/verification" className="btn-ghost px-3 py-1.5 text-[12px]">Open verification</Link>
        </div>
      )}
      {data && !data.profile.emailVerified && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <p className="text-[12px] text-muted">Your email address is not verified yet. Verify it to secure withdrawals and password recovery.</p>
          <button
            onClick={async () => {
              try {
                const r = await apiFetch<{ delivery: { configured: boolean; delivered: boolean } }>('/api/auth/resend-verification', { method: 'POST' });
                push({
                  tone: r.delivery.delivered ? 'success' : 'info',
                  title: r.delivery.delivered ? 'Verification email sent' : 'Email delivery unavailable',
                  body: r.delivery.delivered ? 'Check your inbox for the verification link.' : 'Email delivery is unavailable. Contact support.',
                });
              } catch (e) { push({ tone: 'error', title: 'Could not resend', body: (e as Error).message }); }
            }}
            className="btn-ghost px-3 py-1.5 text-[12px]"
          >
            Resend verification
          </button>
        </div>
      )}

      {loading && !data ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : error && !data ? (
        <div className="panel p-6 text-center text-[12.5px] text-muted">Could not load your account: {error}</div>
      ) : data ? (
        <>
          {/* KPI row */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Account equity" value={fmtMoney(data.equity.equity)} sub="Recorded ledger balance" accent />
            <Stat label="Unrealised P/L" value={fmtSigned(data.equity.unrealizedPnl)} sub={`${data.openPositions.length} open positions`} tone={data.equity.unrealizedPnl >= 0 ? 'up' : 'down'} />
            <Stat label="Margin in use" value={fmtMoney(data.equity.marginUsed)} sub={`${fmtMoney(data.equity.locked)} locked balance`} />
            <Stat label="Open orders" value={String(data.openOrders.length)} sub="Orders on this account" />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
            <div className="space-y-4">
              {/* Positions */}
              <section className="panel overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
                  <SectionHeader title="Open positions" subtitle="Your account positions" />
                  <Link href="/dashboard/positions" className="text-[11.5px] text-lime hover:underline">All positions</Link>
                </div>
                {data.openPositions.length === 0 ? (
                  <EmptyState title="No open positions" body="Your positions will appear here when live trading is available." action={<Link href="/dashboard/forex" className="btn-primary px-3 py-1.5 text-[12px]">Open terminal</Link>} />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px]">
                      <thead><tr><th className="th">Market</th><th className="th">Side</th><th className="th text-right">Qty</th><th className="th text-right">Entry</th><th className="th text-right">Mark</th><th className="th text-right">P/L</th><th className="th text-right">Liq.</th><th className="th"></th></tr></thead>
                      <tbody>
                        {data.openPositions.map((p) => (
                          <tr key={p.id} className="table-row">
                            <td className="td font-medium text-white">{p.symbol}<span className="ml-1.5 text-[10px] text-muted">{p.leverage}×</span></td>
                            <td className="td"><Badge tone={p.side === 'LONG' ? 'green' : 'red'}>{p.side}</Badge></td>
                            <td className="td text-right value-mono">{fmtQty(p.qty, 4)}</td>
                            <td className="td text-right value-mono">{fmtPrice(p.entryPrice, priceDp(p.symbol))}</td>
                            <td className="td text-right value-mono">{fmtPrice(p.markPrice, priceDp(p.symbol))}</td>
                            <td className={`td text-right value-mono ${p.unrealizedPnl >= 0 ? 'text-emerald' : 'text-danger'}`}>{fmtSigned(p.unrealizedPnl)}</td>
                            <td className="td text-right value-mono text-muted">{p.liquidationPrice ? fmtPrice(p.liquidationPrice, priceDp(p.symbol)) : '—'}</td>
                            <td className="td text-right">
                              <button onClick={() => closePosition(p.id, p.symbol)} className="rounded-md border border-white/10 px-2 py-1 text-[10.5px] font-medium text-muted transition hover:border-danger/40 hover:text-danger">Close</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* Orders */}
              <section className="panel overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
                  <SectionHeader title="Open orders" subtitle="Resting limit & stop orders with reserved margin" />
                  <Link href="/dashboard/orders" className="text-[11.5px] text-lime hover:underline">All orders</Link>
                </div>
                {data.openOrders.length === 0 ? (
                  <EmptyState title="No resting orders" body="Limit and stop orders appear here until they fill, expire or are cancelled." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px]">
                      <thead><tr><th className="th">Market</th><th className="th">Side</th><th className="th">Type</th><th className="th text-right">Qty</th><th className="th text-right">Price</th><th className="th">Placed</th><th className="th"></th></tr></thead>
                      <tbody>
                        {data.openOrders.map((o) => (
                          <tr key={o.id} className="table-row">
                            <td className="td font-medium text-white">{o.symbol}</td>
                            <td className="td"><Badge tone={o.side === 'BUY' ? 'green' : 'red'}>{o.side}</Badge></td>
                            <td className="td text-[11.5px] text-muted">{o.type}</td>
                            <td className="td text-right value-mono">{fmtQty(o.qty, 4)}</td>
                            <td className="td text-right value-mono">{o.price ? fmtPrice(o.price, priceDp(o.symbol)) : 'market'}</td>
                            <td className="td text-[11.5px] text-muted">{relTime(o.createdAt)}</td>
                            <td className="td text-right">
                              <button onClick={() => cancelOrder(o.id)} className="rounded-md border border-white/10 px-2 py-1 text-[10.5px] font-medium text-muted transition hover:border-danger/40 hover:text-danger">Cancel</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* Short expiry */}
              {data.openBinary.length > 0 && (
                <section className="panel p-4">
                  <SectionHeader title="Active short-expiry contracts" subtitle="Settled server-side at expiry against a fresh quote" />
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {data.openBinary.map((t) => {
                      const msLeft = new Date(t.expiresAt).getTime() - now;
                      return (
                        <div key={t.id} className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-ink-900/70 px-3 py-2.5">
                          <div>
                            <p className="text-[12px] font-medium text-white">{t.symbol} <Badge tone={t.direction === 'CALL' ? 'green' : 'red'}>{t.direction}</Badge></p>
                            <p className="mt-1 text-[10.5px] text-muted">stake {fmtMoney(t.stake)} · entry {t.entryPrice} · <Badge tone="blue">{t.env}</Badge></p>
                          </div>
                          <span className="value-mono text-[13px] font-semibold text-lime">{countdown(msLeft)}</span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>

            <div className="space-y-4">
              {/* Accounts */}
              <section className="panel p-4">
                <SectionHeader title="Accounts" subtitle="Recorded account balances" />
                <div className="mt-3 space-y-2">
                  {data.accounts.filter((a) => a.type === 'LIVE').map((a) => (
                    <button
                      key={a.id}
                      onClick={() => select(a.id)}
                      className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${accountId === a.id ? 'border-lime/30 bg-lime/[0.06]' : 'border-white/[0.07] bg-ink-900/50 hover:border-white/15'}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-[12px] font-semibold text-white">
                          {a.type}
                        </span>
                        <span className="value-mono text-[12px] text-white">{fmtMoney(a.equity.equity)}</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[10.5px] text-muted">
                        <span>available {fmtMoney(a.available)}</span>
                        <span className={a.equity.unrealizedPnl >= 0 ? 'text-emerald' : 'text-danger'}>{fmtSigned(a.equity.unrealizedPnl)} open</span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              {/* Market watch */}
              <section className="panel p-4">
                <div className="flex items-center justify-between">
                  <SectionHeader title="Market watch" subtitle="External reference prices · not execution quotes" />
                </div>
                <div className="mt-2 divide-y divide-white/[0.05]">
                  {data.markets.slice(0, 8).map((m) => {
                    const up = (m.change24h ?? 0) >= 0;
                    return (
                      <Link key={m.symbol} href="/dashboard/markets" className="flex items-center justify-between py-2">
                        <div>
                          <p className="text-[12px] font-medium text-white">{m.symbol}</p>
                          <p className="text-[9.5px] uppercase tracking-wide text-muted">{m.stale ? 'Delayed reference' : 'Reference price'}</p>
                        </div>
                        <div className="text-right">
                          <p className="value-mono text-[11.5px] text-white">{fmtPrice(m.last, priceDp(m.symbol))}</p>
                          <p className={`value-mono text-[10px] ${up ? 'text-emerald' : 'text-danger'}`}>{fmtPct(m.change24h)}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>

              {/* Transactions */}
              <section className="panel p-4">
                <div className="flex items-center justify-between">
                  <SectionHeader title="Recent ledger activity" />
                  <Link href="/dashboard/transactions" className="text-[11.5px] text-lime hover:underline">All</Link>
                </div>
                {data.recentTransactions.length === 0 ? (
                  <p className="mt-3 text-[11.5px] text-muted">No ledger entries yet.</p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {data.recentTransactions.map((t) => (
                      <div key={t.id} className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-[11.5px] text-white/90">{t.description ?? t.type}</p>
                          <p className="text-[10px] text-muted">{relTime(t.createdAt)} · {t.type.replace(/_/g, ' ')}</p>
                        </div>
                        <span className={`value-mono shrink-0 text-[11.5px] ${t.direction === 'CREDIT' ? 'text-emerald' : 'text-white'}`}>
                          {t.direction === 'CREDIT' ? '+' : '−'}{fmtMoney(t.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function Stat({ label, value, sub, tone, accent }: { label: string; value: string; sub?: string; tone?: 'up' | 'down'; accent?: boolean }) {
  return (
    <div className={`panel p-4 ${accent ? 'ring-1 ring-lime/20' : ''}`}>
      <p className="label">{label}</p>
      <p className={`value-mono mt-1.5 text-[20px] font-semibold ${tone === 'up' ? 'text-emerald' : tone === 'down' ? 'text-danger' : 'text-white'}`}>{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-muted">{sub}</p>}
    </div>
  );
}
