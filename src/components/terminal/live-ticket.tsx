'use client';

import { useState } from 'react';

/** Visual order-entry layout only. There is no submission or simulated fill. */
export function LiveTicket({ symbol }: { symbol: string }) {
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [type, setType] = useState<'market' | 'limit'>('market');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  return <div className="space-y-4">
    <div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-white">Order ticket</p><p className="mt-1 text-[11px] text-muted">{symbol} · Order matching</p></div><span className="rounded-full border border-amber-400/20 bg-amber-400/[.07] px-2 py-1 text-[9px] font-semibold uppercase tracking-wide text-amber-300">Unavailable</span></div>
    <div className="grid grid-cols-2 gap-1 rounded-xl bg-black/30 p-1" aria-label="Order side">{(['buy','sell'] as const).map(s => <button key={s} onClick={() => setSide(s)} aria-pressed={side === s} className={`rounded-lg py-2.5 text-xs font-semibold capitalize transition ${side === s ? s === 'buy' ? 'bg-emerald text-ink-950' : 'bg-danger text-white' : 'text-muted hover:text-white'}`}>{s}</button>)}</div>
    <div className="grid grid-cols-2 gap-1 rounded-xl bg-black/30 p-1" aria-label="Order type">{(['market','limit'] as const).map(t => <button key={t} onClick={() => setType(t)} aria-pressed={type === t} className={`rounded-lg py-2 text-xs font-medium capitalize transition ${type === t ? 'bg-white/10 text-white' : 'text-muted hover:text-white'}`}>{t}</button>)}</div>
    {type === 'limit' && <label className="block"><span className="label">Limit price</span><input value={price} onChange={e => setPrice(e.target.value)} inputMode="decimal" placeholder="0.00" className="field mt-2" /></label>}
    <label className="block"><span className="label">Amount</span><input value={quantity} onChange={e => setQuantity(e.target.value)} inputMode="decimal" placeholder="0.00" className="field mt-2" /></label>
    <div className="rounded-xl border border-white/[.07] bg-black/20 p-3 text-[11px] leading-relaxed text-muted">Live order matching is not connected. These fields are for reviewing the interface and cannot place an order.</div>
    <button disabled className="w-full cursor-not-allowed rounded-xl bg-white/[.08] py-3 text-xs font-semibold text-white/35">Trading unavailable</button>
    <p className="text-center text-[10px] leading-relaxed text-muted">External chart prices are reference data, not PRIMEVEST order-book prices.</p>
  </div>;
}
