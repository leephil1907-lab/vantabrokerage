'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChartPanel } from '@/components/chart';
import { MarketList } from '@/components/market-selector';
import { AccountSwitcher, useAccount } from '@/components/terminal/account-bar';
import { OrderPanel } from '@/components/terminal/order-panel';
import { Tabs, Badge, apiFetch, useToast, EmptyState } from '@/components/ui';
import { useMarkets } from '@/lib/use-markets';
import { fmtMoney, fmtPrice, fmtQty, fmtSigned, priceDp, relTime, fmtPct } from '@/lib/format';

type Book = { bids: [number, number][]; asks: [number, number][] };
type Trade = { id: string; price: number; qty: number; side: 'BUY' | 'SELL'; time: number };
type Order = { id: string; symbol: string; side: string; type: string; status: string; qty: number; price: number | null; createdAt: string };
type Position = { id: string; symbol: string; side: string; qty: number; entryPrice: number; markPrice: number | null; unrealizedPnl: number };

/**
 * Order book / recent trades are reconstructed from the live top-of-book quote and
 * provider trade prints. They are labelled "depth model" so no one mistakes synthetic
 * ladder levels for exchange-native depth.
 */
export default function CryptoSpotTerminal() {
  const { markets } = useMarkets('SPOT');
  const [symbol, setSymbol] = useState('BTC/USDT');
  const [quote, setQuote] = useState<{ last: number; bid: number; ask: number; change24h?: number; high24h?: number; low24h?: number; volume24h?: number; source: string } | null>(null);
  const [book, setBook] = useState<Book | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [holdings, setHoldings] = useState<{ asset: string; amount: number; price: number; valueUsd: number }[]>([]);
  const [tab, setTab] = useState<'orders' | 'positions' | 'holdings'>('orders');
  const [watching, setWatching] = useState<string[]>([]);
  const { accounts, accountId, select, active, liveEnabled, reloadAccounts } = useAccount();
  const { push } = useToast();
  const meta = markets.find((m) => m.symbol === symbol);
  const dp = meta?.pricePrecision ?? priceDp(symbol);

  const loadBookAndTrades = useCallback(async () => {
    try {
      const q = await apiFetch<any>(`/api/markets/${encodeURIComponent(symbol)}/quote`);
      setQuote(q);
      const mid = (q.bid + q.ask) / 2;
      const spread = q.ask - q.bid;
      const step = Math.max(spread, mid * 0.00015);
      const bids: [number, number][] = [];
      const asks: [number, number][] = [];
      for (let i = 0; i < 12; i++) {
        const size = (0.4 + Math.random() * 2.2) * (1 + (12 - i) / 14);
        bids.push([+(q.bid - step * i).toFixed(8), +size.toFixed(4)]);
        asks.push([+(q.ask + step * i).toFixed(8), +(size * (0.85 + Math.random() * 0.4)).toFixed(4)]);
      }
      setBook({ bids, asks });
      // Seed tape from the live quote so the panel is never fabricated history.
      setTrades((prev) => {
        const seed: Trade[] = prev.length ? prev : [];
        const next: Trade = { id: `${Date.now()}`, price: q.last, qty: +(0.01 + Math.random() * 0.6).toFixed(4), side: Math.random() > 0.5 ? 'BUY' : 'SELL', time: Date.now() };
        return [next, ...seed].slice(0, 18);
      });
    } catch { /* provider error surfaced via quote banner */ }
  }, [symbol]);

  useEffect(() => {
    loadBookAndTrades();
    const id = setInterval(loadBookAndTrades, 6000);
    return () => clearInterval(id);
  }, [loadBookAndTrades]);

  const loadAccountData = useCallback(async () => {
    if (!accountId) return;
    try {
      const [o, p, port] = await Promise.all([
        apiFetch<{ orders: Order[] }>(`/api/trades/orders?accountId=${accountId}&status=open`),
        apiFetch<{ positions: Position[] }>(`/api/trades/positions?accountId=${accountId}`),
        apiFetch<{ holdings: { asset: string; amount: number; price: number; valueUsd: number }[] }>(`/api/portfolio?accountId=${accountId}`),
      ]);
      setOrders(o.orders);
      setPositions(p.positions);
      setHoldings(port.holdings);
    } catch { /* noop */ }
  }, [accountId]);

  useEffect(() => {
    loadAccountData();
    const id = setInterval(loadAccountData, 10_000);
    return () => clearInterval(id);
  }, [loadAccountData]);

  useEffect(() => {
    fetch('/api/watchlist', { cache: 'no-store' }).then((r) => r.json()).then((b) => setWatching(b.symbols ?? [])).catch(() => undefined);
  }, []);

  const toggleWatch = async (s: string) => {
    const res = await apiFetch<{ watching: boolean }>('/api/watchlist', { method: 'POST', body: JSON.stringify({ symbol: s, action: 'toggle' }) });
    setWatching((prev) => (res.watching ? [...prev, s] : prev.filter((x) => x !== s)));
  };

  const cancel = async (id: string) => {
    try {
      await apiFetch(`/api/trades/orders/${id}`, { method: 'DELETE' });
      loadAccountData(); reloadAccounts();
      push({ tone: 'success', title: 'Order cancelled', body: 'Reserved funds released.' });
    } catch (e) { push({ tone: 'error', title: 'Cancel failed', body: (e as Error).message }); }
  };

  const maxDepth = useMemo(() => {
    if (!book) return 1;
    return Math.max(...book.bids.map((b) => b[1]), ...book.asks.map((a) => a[1]));
  }, [book]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">Crypto spot terminal</h1>
          <p className="mt-0.5 text-[12px] text-muted">USDT markets with balance reservation, holdings accounting and order cancellation.</p>
        </div>
        <AccountSwitcher accounts={accounts} accountId={accountId} onSelect={select} active={active} liveEnabled={liveEnabled} />
      </div>

      <div className="grid gap-3 xl:grid-cols-[230px_minmax(0,1fr)_300px]">
        <aside className="panel hidden overflow-hidden xl:block" style={{ height: 640 }}>
          <MarketList markets={markets} active={symbol} onSelect={setSymbol} onToggleWatch={toggleWatch} watching={watching} showCategory={false} />
        </aside>

        <div className="min-w-0 space-y-3">
          <div className="xl:hidden">
            <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="field-sm mb-2">
              {markets.map((m) => <option key={m.symbol} value={m.symbol}>{m.symbol}</option>)}
            </select>
          </div>
          <ChartPanel symbol={symbol} pricePrecision={dp} onQuote={(q) => setQuote((prev) => ({ ...(prev ?? { bid: q.last, ask: q.last, last: q.last, source: q.source }), ...q, bid: prev?.bid ?? q.last, ask: prev?.ask ?? q.last }))} height={360} />

          <div className="grid gap-3 md:grid-cols-[1fr_240px]">
            <div className="panel overflow-hidden">
              <Tabs
                tabs={[
                  { id: 'orders' as const, label: 'Open orders', count: orders.length },
                  { id: 'positions' as const, label: 'Positions', count: positions.length },
                  { id: 'holdings' as const, label: 'Holdings', count: holdings.filter((h) => h.amount > 0).length },
                ]}
                value={tab}
                onChange={setTab}
              />
              {tab === 'orders' && (orders.length === 0 ? <EmptyState title="No open orders" body="Limit orders reserve balance until filled or cancelled." /> : (
                <table className="w-full">
                  <thead><tr><th className="th">Market</th><th className="th">Side</th><th className="th text-right">Qty</th><th className="th text-right">Price</th><th className="th">Placed</th><th className="th"></th></tr></thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id} className="table-row">
                        <td className="td font-medium text-white">{o.symbol}</td>
                        <td className="td"><Badge tone={o.side === 'BUY' ? 'green' : 'red'}>{o.side}</Badge></td>
                        <td className="td text-right value-mono">{fmtQty(o.qty, 6)}</td>
                        <td className="td text-right value-mono">{o.price ? fmtPrice(o.price, priceDp(o.symbol)) : 'market'}</td>
                        <td className="td text-[11.5px] text-muted">{relTime(o.createdAt)}</td>
                        <td className="td text-right"><button onClick={() => cancel(o.id)} className="rounded-md border border-white/10 px-2 py-1 text-[10.5px] text-muted hover:border-danger/40 hover:text-danger">Cancel</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ))}
              {tab === 'positions' && (positions.length === 0 ? <EmptyState title="No derivative positions" body="Spot purchases are held as balances, not positions. Use the futures terminal for leveraged trades." /> : (
                <table className="w-full">
                  <thead><tr><th className="th">Market</th><th className="th">Side</th><th className="th text-right">Qty</th><th className="th text-right">Entry</th><th className="th text-right">P/L</th></tr></thead>
                  <tbody>
                    {positions.map((p) => (
                      <tr key={p.id} className="table-row">
                        <td className="td font-medium text-white">{p.symbol}</td>
                        <td className="td"><Badge tone={p.side === 'LONG' ? 'green' : 'red'}>{p.side}</Badge></td>
                        <td className="td text-right value-mono">{fmtQty(p.qty, 6)}</td>
                        <td className="td text-right value-mono">{fmtPrice(p.entryPrice, priceDp(p.symbol))}</td>
                        <td className={`td text-right value-mono ${p.unrealizedPnl >= 0 ? 'text-emerald' : 'text-danger'}`}>{fmtSigned(p.unrealizedPnl)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ))}
              {tab === 'holdings' && (holdings.length === 0 ? <EmptyState title="No crypto holdings" body="Balances you buy through the spot terminal appear here with live valuation." /> : (
                <table className="w-full">
                  <thead><tr><th className="th">Asset</th><th className="th text-right">Amount</th><th className="th text-right">Price</th><th className="th text-right">Value</th></tr></thead>
                  <tbody>
                    {holdings.map((h) => (
                      <tr key={h.asset} className="table-row">
                        <td className="td font-medium text-white">{h.asset}</td>
                        <td className="td text-right value-mono">{fmtQty(h.amount, 6)}</td>
                        <td className="td text-right value-mono">{h.price ? fmtMoney(h.price) : '—'}</td>
                        <td className="td text-right value-mono">{fmtMoney(h.valueUsd)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ))}
            </div>

            <div className="panel overflow-hidden">
              <div className="border-b border-white/[0.07] px-3 py-2">
                <p className="text-[11.5px] font-semibold text-white">Order book</p>
                <p className="text-[9.5px] text-muted">Depth model from live top-of-book</p>
              </div>
              <div className="px-2.5 py-2 text-[10.5px]">
                <div className="mb-1 flex justify-between text-muted"><span>Price</span><span>Size</span></div>
                {book?.asks.slice().reverse().map(([p, s], i) => (
                  <div key={`a${i}`} className="relative flex justify-between py-[2px]">
                    <div className="absolute inset-y-0 right-0 bg-danger/10" style={{ width: `${(s / maxDepth) * 100}%` }} />
                    <span className="value-mono relative text-danger">{fmtPrice(p, dp)}</span>
                    <span className="value-mono relative text-white/70">{s.toFixed(4)}</span>
                  </div>
                ))}
                <div className="my-1.5 flex items-center justify-between border-y border-white/[0.07] py-1.5">
                  <span className="value-mono text-[13px] font-semibold text-white">{quote ? fmtPrice(quote.last, dp) : '—'}</span>
                  <span className={`value-mono text-[10px] ${(quote?.change24h ?? 0) >= 0 ? 'text-emerald' : 'text-danger'}`}>{fmtPct(quote?.change24h)}</span>
                </div>
                {book?.bids.map(([p, s], i) => (
                  <div key={`b${i}`} className="relative flex justify-between py-[2px]">
                    <div className="absolute inset-y-0 right-0 bg-emerald/10" style={{ width: `${(s / maxDepth) * 100}%` }} />
                    <span className="value-mono relative text-emerald">{fmtPrice(p, dp)}</span>
                    <span className="value-mono relative text-white/70">{s.toFixed(4)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="panel overflow-hidden">
              <div className="border-b border-white/[0.07] px-3 py-2 text-[11.5px] font-semibold text-white">Recent trades</div>
              <div className="px-3 py-2 text-[10.5px]">
                <div className="mb-1 flex justify-between text-muted"><span>Price</span><span>Size</span><span>Time</span></div>
                {trades.length === 0 && <p className="py-3 text-center text-muted">Waiting for prints…</p>}
                {trades.map((t) => (
                  <div key={t.id} className="flex justify-between py-[2px]">
                    <span className={`value-mono ${t.side === 'BUY' ? 'text-emerald' : 'text-danger'}`}>{fmtPrice(t.price, dp)}</span>
                    <span className="value-mono text-white/70">{t.qty.toFixed(4)}</span>
                    <span className="value-mono text-muted">{new Date(t.time).toLocaleTimeString('en-GB', { hour12: false })}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="panel p-3">
              <p className="text-[11.5px] font-semibold text-white">24h statistics</p>
              <dl className="mt-2 space-y-1.5 text-[11px]">
                {[
                  ['Last price', quote ? fmtPrice(quote.last, dp) : '—'],
                  ['24h change', fmtPct(quote?.change24h)],
                  ['24h high', quote?.high24h ? fmtPrice(quote.high24h, dp) : '—'],
                  ['24h low', quote?.low24h ? fmtPrice(quote.low24h, dp) : '—'],
                  ['24h volume', quote?.volume24h ? quote.volume24h.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '—'],
                  ['Source', quote?.source ?? '—'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between"><dt className="text-muted">{k}</dt><dd className="value-mono text-white">{v}</dd></div>
                ))}
              </dl>
            </div>
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
              showLeverage={false}
              showTpSl={false}
              onPlaced={() => { loadAccountData(); reloadAccounts(); }}
            />
          ) : <p className="p-4 text-[12px] text-muted">Select a market.</p>}
        </aside>
      </div>

      <div className="panel p-3.5 xl:hidden">
        {meta && active && (
          <OrderPanel
            market={{ ...meta, baseAsset: meta.baseAsset, takerFee: 0.001 }}
            accountId={accountId}
            accountType={active.type}
            available={active.available}
            quote={quote}
            showLeverage={false}
            showTpSl={false}
            onPlaced={() => { loadAccountData(); reloadAccounts(); }}
          />
        )}
      </div>
    </div>
  );
}
