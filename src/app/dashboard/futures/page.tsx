'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChartPanel } from '@/components/chart';
import { MarketList } from '@/components/market-selector';
import { AccountSwitcher, useAccount } from '@/components/terminal/account-bar';
import { OrderPanel } from '@/components/terminal/order-panel';
import { Tabs, Badge, apiFetch, useToast, EmptyState, SectionHeader } from '@/components/ui';
import { useMarkets } from '@/lib/use-markets';
import { fmtMoney, fmtPrice, fmtQty, fmtSigned, priceDp, relTime, fmtPct } from '@/lib/format';

type Position = { id: string; symbol: string; side: string; qty: number; entryPrice: number; markPrice: number | null; leverage: number; marginMode: string; initialMargin: number; liquidationPrice: number | null; unrealizedPnl: number; realizedPnl: number; takeProfit: number | null; stopLoss: number | null; openedAt: string };
type Order = { id: string; symbol: string; side: string; type: string; status: string; qty: number; price: number | null; leverage: number; createdAt: string };
type Funding = { id: string; symbol: string; rate: number; amount: number; markPrice: number; fundingTime: string };
type Liq = { id: string; symbol: string; side: string; qty: number; price: number; lossAmount: number; createdAt: string };
type Exec = { id: string; symbol: string; side: string; qty: number; price: number; fee: number; venue: string; createdAt: string };

export default function FuturesTerminal() {
  const { markets } = useMarkets('FUTURES');
  const [symbol, setSymbol] = useState('BTC/USDT-PERP');
  const [quote, setQuote] = useState<{ last: number; bid: number; ask: number; change24h?: number; source: string } | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [funding, setFunding] = useState<Funding[]>([]);
  const [liquidations, setLiquidations] = useState<Liq[]>([]);
  const [execs, setExecs] = useState<Exec[]>([]);
  const [tab, setTab] = useState<'positions' | 'orders' | 'history' | 'funding'>('positions');
  const [watching, setWatching] = useState<string[]>([]);
  const { accounts, accountId, select, active, liveEnabled, reloadAccounts } = useAccount();
  const { push } = useToast();

  const meta = markets.find((m) => m.symbol === symbol);
  const dp = meta?.pricePrecision ?? 2;

  const load = useCallback(async () => {
    if (!accountId) return;
    try {
      const [q, p, o, h] = await Promise.all([
        apiFetch<any>(`/api/markets/${encodeURIComponent(symbol)}/quote`),
        apiFetch<{ positions: Position[] }>(`/api/trades/positions?accountId=${accountId}`),
        apiFetch<{ orders: Order[] }>(`/api/trades/orders?accountId=${accountId}&status=open`),
        apiFetch<any>(`/api/trades/history?accountId=${accountId}`),
      ]);
      setQuote(q);
      setPositions(p.positions);
      setOrders(o.orders);
      setFunding(h.funding ?? []);
      setLiquidations(h.liquidations ?? []);
      setExecs(h.executions ?? []);
    } catch { /* polling */ }
  }, [accountId, symbol]);

  useEffect(() => {
    load();
    const id = setInterval(load, 8000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    fetch('/api/watchlist', { cache: 'no-store' }).then((r) => r.json()).then((b) => setWatching(b.symbols ?? [])).catch(() => undefined);
  }, []);

  const toggleWatch = async (s: string) => {
    const res = await apiFetch<{ watching: boolean }>('/api/watchlist', { method: 'POST', body: JSON.stringify({ symbol: s, action: 'toggle' }) });
    setWatching((prev) => (res.watching ? [...prev, s] : prev.filter((x) => x !== s)));
  };

  const close = async (p: Position) => {
    try {
      const res = await apiFetch<{ pnl: number; exitPrice: number }>(`/api/trades/positions/${p.id}`, { method: 'DELETE' });
      push({ tone: res.pnl >= 0 ? 'success' : 'info', title: `${p.symbol} closed`, body: `Realised ${fmtSigned(res.pnl)} at ${fmtPrice(res.exitPrice, priceDp(p.symbol))}` });
      load(); reloadAccounts();
    } catch (e) { push({ tone: 'error', title: 'Close failed', body: (e as Error).message }); }
  };

  const cancel = async (id: string) => {
    try {
      await apiFetch(`/api/trades/orders/${id}`, { method: 'DELETE' });
      load(); reloadAccounts();
    } catch (e) { push({ tone: 'error', title: 'Cancel failed', body: (e as Error).message }); }
  };

  const stats = useMemo(() => {
    const margin = positions.reduce((s, p) => s + p.initialMargin, 0);
    const upnl = positions.reduce((s, p) => s + p.unrealizedPnl, 0);
    const notional = positions.reduce((s, p) => s + (p.markPrice ?? p.entryPrice) * p.qty, 0);
    return { margin, upnl, notional, ratio: margin > 0 ? (margin + upnl) / margin : 0 };
  }, [positions]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">Crypto futures terminal</h1>
          <p className="mt-0.5 text-[12px] text-muted">Perpetual contracts with cross/isolated margin, funding and server-side liquidation.</p>
        </div>
        <AccountSwitcher accounts={accounts} accountId={accountId} onSelect={select} active={active} liveEnabled={liveEnabled} />
      </div>

      <div className="grid gap-3 xl:grid-cols-[230px_minmax(0,1fr)_300px]">
        <aside className="panel hidden overflow-hidden xl:block" style={{ height: 700 }}>
          <MarketList markets={markets} active={symbol} onSelect={setSymbol} onToggleWatch={toggleWatch} watching={watching} showCategory={false} dense />
        </aside>

        <div className="min-w-0 space-y-3">
          <div className="xl:hidden">
            <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="field-sm mb-2">
              {markets.map((m) => <option key={m.symbol} value={m.symbol}>{m.symbol}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            <Kpi label="Mark price" value={quote ? fmtPrice(quote.last, dp) : '—'} sub={quote?.source} />
            <Kpi label="Index price" value={quote ? fmtPrice(quote.last, dp) : '—'} sub="provider mid" tone={(quote?.change24h ?? 0) >= 0 ? 'up' : 'down'} />
            <Kpi label="Open margin" value={fmtMoney(stats.margin)} sub={`${positions.length} positions`} />
            <Kpi label="Unrealised P/L" value={fmtSigned(stats.upnl)} sub="marked live" tone={stats.upnl >= 0 ? 'up' : 'down'} />
            <Kpi label="24h change" value={fmtPct(quote?.change24h)} sub="vs open" tone={(quote?.change24h ?? 0) >= 0 ? 'up' : 'down'} />
          </div>

          <ChartPanel symbol={symbol} pricePrecision={dp} onQuote={(q) => setQuote((prev) => ({ ...(prev ?? { bid: q.last, ask: q.last, source: q.source }), ...q, bid: prev?.bid ?? q.last, ask: prev?.ask ?? q.last }))} height={360} />

          <div className="panel overflow-hidden">
            <Tabs
              tabs={[
                { id: 'positions' as const, label: 'Positions', count: positions.length },
                { id: 'orders' as const, label: 'Open orders', count: orders.length },
                { id: 'history' as const, label: 'Trade history', count: execs.length },
                { id: 'funding' as const, label: 'Funding & liquidations', count: funding.length + liquidations.length },
              ]}
              value={tab}
              onChange={setTab}
            />
            {tab === 'positions' && (positions.length === 0 ? <EmptyState title="No open positions" body="Open a long or short from the order panel. Margin, mark price, liquidation price and funding are computed on the server." /> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px]">
                  <thead><tr><th className="th">Contract</th><th className="th">Side</th><th className="th">Margin</th><th className="th text-right">Size</th><th className="th text-right">Entry</th><th className="th text-right">Mark</th><th className="th text-right">Liq. price</th><th className="th text-right">P/L</th><th className="th text-right">ROE</th><th className="th"></th></tr></thead>
                  <tbody>
                    {positions.map((p) => (
                      <tr key={p.id} className="table-row">
                        <td className="td font-medium text-white">{p.symbol}</td>
                        <td className="td">
                          <Badge tone={p.side === 'LONG' ? 'green' : 'red'}>{p.side}</Badge>
                          <span className="ml-1.5 text-[10px] text-muted">{p.leverage}× {p.marginMode}</span>
                        </td>
                        <td className="td value-mono text-[11.5px]">{fmtMoney(p.initialMargin)}</td>
                        <td className="td text-right value-mono">{fmtQty(p.qty, 4)}</td>
                        <td className="td text-right value-mono">{fmtPrice(p.entryPrice, dp)}</td>
                        <td className="td text-right value-mono">{fmtPrice(p.markPrice, dp)}</td>
                        <td className="td text-right value-mono text-siren">{p.liquidationPrice ? fmtPrice(p.liquidationPrice, dp) : '—'}</td>
                        <td className={`td text-right value-mono ${p.unrealizedPnl >= 0 ? 'text-emerald' : 'text-danger'}`}>{fmtSigned(p.unrealizedPnl)}</td>
                        <td className={`td text-right value-mono ${p.unrealizedPnl >= 0 ? 'text-emerald' : 'text-danger'}`}>{p.initialMargin ? fmtPct((p.unrealizedPnl / p.initialMargin) * 100) : '—'}</td>
                        <td className="td text-right"><button onClick={() => close(p)} className="rounded-md border border-white/10 px-2 py-1 text-[10.5px] text-muted hover:border-danger/40 hover:text-danger">Close</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
            {tab === 'orders' && (orders.length === 0 ? <EmptyState title="No open orders" body="Limit, stop and take-profit orders rest here until triggered or cancelled." /> : (
              <table className="w-full">
                <thead><tr><th className="th">Contract</th><th className="th">Side</th><th className="th">Type</th><th className="th text-right">Qty</th><th className="th text-right">Trigger</th><th className="th">Placed</th><th className="th"></th></tr></thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="table-row">
                      <td className="td font-medium text-white">{o.symbol}</td>
                      <td className="td"><Badge tone={o.side === 'BUY' ? 'green' : 'red'}>{o.side}</Badge></td>
                      <td className="td text-[11.5px] text-muted">{o.type}</td>
                      <td className="td text-right value-mono">{fmtQty(o.qty, 4)}</td>
                      <td className="td text-right value-mono">{o.price ? fmtPrice(o.price, dp) : 'market'}</td>
                      <td className="td text-[11.5px] text-muted">{relTime(o.createdAt)}</td>
                      <td className="td text-right"><button onClick={() => cancel(o.id)} className="rounded-md border border-white/10 px-2 py-1 text-[10.5px] text-muted hover:border-danger/40 hover:text-danger">Cancel</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ))}
            {tab === 'history' && (execs.length === 0 ? <EmptyState title="No fills recorded yet" body="Every execution stores the quote timestamp used, the venue and the fee charged." /> : (
              <table className="w-full">
                <thead><tr><th className="th">Contract</th><th className="th">Side</th><th className="th text-right">Qty</th><th className="th text-right">Price</th><th className="th text-right">Fee</th><th className="th">Venue</th><th className="th">Time</th></tr></thead>
                <tbody>
                  {execs.map((e) => (
                    <tr key={e.id} className="table-row">
                      <td className="td font-medium text-white">{e.symbol}</td>
                      <td className="td"><Badge tone={e.side === 'BUY' ? 'green' : 'red'}>{e.side}</Badge></td>
                      <td className="td text-right value-mono">{fmtQty(e.qty, 4)}</td>
                      <td className="td text-right value-mono">{fmtPrice(e.price, dp)}</td>
                      <td className="td text-right value-mono">{fmtMoney(e.fee)}</td>
                      <td className="td text-[11px] text-muted">{e.venue}</td>
                      <td className="td text-[11px] text-muted">{relTime(e.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ))}
            {tab === 'funding' && (
              <div className="grid gap-0 md:grid-cols-2 md:divide-x md:divide-white/[0.07]">
                <div>
                  <SectionHeader title="Funding history" subtitle="Applied by the funding engine every 8 hours" />
                  {funding.length === 0 ? <p className="px-4 py-6 text-[11.5px] text-muted">No funding payments recorded yet.</p> : (
                    <table className="w-full">
                      <thead><tr><th className="th">Contract</th><th className="th text-right">Rate</th><th className="th text-right">Amount</th><th className="th">Time</th></tr></thead>
                      <tbody>
                        {funding.map((f) => (
                          <tr key={f.id} className="table-row">
                            <td className="td font-medium text-white">{f.symbol}</td>
                            <td className="td text-right value-mono">{(f.rate * 100).toFixed(4)}%</td>
                            <td className={`td text-right value-mono ${f.amount >= 0 ? 'text-emerald' : 'text-danger'}`}>{fmtSigned(f.amount)}</td>
                            <td className="td text-[11px] text-muted">{relTime(f.fundingTime)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                <div>
                  <SectionHeader title="Liquidation history" subtitle="Positions force-closed by the risk engine" />
                  {liquidations.length === 0 ? <p className="px-4 py-6 text-[11.5px] text-muted">No liquidations on this account.</p> : (
                    <table className="w-full">
                      <thead><tr><th className="th">Contract</th><th className="th">Side</th><th className="th text-right">Price</th><th className="th text-right">Loss</th><th className="th">Time</th></tr></thead>
                      <tbody>
                        {liquidations.map((l) => (
                          <tr key={l.id} className="table-row">
                            <td className="td font-medium text-white">{l.symbol}</td>
                            <td className="td"><Badge tone={l.side === 'LONG' ? 'green' : 'red'}>{l.side}</Badge></td>
                            <td className="td text-right value-mono">{fmtPrice(l.price, dp)}</td>
                            <td className="td text-right value-mono text-danger">{fmtMoney(l.lossAmount)}</td>
                            <td className="td text-[11px] text-muted">{relTime(l.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <aside className="panel hidden p-3.5 xl:block">
          {meta && active ? (
            <OrderPanel
              market={{ ...meta, baseAsset: meta.baseAsset, takerFee: 0.0006 }}
              accountId={accountId}
              accountType={active.type}
              available={active.available}
              quote={quote}
              onPlaced={() => { load(); reloadAccounts(); }}
            />
          ) : <p className="p-4 text-[12px] text-muted">Select a contract.</p>}
        </aside>
      </div>

      <div className="panel p-3.5 xl:hidden">
        {meta && active && (
          <OrderPanel
            market={{ ...meta, baseAsset: meta.baseAsset, takerFee: 0.0006 }}
            accountId={accountId}
            accountType={active.type}
            available={active.available}
            quote={quote}
            onPlaced={() => { load(); reloadAccounts(); }}
          />
        )}
      </div>
    </div>
  );
}

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'up' | 'down' }) {
  return (
    <div className="panel-flat px-3 py-2">
      <p className="label">{label}</p>
      <p className={`value-mono mt-0.5 text-[13px] font-semibold ${tone === 'up' ? 'text-emerald' : tone === 'down' ? 'text-danger' : 'text-white'}`}>{value}</p>
      {sub && <p className="mt-0.5 truncate text-[9.5px] uppercase tracking-wide text-muted">{sub}</p>}
    </div>
  );
}
