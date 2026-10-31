'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChartPanel } from '@/components/chart';
import { MarketList } from '@/components/market-selector';
import { AccountSwitcher, useAccount } from '@/components/terminal/account-bar';
import { OrderPanel } from '@/components/terminal/order-panel';
import { Tabs, Badge, apiFetch, useToast, EmptyState, StatusBadge } from '@/components/ui';
import { useMarkets } from '@/lib/use-markets';
import { fmtMoney, fmtPrice, fmtQty, fmtSigned, priceDp, relTime } from '@/lib/format';

type Position = { id: string; symbol: string; side: string; qty: number; entryPrice: number; markPrice: number | null; unrealizedPnl: number; leverage: number; marginMode: string; initialMargin: number; liquidationPrice: number | null; takeProfit: number | null; stopLoss: number | null; openedAt: string };
type Order = { id: string; symbol: string; side: string; type: string; status: string; qty: number; price: number | null; leverage: number; createdAt: string };

export default function ForexCfdTerminal() {
  const { markets, error: marketsError } = useMarkets();
  const tradable = useMemo(() => markets.filter((m) => m.category === 'FOREX' || m.category === 'CFD'), [markets]);
  const [symbol, setSymbol] = useState('EUR/USD');
  const [bottomTab, setBottomTab] = useState<'positions' | 'orders' | 'history'>('positions');
  const [positions, setPositions] = useState<Position[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [history, setHistory] = useState<{ closedPositions: { id: string; symbol: string; side: string; qty: number; entryPrice: number; exitPrice: number | null; realizedPnl: number; closedAt: string | null }[]; executions: { id: string; symbol: string; side: string; qty: number; price: number; fee: number; venue: string; createdAt: string }[] } | null>(null);
  const [quote, setQuote] = useState<{ last: number; bid: number; ask: number; source: string; change24h?: number } | null>(null);
  const [watching, setWatching] = useState<string[]>([]);
  const [mobilePane, setMobilePane] = useState<'chart' | 'order'>('chart');
  const { push } = useToast();
  const { accounts, accountId, select, active, liveEnabled, reloadAccounts } = useAccount();

  const meta = tradable.find((m) => m.symbol === symbol);

  useEffect(() => {
    fetch('/api/watchlist', { cache: 'no-store' }).then((r) => r.json()).then((b) => setWatching(b.symbols ?? [])).catch(() => undefined);
  }, []);

  const loadPositions = async () => {
    if (!accountId) return;
    try {
      const [p, o] = await Promise.all([
        apiFetch<{ positions: Position[] }>(`/api/trades/positions?accountId=${accountId}`),
        apiFetch<{ orders: Order[] }>(`/api/trades/orders?accountId=${accountId}&status=open`),
      ]);
      setPositions(p.positions);
      setOrders(o.orders);
    } catch { /* surfaced by polling below */ }
  };

  useEffect(() => {
    loadPositions();
    const id = setInterval(loadPositions, 8000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId]);

  useEffect(() => {
    if (bottomTab !== 'history' || !accountId) return;
    apiFetch<any>(`/api/trades/history?accountId=${accountId}`).then(setHistory).catch(() => undefined);
  }, [bottomTab, accountId]);

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
      loadPositions(); reloadAccounts();
    } catch (e) { push({ tone: 'error', title: 'Close failed', body: (e as Error).message }); }
  };

  const cancelOrder = async (id: string) => {
    try {
      await apiFetch(`/api/trades/orders/${id}`, { method: 'DELETE' });
      loadPositions(); reloadAccounts();
      push({ tone: 'success', title: 'Order cancelled' });
    } catch (e) { push({ tone: 'error', title: 'Cancel failed', body: (e as Error).message }); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">Forex & CFD terminal</h1>
          <p className="mt-0.5 text-[12px] text-muted">Market, limit and stop orders with server-side margin and liquidation monitoring.</p>
        </div>
        <AccountSwitcher accounts={accounts} accountId={accountId} onSelect={select} active={active} liveEnabled={liveEnabled} />
      </div>

      {marketsError && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-2.5 text-[12px] text-danger">
          Market data error: {marketsError}. Prices shown may be stale until the provider reconnects.
        </div>
      )}

      <div className="grid gap-3 xl:grid-cols-[248px_minmax(0,1fr)_300px]">
        <aside className="panel hidden overflow-hidden xl:block" style={{ height: 660 }}>
          <MarketList markets={tradable} active={symbol} onSelect={setSymbol} onToggleWatch={toggleWatch} watching={watching} />
        </aside>

        <div className="min-w-0 space-y-3">
          <div className="xl:hidden">
            <div className="mb-2 flex gap-1 rounded-lg bg-ink-900 p-1">
              {(['chart', 'order'] as const).map((p) => (
                <button key={p} onClick={() => setMobilePane(p)} className={`flex-1 rounded-md py-1.5 text-[11.5px] font-medium ${mobilePane === p ? 'bg-white/10 text-white' : 'text-muted'}`}>
                  {p === 'chart' ? 'Chart' : 'Order'}
                </button>
              ))}
            </div>
            {mobilePane === 'chart' && (
              <div className="mb-2">
                <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="field-sm mb-2">
                  {tradable.map((m) => <option key={m.symbol} value={m.symbol}>{m.symbol} — {m.displayName}</option>)}
                </select>
              </div>
            )}
          </div>

          <div className={mobilePane === 'chart' ? '' : 'hidden xl:block'}>
            <ChartPanel symbol={symbol} pricePrecision={meta?.pricePrecision ?? 2} onQuote={(q) => setQuote((prev) => ({ ...(prev ?? { bid: q.last, ask: q.last, source: q.source }), ...q, bid: prev?.bid ?? q.last, ask: prev?.ask ?? q.last }))} height={400} />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Metric label="Bid" value={quote ? fmtPrice(quote.bid, meta?.pricePrecision ?? 2) : '—'} />
            <Metric label="Ask" value={quote ? fmtPrice(quote.ask, meta?.pricePrecision ?? 2) : '—'} />
            <Metric label="Spread" value={quote ? (quote.ask - quote.bid).toFixed(5) : '—'} />
            <Metric label="Feed" value={quote?.source ?? '—'} />
          </div>

          <div className={`panel overflow-hidden ${mobilePane === 'order' ? '' : 'hidden xl:block'}`}>
            <Tabs
              tabs={[
                { id: 'positions' as const, label: 'Positions', count: positions.length },
                { id: 'orders' as const, label: 'Orders', count: orders.length },
                { id: 'history' as const, label: 'History' },
              ]}
              value={bottomTab}
              onChange={setBottomTab}
            />
            {bottomTab === 'positions' && (
              positions.length === 0 ? <EmptyState title="No open positions" body="Positions you open in this account appear here with live P/L and liquidation price." /> : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px]">
                    <thead><tr><th className="th">Market</th><th className="th">Side</th><th className="th text-right">Qty</th><th className="th text-right">Entry</th><th className="th text-right">Mark</th><th className="th text-right">Margin</th><th className="th text-right">P/L</th><th className="th text-right">Liq.</th><th className="th"></th></tr></thead>
                    <tbody>
                      {positions.map((p) => (
                        <tr key={p.id} className="table-row">
                          <td className="td font-medium text-white">{p.symbol}<span className="ml-1 text-[10px] text-muted">{p.leverage}× {p.marginMode}</span></td>
                          <td className="td"><Badge tone={p.side === 'LONG' ? 'green' : 'red'}>{p.side}</Badge></td>
                          <td className="td text-right value-mono">{fmtQty(p.qty, 4)}</td>
                          <td className="td text-right value-mono">{fmtPrice(p.entryPrice, priceDp(p.symbol))}</td>
                          <td className="td text-right value-mono">{fmtPrice(p.markPrice, priceDp(p.symbol))}</td>
                          <td className="td text-right value-mono">{fmtMoney(p.initialMargin)}</td>
                          <td className={`td text-right value-mono ${p.unrealizedPnl >= 0 ? 'text-emerald' : 'text-danger'}`}>{fmtSigned(p.unrealizedPnl)}</td>
                          <td className="td text-right value-mono text-muted">{p.liquidationPrice ? fmtPrice(p.liquidationPrice, priceDp(p.symbol)) : '—'}</td>
                          <td className="td text-right"><button onClick={() => closePosition(p)} className="rounded-md border border-white/10 px-2 py-1 text-[10.5px] text-muted hover:border-danger/40 hover:text-danger">Close</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
            {bottomTab === 'orders' && (
              orders.length === 0 ? <EmptyState title="No resting orders" body="Limit and stop orders remain here until filled, expired or cancelled." /> : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px]">
                    <thead><tr><th className="th">Market</th><th className="th">Side</th><th className="th">Type</th><th className="th text-right">Qty</th><th className="th text-right">Price</th><th className="th">Placed</th><th className="th"></th></tr></thead>
                    <tbody>
                      {orders.map((o) => (
                        <tr key={o.id} className="table-row">
                          <td className="td font-medium text-white">{o.symbol}</td>
                          <td className="td"><Badge tone={o.side === 'BUY' ? 'green' : 'red'}>{o.side}</Badge></td>
                          <td className="td text-[11.5px] text-muted">{o.type}</td>
                          <td className="td text-right value-mono">{fmtQty(o.qty, 4)}</td>
                          <td className="td text-right value-mono">{o.price ? fmtPrice(o.price, priceDp(o.symbol)) : 'market'}</td>
                          <td className="td text-[11.5px] text-muted">{relTime(o.createdAt)}</td>
                          <td className="td text-right"><button onClick={() => cancelOrder(o.id)} className="rounded-md border border-white/10 px-2 py-1 text-[10.5px] text-muted hover:border-danger/40 hover:text-danger">Cancel</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
            {bottomTab === 'history' && (
              !history ? <div className="p-6 text-center text-[12px] text-muted">Loading history…</div> :
              history.closedPositions.length === 0 && history.executions.length === 0 ? <EmptyState title="No trade history yet" body="Closed positions and individual fills are recorded here with execution venue and timestamps." /> : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px]">
                    <thead><tr><th className="th">Market</th><th className="th">Side</th><th className="th text-right">Qty</th><th className="th text-right">Entry</th><th className="th text-right">Exit</th><th className="th text-right">Realised</th><th className="th">Closed</th></tr></thead>
                    <tbody>
                      {history.closedPositions.map((p) => (
                        <tr key={p.id} className="table-row">
                          <td className="td font-medium text-white">{p.symbol}</td>
                          <td className="td"><Badge tone={p.side === 'LONG' ? 'green' : 'red'}>{p.side}</Badge></td>
                          <td className="td text-right value-mono">{fmtQty(p.qty, 4)}</td>
                          <td className="td text-right value-mono">{fmtPrice(p.entryPrice, priceDp(p.symbol))}</td>
                          <td className="td text-right value-mono">{fmtPrice(p.exitPrice, priceDp(p.symbol))}</td>
                          <td className={`td text-right value-mono ${p.realizedPnl >= 0 ? 'text-emerald' : 'text-danger'}`}>{fmtSigned(p.realizedPnl)}</td>
                          <td className="td text-[11.5px] text-muted">{relTime(p.closedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
        </div>

        <aside className="panel hidden p-3.5 xl:block">
          {meta && active ? (
            <OrderPanel
              market={{ ...meta, baseAsset: meta.baseAsset, takerFee: 0.001 }}
              accountId={accountId}
              accountType={active.type}
              available={active.available}
              quote={quote}
              onPlaced={() => { loadPositions(); reloadAccounts(); }}
            />
          ) : (
            <p className="p-4 text-[12px] text-muted">Select a market to trade.</p>
          )}
        </aside>
      </div>

      {/* Mobile order sheet */}
      <div className={`panel p-3.5 xl:hidden ${mobilePane === 'order' ? '' : 'hidden'}`}>
        {meta && active && (
          <OrderPanel
            market={{ ...meta, baseAsset: meta.baseAsset, takerFee: 0.001 }}
            accountId={accountId}
            accountType={active.type}
            available={active.available}
            quote={quote}
            onPlaced={() => { loadPositions(); reloadAccounts(); }}
          />
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel-flat px-3 py-2">
      <p className="label">{label}</p>
      <p className="value-mono mt-0.5 text-[12.5px] font-medium text-white">{value}</p>
    </div>
  );
}
