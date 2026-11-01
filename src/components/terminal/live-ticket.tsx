'use client';

import { useState } from 'react';
import { apiFetch } from '@/components/ui';
import { fmtMoney } from '@/lib/format';

/** Order entry ticket. Internal dealing: orders on any account type fill at the
 *  current reference quote; PAPER accounts are explicitly labelled demo. */
export function LiveTicket({ symbol, accountId, accountType, available, onSubmitted }: {
  symbol: string;
  accountId: string;
  accountType: 'LIVE' | 'PAPER';
  available: number;
  onSubmitted: () => void;
}) {
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [type, setType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [leverage, setLeverage] = useState('1');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null); setMessage(null);
    const qty = Number(quantity);
    const limitPrice = Number(price);
    if (!accountId) return setError('Choose an account before placing an order.');
    if (!Number.isFinite(qty) || qty <= 0) return setError('Enter a valid quantity greater than zero.');
    if (type === 'LIMIT' && (!Number.isFinite(limitPrice) || limitPrice <= 0)) return setError('Enter a valid limit price.');
    setSubmitting(true);
    try {
      const result = await apiFetch<{ order: { id: string; status: string }; filled: boolean; executionMode: string }>('/api/trades/orders', {
        method: 'POST',
        body: JSON.stringify({ accountId, symbol, side, type, qty, ...(type === 'LIMIT' ? { price: limitPrice } : {}), leverage: Number(leverage), marginMode: 'CROSS' }),
      });
      setMessage(result.filled ? 'Demo order filled against the latest reference quote.' : 'Demo limit order recorded. It will wait for its trigger price.');
      setQuantity('');
      onSubmitted();
    } catch (e) { setError((e as Error).message || 'Order could not be submitted.'); }
    finally { setSubmitting(false); }
  };

  return <div className="space-y-4">
    <div className="flex items-center justify-between gap-2"><div><p className="text-sm font-semibold text-white">Place Trade</p><p className="mt-1 text-[11px] text-muted">{symbol} · {accountType === 'PAPER' ? 'Demo Trading' : 'Live account'}</p></div><span className={accountType === 'PAPER' ? 'rounded-full border border-lime/20 bg-lime/[.08] px-2 py-1 text-[9px] font-semibold uppercase tracking-wide text-lime' : 'rounded-full border border-amber-400/20 bg-amber-400/[.07] px-2 py-1 text-[9px] font-semibold uppercase tracking-wide text-amber-300'}>{accountType === 'PAPER' ? 'Demo · simulated' : 'Live unavailable'}</span></div>
    <div className="grid grid-cols-2 gap-1 rounded-xl bg-black/30 p-1" aria-label="Order side">{(['BUY','SELL'] as const).map(s => <button type="button" key={s} onClick={() => setSide(s)} aria-pressed={side === s} className={`rounded-lg py-2.5 text-xs font-semibold transition ${side === s ? s === 'BUY' ? 'bg-emerald text-ink-950' : 'bg-danger text-white' : 'text-muted hover:text-white'}`}>{s}</button>)}</div>
    <div className="grid grid-cols-2 gap-1 rounded-xl bg-black/30 p-1" aria-label="Order type">{(['MARKET','LIMIT'] as const).map(t => <button type="button" key={t} onClick={() => setType(t)} aria-pressed={type === t} className={`rounded-lg py-2 text-xs font-medium transition ${type === t ? 'bg-white/10 text-white' : 'text-muted hover:text-white'}`}>{t}</button>)}</div>
    {type === 'LIMIT' && <label className="block"><span className="label">Limit price</span><input value={price} onChange={e => setPrice(e.target.value)} inputMode="decimal" placeholder="0.00" className="field mt-2" /></label>}
    <label className="block"><span className="label">Quantity</span><input value={quantity} onChange={e => setQuantity(e.target.value)} inputMode="decimal" placeholder="0.00" className="field mt-2" /></label>
    <label className="block"><span className="label">Leverage</span><select value={leverage} onChange={e => setLeverage(e.target.value)} className="field mt-2"><option value="1">1×</option><option value="2">2×</option><option value="5">5×</option><option value="10">10×</option><option value="20">20×</option><option value="50">50×</option><option value="100">100×</option></select></label>
    <div className="rounded-xl border border-white/[.07] bg-black/20 p-3 text-[11px] leading-relaxed text-muted"><div className="flex justify-between"><span>Available demo balance</span><strong className="value-mono text-white">{fmtMoney(available)}</strong></div><p className="mt-2">Demo orders use simulated execution against external reference prices. They do not access an exchange, create real liquidity or use cash funds.</p></div>
    {error && <p role="alert" className="rounded-lg border border-danger/20 bg-danger/10 p-2.5 text-[11px] text-danger">{error}</p>}
    {message && <p role="status" className="rounded-lg border border-lime/20 bg-lime/[.06] p-2.5 text-[11px] text-lime">{message}</p>}
    <button type="button" onClick={submit} disabled={submitting || !quantity} className="w-full rounded-xl bg-lime py-3 text-xs font-semibold text-ink-950 transition hover:brightness-105 disabled:cursor-not-allowed disabled:bg-white/[.08] disabled:text-white/35">{submitting ? 'Submitting…' : accountType === 'PAPER' ? `Place demo ${side.toLowerCase()} order` : `Place ${side.toLowerCase()} order`}</button>
    {accountType === 'LIVE' && <p className="text-center text-[10px] leading-relaxed text-muted">Internal dealing: orders fill at the current reference bid/ask. External venue routing is not connected.</p>}
  </div>;
}
