'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { MarketList, type MarketRow } from '@/components/market-selector';
import { OrderPanel } from '@/components/terminal/order-panel';
import { useAccount } from '@/components/terminal/account-bar';
import { TerminalWorkspace } from '@/components/terminal/workspace';
import { ProChart } from '@/components/charts/pro-chart';
import { SessionStats } from '@/components/charts/analysis';
import { Tabs, Badge, apiFetch, useToast, EmptyState } from '@/components/ui';
import { AssetMark } from '@/components/asset-mark';
import { AnimatedNumber } from '@/components/motion/primitives';
import { useMarkets } from '@/lib/use-markets';
import { fmtMoney, fmtPct, fmtPrice, fmtQty, fmtSigned, priceDp, relTime } from '@/lib/format';

type Position = { id: string; symbol: string; side: string; qty: number; entryPrice: number; markPrice: number | null; unrealizedPnl: number; leverage: number; marginMode: string; initialMargin: number; liquidationPrice: number | null; takeProfit: number | null; stopLoss: number | null; openedAt: string };
type Order = { id: string; symbol: string; side: string; type: string; status: string; qty: number; price: number | null; leverage: number; createdAt: string };
type Execution = { id: string; symbol: string; side: string; qty: number; price: number; fee: number; venue: string; createdAt: string };
type Quote = { last: number; bid: number; ask: number; change24h?: number; high24h?: number | null; low24h?: number | null; volume24h?: number | null; source: string; fetchedAt?: string; stale?: boolean };

export type DeskKind = 'forex' | 'crypto' | 'futures';

const CFG: Record<DeskKind, { title: string; sub: string; categories: string[]; defaultSymbol: string }> = {
  forex: {
    title: 'Forex & CFD desk',
    sub: 'Trade forex and CFD instruments in the internal paper environment using provider-fed reference quotes.',
    categories: ['FOREX', 'CFD'],
    defaultSymbol: 'EUR/USD',
  },
  crypto: {
    title: 'Crypto spot desk',
    sub: 'Trade spot crypto in the internal paper environment using provider-fed reference quotes.',
    categories: ['SPOT'],
    defaultSymbol: 'BTC/USDT',
  },
  futures: {
    title: 'Perpetual futures desk',
    sub: 'Trade supported perpetual futures in the internal paper environment using provider-fed reference quotes.',
    categories: ['FUTURES'],
    defaultSymbol: 'BTC/USDT-PERP',
  },
};

export function TerminalDesk({ kind }: { kind: DeskKind }) {
  const cfg = CFG[kind];
  const { markets, error: marketsError } = useMarkets();
  const tradable = useMemo(() => markets.filter((m) => cfg.categories.includes(m.category)), [markets, cfg.categories]);
  const { accountId, active, reloadAccounts } = useAccount({ paperOnly: true });
  const { push } = useToast();

  const search = useSearchParams();
  const requested = search.get('symbol');
  const [symbol, setSymbol] = useState(requested ?? cfg.defaultSymbol);
  const [quote, setQuote] = useState<Quote | null>(null);
  const requestSeq = useRef(0);
  const [positions, setPositions] = useState<Position[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [tab, setTab] = useState<'positions' | 'orders' | 'history'>('positions');
  const [watching, setWatching] = useState<string[]>([]);

  const meta = tradable.find((m) => m.symbol === symbol) ?? markets.find((m) => m.symbol === symbol);
  const dp = meta?.pricePrecision ?? priceDp(symbol);

  // Deep links (`?symbol=`) from the command palette and market tables.
  useEffect(() => {
    if (requested && requested !== symbol) setSymbol(requested);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requested]);

  useEffect(() => {
    if (!tradable.length) return;
    if (!tradable.some((m) => m.symbol === symbol)) setSymbol(cfg.defaultSymbol);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tradable.length]);

  useEffect(() => {
    fetch('/api/watchlist', { cache: 'no-store' }).then((r) => r.json()).then((b) => setWatching(b.symbols ?? [])).catch(() => undefined);
  }, []);

  const load = useCallback(async () => {
    if (!accountId) return;
    const seq = ++requestSeq.current;
    try {
      const [q, p, o, h] = await Promise.all([
        apiFetch<Quote>(`/api/markets/${encodeURIComponent(symbol)}/quote`),
        apiFetch<{ positions: Position[] }>(`/api/trades/positions?accountId=${accountId}`),
        apiFetch<{ orders: Order[] }>(`/api/trades/orders?accountId=${accountId}&status=open`),
        apiFetch<{ executions: Execution[] }>(`/api/trades/history?accountId=${accountId}`).catch(() => ({ executions: [] })),
      ]);
      if (seq !== requestSeq.current) return;
      setQuote(q);
      setPositions(p.positions);
      setOrders(o.orders);
      setExecutions(h.executions ?? []);
    } catch { /* feed status is surfaced in the chart footer and toasts */ }
  }, [accountId, symbol]);

  useEffect(() => {
    setQuote(null);
    load();
    const id = setInterval(load, 9000);
    return () => { ++requestSeq.current; clearInterval(id); };
  }, [load]);

  const toggleWatch = async (s: string) => {
    try {
      const res = await apiFetch<{ watching: boolean }>('/api/watchlist', { method: 'POST', body: JSON.stringify({ symbol: s, action: 'toggle' }) });
      setWatching((prev) => (res.watching ? [...prev, s] : prev.filter((x) => x !== s)));
    } catch (e) { push({ tone: 'error', title: 'Watchlist update failed', body: (e as Error).message }); }
  };

  const closePosition = async (p: Position) => {
    try {
      const res = await apiFetch<{ pnl: number; exitPrice: number }>(`/api/trades/positions/${p.id}`, { method: 'DELETE' });
      push({ tone: res.pnl >= 0 ? 'success' : 'info', title: `${p.symbol} closed`, body: `Exit ${fmtPrice(res.exitPrice, priceDp(p.symbol))} · realised ${fmtSigned(res.pnl)}` });
      load(); reloadAccounts();
    } catch (e) { push({ tone: 'error', title: 'Close failed', body: (e as Error).message }); }
  };

  const cancelOrder = async (id: string) => {
    try {
      await apiFetch(`/api/trades/orders/${id}`, { method: 'DELETE' });
      load(); reloadAccounts();
      push({ tone: 'success', title: 'Order cancelled', body: 'Reserved margin returned to available balance.' });
    } catch (e) { push({ tone: 'error', title: 'Cancel failed', body: (e as Error).message }); }
  };

  const deskPositions = positions.filter((p) => cfg.categories.includes(markets.find((m) => m.symbol === p.symbol)?.category ?? '') || positions.length <= 8);

  const left = (
    <MarketList
      markets={tradable as MarketRow[]}
      active={symbol}
      onSelect={setSymbol}
      onToggleWatch={toggleWatch}
      watching={watching}
      dense
    />
  );

  const center = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1">
      <ProChart symbol={symbol} height={kind === 'futures' ? 430 : 400} />
      </div>
      <div className="shrink-0 border-t border-white/[0.06]">
        <Tabs
          tabs={[
            { id: 'positions' as const, label: 'Positions', count: deskPositions.length },
            { id: 'orders' as const, label: 'Orders', count: orders.length },
            { id: 'history' as const, label: 'Fills', count: executions.length },
          ]}
          value={tab}
          onChange={setTab}
        />
        <div className="max-h-[220px] overflow-auto scroll-thin">
          {tab === 'positions' && (deskPositions.length === 0 ? (
            <EmptyState title="No open positions" body="Your internal paper positions will appear here after your first fill." />
          ) : (
            <table className="w-full min-w-[780px]">
              <thead><tr><th className="th">Market</th><th className="th">Side</th><th className="th text-right">Qty</th><th className="th text-right">Entry</th><th className="th text-right">Mark</th><th className="th text-right">Margin</th><th className="th text-right">P/L</th><th className="th text-right">Liq.</th><th className="th" /></tr></thead>
              <tbody>
                {deskPositions.map((p) => (
                  <tr key={p.id} className="table-row">
                    <td className="td">
                      <span className="flex items-center gap-2"><AssetMark symbol={p.symbol} size={18} /><span className="font-medium text-white">{p.symbol}</span></span>
                    </td>
                    <td className="td"><Badge tone={p.side === 'LONG' ? 'green' : 'red'}>{p.side}</Badge></td>
                    <td className="td text-right value-mono">{fmtQty(p.qty, 4)}</td>
                    <td className="td text-right value-mono">{fmtPrice(p.entryPrice, priceDp(p.symbol))}</td>
                    <td className="td text-right value-mono"><AnimatedNumber value={p.markPrice} decimals={priceDp(p.symbol)} /></td>
                    <td className="td text-right value-mono">{fmtMoney(p.initialMargin)}</td>
                    <td className={`td text-right value-mono ${p.unrealizedPnl >= 0 ? 'text-emerald' : 'text-danger'}`}>{fmtSigned(p.unrealizedPnl)}</td>
                    <td className="td text-right value-mono text-muted">{p.liquidationPrice ? fmtPrice(p.liquidationPrice, priceDp(p.symbol)) : '—'}</td>
                    <td className="td text-right"><button onClick={() => closePosition(p)} className="rounded-md border border-white/10 px-2 py-1 text-[10.5px] text-muted transition-colors hover:border-danger/40 hover:text-danger">Close</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}
          {tab === 'orders' && (orders.length === 0 ? (
            <EmptyState title="No resting orders" body="Limit and stop orders remain here until filled, expired or cancelled." />
          ) : (
            <table className="w-full min-w-[620px]">
              <thead><tr><th className="th">Market</th><th className="th">Side</th><th className="th">Type</th><th className="th text-right">Qty</th><th className="th text-right">Price</th><th className="th">Placed</th><th className="th" /></tr></thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="table-row">
                    <td className="td font-medium text-white">{o.symbol}</td>
                    <td className="td"><Badge tone={o.side === 'BUY' ? 'green' : 'red'}>{o.side}</Badge></td>
                    <td className="td text-[11.5px] text-muted">{o.type}</td>
                    <td className="td text-right value-mono">{fmtQty(o.qty, 4)}</td>
                    <td className="td text-right value-mono">{o.price ? fmtPrice(o.price, priceDp(o.symbol)) : 'market'}</td>
                    <td className="td text-[11.5px] text-muted">{relTime(o.createdAt)}</td>
                    <td className="td text-right"><button onClick={() => cancelOrder(o.id)} className="rounded-md border border-white/10 px-2 py-1 text-[10.5px] text-muted transition-colors hover:border-danger/40 hover:text-danger">Cancel</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}
          {tab === 'history' && (executions.length === 0 ? (
            <EmptyState title="No fills yet" body="Your confirmed fills will appear here once trading is available." />
          ) : (
            <table className="w-full min-w-[620px]">
              <thead><tr><th className="th">Market</th><th className="th">Side</th><th className="th text-right">Qty</th><th className="th text-right">Price</th><th className="th text-right">Fee</th><th className="th">Venue</th><th className="th">Time</th></tr></thead>
              <tbody>
                {executions.slice(0, 40).map((e) => (
                  <tr key={e.id} className="table-row">
                    <td className="td font-medium text-white">{e.symbol}</td>
                    <td className="td"><Badge tone={e.side === 'BUY' ? 'green' : 'red'}>{e.side}</Badge></td>
                    <td className="td text-right value-mono">{fmtQty(e.qty, 4)}</td>
                    <td className="td text-right value-mono">{fmtPrice(e.price, priceDp(e.symbol))}</td>
                    <td className="td text-right value-mono text-muted">{fmtMoney(e.fee)}</td>
                    <td className="td text-[11px] uppercase tracking-wide text-muted">{e.venue}</td>
                    <td className="td text-[11.5px] text-muted">{relTime(e.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}
        </div>
      </div>
    </div>
  );

  const right = (
    <div className="p-3">
      {meta && !active ? (
        <div className="space-y-2 p-1">
          {Array.from({ length: 7 }).map((_, i) => <div key={i} className="skeleton h-9 w-full" />)}
          <p className="pt-1 text-center text-[10.5px] text-muted">Loading account…</p>
          <button onClick={() => reloadAccounts()} className="mt-1 w-full rounded-lg border border-white/10 py-1.5 text-[10.5px] text-muted hover:text-white">Reload accounts</button>
        </div>
      ) : meta && active ? (
        <>
          <div className="mb-3 flex items-center justify-between rounded-lg border border-white/[0.06] bg-ink-950/50 px-2.5 py-2">
            <span className="flex items-center gap-2">
              <AssetMark symbol={symbol} size={20} />
              <span className="text-[12px] font-semibold text-white">{symbol}</span>
            </span>
            <span className="value-mono text-[11.5px] text-white">
              <AnimatedNumber value={quote?.last} decimals={dp} />
              {quote && <span className={`ml-1.5 ${(quote.change24h ?? 0) >= 0 ? 'text-emerald' : 'text-danger'}`}>{fmtPct(quote.change24h)}</span>}
              {quote?.stale && <span className="ml-1 text-[9px] text-amber-300">DELAYED</span>}
            </span>
          </div>
          <OrderPanel market={meta} accountId={accountId} accountType={active.type} available={active.available} quote={quote} onPlaced={() => { load(); reloadAccounts(); }} />
          <div className="mt-4 rounded-xl border border-white/[0.06] bg-ink-950/40">
            <div className="border-b border-white/[0.06] px-3 py-2"><p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">PRIMEVEST order book</p></div>
            <div className="px-3 py-5 text-center"><div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-muted">≋</div><p className="mt-3 text-xs font-medium text-white">Order book unavailable</p><p className="mt-1 text-[11px] leading-relaxed text-muted">Internal paper orders execute against the server-side bid/ask quote. This is not a public exchange order book or external liquidity.</p></div>
          </div>
          <div className="mt-3 rounded-xl border border-white/[0.06] bg-ink-950/40">
            <p className="border-b border-white/[0.06] px-2.5 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">Reference market statistics</p>
            <SessionStats symbol={symbol} quote={quote} />
          </div>
          <div className="mt-3 rounded-xl border border-white/[0.06] bg-ink-950/40 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">Recent trades</p><p className="mt-3 text-[11px] leading-relaxed text-muted">Completed internal paper fills are listed in the Fills tab.</p>
          </div>
        </>
      ) : (
        <p className="p-4 text-[12px] text-muted">Select a market to trade.</p>
      )}
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[.22em] text-lime">Trading / Workspace</p>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[26px] font-semibold tracking-tight text-white">{cfg.title}</h1>
            <Badge tone="blue">Internal paper trading</Badge>
          </div>
          <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-muted">{cfg.sub}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/deposits" className="btn-ghost px-3 py-2 text-[12px]">Funding</Link>
          <Link href="/dashboard/positions" className="btn-ghost hidden px-3 py-2 text-[12px] sm:inline-flex">All positions</Link>
        </div>
      </div>

      {marketsError && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-2.5 text-[12px] text-danger">
          Market data error: {marketsError}. Prices may be stale until the provider reconnects.
        </div>
      )}

      <TerminalWorkspace storageKey={`desk:${kind}`} left={left} center={center} right={right} height={760} />
    </div>
  );
}
