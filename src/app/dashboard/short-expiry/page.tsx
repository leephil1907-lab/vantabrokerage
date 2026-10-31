'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChartPanel } from '@/components/chart';
import { MarketList } from '@/components/market-selector';
import { AccountSwitcher, useAccount } from '@/components/terminal/account-bar';
import { Badge, apiFetch, useToast, EmptyState, StatusBadge, SectionHeader } from '@/components/ui';
import { useMarkets } from '@/lib/use-markets';
import { fmtMoney, fmtPrice, fmtSigned, priceDp, relTime, countdown } from '@/lib/format';

const EXPIRIES = [
  { s: 30, label: '30s' },
  { s: 60, label: '1m' },
  { s: 120, label: '2m' },
  { s: 300, label: '5m' },
  { s: 600, label: '10m' },
  { s: 900, label: '15m' },
  { s: 1800, label: '30m' },
  { s: 3600, label: '1h' },
];

type BinaryTrade = {
  id: string; symbol: string; direction: 'CALL' | 'PUT'; stake: number; payoutRate: number; entryPrice: number;
  settlePrice: number | null; result: string; pnl: number; expiresAt: string; settledAt: string | null; env: string;
  entryQuoteTs: string; exitQuoteTs: string | null;
};

export default function ShortExpiryTerminal() {
  const { markets } = useMarkets('BINARY');
  const [symbol, setSymbol] = useState('EUR/USD-BIN');
  const [quote, setQuote] = useState<{ last: number; bid: number; ask: number; change24h?: number; source: string; fetchedAt: string } | null>(null);
  const [stake, setStake] = useState('10');
  const [expiry, setExpiry] = useState(60);
  const [trades, setTrades] = useState<{ open: BinaryTrade[]; settled: BinaryTrade[] }>({ open: [], settled: [] });
  const [busy, setBusy] = useState<'CALL' | 'PUT' | null>(null);
  const [now, setNow] = useState(Date.now());
  const [watching, setWatching] = useState<string[]>([]);
  const { accounts, accountId, select, active, liveEnabled, reloadAccounts } = useAccount();
  const { push } = useToast();
  const meta = markets.find((m) => m.symbol === symbol);
  const dp = meta?.pricePrecision ?? 4;
  const payoutRate = 0.85;

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const loadTrades = useCallback(async () => {
    if (!accountId) return;
    try {
      const res = await apiFetch<{ open: BinaryTrade[]; settled: BinaryTrade[] }>(`/api/binary/trades?accountId=${accountId}`);
      setTrades({ open: res.open, settled: res.settled });
    } catch { /* polling */ }
  }, [accountId]);

  useEffect(() => {
    loadTrades();
    const id = setInterval(loadTrades, 5000);
    return () => clearInterval(id);
  }, [loadTrades]);

  useEffect(() => {
    fetch('/api/watchlist', { cache: 'no-store' }).then((r) => r.json()).then((b) => setWatching(b.symbols ?? [])).catch(() => undefined);
  }, []);

  const openCount = trades.open.length;
  const settledCount = trades.settled.length;
  const wins = trades.settled.filter((t) => t.result === 'WIN').length;
  const netPnl = trades.settled.reduce((s, t) => s + t.pnl, 0);

  const potential = useMemo(() => {
    const s = Number(stake) || 0;
    return { payout: s * (1 + payoutRate), profit: s * payoutRate };
  }, [stake]);

  async function place(direction: 'CALL' | 'PUT') {
    const amount = Number(stake);
    if (!active || !accountId) return;
    if (!amount || amount < 1) { push({ tone: 'error', title: 'Enter a stake', body: 'Minimum stake is 1.00.' }); return; }
    setBusy(direction);
    try {
      await apiFetch('/api/binary/trades', {
        method: 'POST',
        body: JSON.stringify({ accountId, symbol, direction, stake: amount, expirySeconds: expiry }),
      });
      push({
        tone: 'success',
        title: `${direction} contract opened`,
        body: `${fmtMoney(amount)} on ${symbol} expiring in ${EXPIRIES.find((e) => e.s === expiry)?.label}. Settlement uses a fresh server quote at expiry.`,
      });
      loadTrades(); reloadAccounts();
    } catch (e) {
      push({ tone: 'error', title: 'Contract rejected', body: (e as Error).message });
    } finally {
      setBusy(null);
    }
  }

  const toggleWatch = async (s: string) => {
    const res = await apiFetch<{ watching: boolean }>('/api/watchlist', { method: 'POST', body: JSON.stringify({ symbol: s, action: 'toggle' }) });
    setWatching((prev) => (res.watching ? [...prev, s] : prev.filter((x) => x !== s)));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-white">
            Short-expiry CALL/PUT
            <Badge tone="blue">paper environment</Badge>
          </h1>
          <p className="mt-0.5 text-[12px] text-muted">
            Contracts settle on a fresh server-side quote at expiry — entry and exit quote timestamps are stored on every trade.
          </p>
        </div>
        <AccountSwitcher accounts={accounts} accountId={accountId} onSelect={select} active={active} liveEnabled={liveEnabled} />
      </div>

      <div className="rounded-xl border border-siren/25 bg-siren/[0.06] px-4 py-2.5 text-[11.5px] leading-relaxed text-siren">
        Short-expiry products are high risk. In this deployment contracts execute in the <strong>paper environment</strong>: stakes use simulated funds and every
        contract is labelled PAPER in your history. Live short-expiry execution activates only when an execution provider is connected.
      </div>

      <div className="grid gap-3 xl:grid-cols-[230px_minmax(0,1fr)_320px]">
        <aside className="panel hidden overflow-hidden xl:block" style={{ height: 560 }}>
          <MarketList markets={markets} active={symbol} onSelect={setSymbol} onToggleWatch={toggleWatch} watching={watching} showCategory={false} />
        </aside>

        <div className="min-w-0 space-y-3">
          <div className="xl:hidden">
            <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="field-sm mb-2">
              {markets.map((m) => <option key={m.symbol} value={m.symbol}>{m.symbol.replace('-BIN', '')}</option>)}
            </select>
          </div>
          <ChartPanel symbol={symbol} pricePrecision={dp} onQuote={(q) => setQuote((prev) => ({ ...(prev ?? { bid: q.last, ask: q.last, source: q.source, fetchedAt: new Date().toISOString() }), ...q, bid: prev?.bid ?? q.last, ask: prev?.ask ?? q.last }))} height={340} showVolume={false} />

          <div className="grid gap-3 sm:grid-cols-2">
            {trades.open.length === 0 ? (
              <div className="panel col-span-full p-4">
                <EmptyState title="No active contracts" body="Choose a direction and expiry to open a short-expiry contract. Settlement happens automatically at expiry." />
              </div>
            ) : (
              trades.open.map((t) => {
                const msLeft = new Date(t.expiresAt).getTime() - now;
                const total = new Date(t.expiresAt).getTime() - new Date(t.entryQuoteTs).getTime();
                const progress = Math.min(100, Math.max(0, 100 - (msLeft / total) * 100));
                const winning = quote ? (t.direction === 'CALL' ? quote.last > t.entryPrice : quote.last < t.entryPrice) : null;
                return (
                  <div key={t.id} className="panel p-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge tone={t.direction === 'CALL' ? 'green' : 'red'}>{t.direction}</Badge>
                        <span className="text-[12.5px] font-semibold text-white">{t.symbol.replace('-BIN', '')}</span>
                        <Badge tone="blue">{t.env}</Badge>
                      </div>
                      <span className="value-mono text-[15px] font-semibold text-lime">{countdown(msLeft)}</span>
                    </div>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-lime transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="mt-2.5 grid grid-cols-3 gap-2 text-[10.5px]">
                      <div><p className="text-muted">Entry</p><p className="value-mono text-white">{fmtPrice(t.entryPrice, dp)}</p></div>
                      <div><p className="text-muted">Now</p><p className="value-mono text-white">{quote ? fmtPrice(quote.last, dp) : '—'}</p></div>
                      <div><p className="text-muted">Status</p><p className={`value-mono ${winning === null ? 'text-muted' : winning ? 'text-emerald' : 'text-danger'}`}>{winning === null ? '—' : winning ? 'in the money' : 'out of the money'}</p></div>
                    </div>
                    <div className="mt-2 flex justify-between border-t border-white/[0.07] pt-2 text-[10.5px] text-muted">
                      <span>stake {fmtMoney(t.stake)}</span>
                      <span>payout {fmtMoney(t.stake * (1 + t.payoutRate))} ({Math.round(t.payoutRate * 100)}%)</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <section className="panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
              <SectionHeader title="Settlement history" subtitle="Server-quoted entry and exit prices with timestamps" />
              <div className="flex gap-3 text-[10.5px] text-muted">
                <span>{settledCount} settled</span>
                <span className="text-emerald">{wins} wins</span>
                <span className={netPnl >= 0 ? 'text-emerald' : 'text-danger'}>{fmtSigned(netPnl)} net</span>
              </div>
            </div>
            {trades.settled.length === 0 ? (
              <EmptyState title="No settled contracts yet" body="Once a contract expires, the settlement price, result and P/L appear here with both quote timestamps." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px]">
                  <thead><tr><th className="th">Market</th><th className="th">Dir.</th><th className="th text-right">Stake</th><th className="th text-right">Entry</th><th className="th text-right">Settle</th><th className="th">Result</th><th className="th text-right">P/L</th><th className="th">Settled</th><th className="th">Feed</th></tr></thead>
                  <tbody>
                    {trades.settled.map((t) => (
                      <tr key={t.id} className="table-row">
                        <td className="td font-medium text-white">{t.symbol.replace('-BIN', '')} <Badge tone="blue">{t.env}</Badge></td>
                        <td className="td"><Badge tone={t.direction === 'CALL' ? 'green' : 'red'}>{t.direction}</Badge></td>
                        <td className="td text-right value-mono">{fmtMoney(t.stake)}</td>
                        <td className="td text-right value-mono">{fmtPrice(t.entryPrice, dp)}</td>
                        <td className="td text-right value-mono">{fmtPrice(t.settlePrice, dp)}</td>
                        <td className="td"><StatusBadge status={t.result} /></td>
                        <td className={`td text-right value-mono ${t.pnl >= 0 ? 'text-emerald' : 'text-danger'}`}>{fmtSigned(t.pnl)}</td>
                        <td className="td text-[11px] text-muted">{relTime(t.settledAt)}</td>
                        <td className="td text-[10.5px] text-muted">{new Date(t.entryQuoteTs).toLocaleTimeString('en-GB')} → {t.exitQuoteTs ? new Date(t.exitQuoteTs).toLocaleTimeString('en-GB') : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <aside className="panel p-3.5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="label">Trade ticket</p>
              {quote && <span className="value-mono text-[11px] text-muted">{quote.source}</span>}
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-ink-900/70 p-3">
              <p className="text-[11px] text-muted">{symbol.replace('-BIN', '')} · spot price</p>
              <p className="value-mono mt-0.5 text-[22px] font-semibold text-white">{quote ? fmtPrice(quote.last, dp) : '—'}</p>
              <p className="mt-0.5 text-[10px] text-muted">quote fetched {quote ? relTime(quote.fetchedAt) : '—'}</p>
            </div>

            <label className="block">
              <span className="label">Stake (USD)</span>
              <input value={stake} onChange={(e) => setStake(e.target.value)} inputMode="decimal" className="field mt-1.5" />
              <div className="mt-1.5 grid grid-cols-4 gap-1">
                {[10, 25, 50, 100].map((v) => (
                  <button key={v} onClick={() => setStake(String(v))} className={`rounded-md border py-1 text-[10.5px] ${Number(stake) === v ? 'border-lime/40 bg-lime/10 text-lime' : 'border-white/10 text-muted hover:text-white'}`}>{v}</button>
                ))}
              </div>
            </label>

            <div>
              <span className="label">Expiry</span>
              <div className="mt-1.5 grid grid-cols-4 gap-1">
                {EXPIRIES.map((e) => (
                  <button key={e.s} onClick={() => setExpiry(e.s)} className={`rounded-md border py-1.5 text-[10.5px] font-medium ${expiry === e.s ? 'border-lime/40 bg-lime/10 text-lime' : 'border-white/10 text-muted hover:text-white'}`}>{e.label}</button>
                ))}
              </div>
            </div>

            <dl className="space-y-1 rounded-xl border border-white/[0.07] bg-ink-900/60 p-2.5 text-[11px]">
              <div className="flex justify-between"><dt className="text-muted">Payout rate</dt><dd className="value-mono text-white">{Math.round(payoutRate * 100)}%</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Potential profit</dt><dd className="value-mono text-emerald">{fmtMoney(potential.profit)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Total payout</dt><dd className="value-mono text-white">{fmtMoney(potential.payout)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Available</dt><dd className="value-mono text-muted">{fmtMoney(active?.available ?? 0)}</dd></div>
            </dl>

            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => place('CALL')} disabled={!!busy || !active} className="btn-up flex-col py-3 text-[13px]">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 11V3M3.5 6.5 7 3l3.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                {busy === 'CALL' ? 'Placing…' : 'CALL'}
              </button>
              <button onClick={() => place('PUT')} disabled={!!busy || !active} className="btn-down flex-col py-3 text-[13px]">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 3v8M3.5 7.5 7 11l3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                {busy === 'PUT' ? 'Placing…' : 'PUT'}
              </button>
            </div>
            <p className="text-center text-[10px] leading-relaxed text-muted">
              {openCount} active · stake is reserved from your balance until settlement.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
