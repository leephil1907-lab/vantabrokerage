'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiFetch, useToast, Badge } from '@/components/ui';
import { fmtMoney, fmtPrice, fmtQty, priceDp } from '@/lib/format';

export type MarketMeta = {
  symbol: string;
  displayName: string;
  category: string;
  maxLeverage: number;
  pricePrecision: number;
  baseAsset?: string;
  quoteAsset?: string;
  takerFee?: number;
};

const ORDER_TYPES = [
  { id: 'MARKET', label: 'Market' },
  { id: 'LIMIT', label: 'Limit' },
  { id: 'STOP', label: 'Stop' },
] as const;

export function OrderPanel({
  market,
  accountId,
  accountType,
  available,
  quote,
  onPlaced,
  showLeverage = true,
  showTpSl = true,
  defaultType = 'MARKET',
  compact = false,
}: {
  market: MarketMeta;
  accountId: string;
  accountType: 'LIVE' | 'PAPER';
  available: number;
  quote: { last: number; bid: number; ask: number; source?: string } | null;
  onPlaced: () => void;
  showLeverage?: boolean;
  showTpSl?: boolean;
  defaultType?: 'MARKET' | 'LIMIT' | 'STOP';
  compact?: boolean;
}) {
  const { push } = useToast();
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [type, setType] = useState<'MARKET' | 'LIMIT' | 'STOP'>(defaultType);
  const [qty, setQty] = useState('');
  const [price, setPrice] = useState('');
  const [leverage, setLeverage] = useState(1);
  const [marginMode, setMarginMode] = useState<'CROSS' | 'ISOLATED'>('CROSS');
  const [tp, setTp] = useState('');
  const [sl, setSl] = useState('');
  const [pct, setPct] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSpot = market.category === 'SPOT';
  const isDerivative = !isSpot;

  useEffect(() => { setType(defaultType); }, [defaultType, market.symbol]);
  useEffect(() => { setLeverage(1); setQty(''); setPrice(''); setTp(''); setSl(''); setPct(null); setError(null); }, [market.symbol]);

  const effPrice = type === 'MARKET' ? (side === 'BUY' ? quote?.ask ?? 0 : quote?.bid ?? 0) : Number(price);
  const effLeverage = isSpot ? 1 : leverage;
  const qtyNum = Number(qty) || 0;
  const notional = effPrice * qtyNum;
  const margin = isDerivative ? notional / effLeverage : notional;
  const fee = notional * (market.takerFee ?? 0.001);
  const requiredForBuy = isSpot ? notional + fee : margin + fee;

  const pctButtons = [0.1, 0.25, 0.5, 0.75, 1];

  function applyPct(p: number) {
    setPct(p);
    if (!effPrice) return;
    const spend = available * p;
    const raw = isDerivative ? (spend * effLeverage) / effPrice : spend / effPrice;
    setQty(roundTo(raw, market.pricePrecision >= 3 ? 4 : 2));
  }

  const canSubmit = useMemo(() => {
    if (busy || !accountId || !qtyNum) return false;
    if (type !== 'MARKET' && !Number(price)) return false;
    if (side === 'BUY' && requiredForBuy > available + 1e-9) return false;
    return true;
  }, [busy, accountId, qtyNum, type, price, side, requiredForBuy, available]);

  async function submit() {
    setError(null);
    setBusy(true);
    try {
      const res = await apiFetch<{ filled: boolean; executionMode: string }>('/api/trades/orders', {
        method: 'POST',
        body: JSON.stringify({
          accountId,
          symbol: market.symbol,
          side,
          type,
          qty: qtyNum,
          ...(type !== 'MARKET' ? { price: Number(price) } : {}),
          ...(isDerivative ? { leverage: effLeverage, marginMode } : {}),
          ...(tp ? { takeProfit: Number(tp) } : {}),
          ...(sl ? { stopLoss: Number(sl) } : {}),
        }),
      });
      push({
        tone: 'success',
        title: res.filled ? `${side} filled · ${market.symbol}` : `${type} order placed · ${market.symbol}`,
        body: res.filled
          ? `Executed at the server quote${res.executionMode === 'paper' ? ' in your paper account' : ''}.`
          : 'Resting order created and margin reserved. The worker will fill it when the trigger is met.',
      });
      setQty(''); setPrice(''); setTp(''); setSl(''); setPct(null);
      onPlaced();
    } catch (e) {
      const err = e as Error & { code?: string };
      setError(err.message);
      push({ tone: 'error', title: 'Order rejected', body: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="label">Place order</p>
        {accountType === 'PAPER' ? <Badge tone="blue">paper</Badge> : <Badge tone="lime">live</Badge>}
      </div>

      <div className="grid grid-cols-2 gap-1 rounded-xl bg-ink-900 p-1">
        {(['BUY', 'SELL'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSide(s)}
            className={`rounded-lg py-2 text-[12.5px] font-semibold transition ${
              side === s ? (s === 'BUY' ? 'bg-emerald text-ink-950' : 'bg-danger text-white') : 'text-muted hover:text-white'
            }`}
          >
            {isSpot ? (s === 'BUY' ? 'Buy' : 'Sell') : s === 'BUY' ? 'Buy / Long' : 'Sell / Short'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-1 rounded-xl bg-ink-900 p-1">
        {ORDER_TYPES.map((t) => (
          <button
            key={t.id}
            onClick={() => setType(t.id)}
            className={`rounded-lg py-1.5 text-[11.5px] font-medium transition ${type === t.id ? 'bg-white/10 text-white' : 'text-muted hover:text-white'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {type !== 'MARKET' && (
        <label className="block">
          <span className="label">{type === 'LIMIT' ? 'Limit price' : 'Stop trigger'}</span>
          <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" placeholder={quote ? String(roundTo(side === 'BUY' ? quote.ask : quote.bid, market.pricePrecision)) : '0.00'} className="field mt-1.5" />
        </label>
      )}

      <label className="block">
        <div className="flex items-center justify-between">
          <span className="label">Quantity ({market.baseAsset ?? market.symbol.split('/')[0]})</span>
          {quote && <span className="value-mono text-[10.5px] text-muted">{side === 'BUY' ? 'ask' : 'bid'} {fmtPrice(effPrice || null, market.pricePrecision)}</span>}
        </div>
        <input value={qty} onChange={(e) => { setQty(e.target.value); setPct(null); }} inputMode="decimal" placeholder="0.00" className="field mt-1.5" />
        <div className="mt-1.5 grid grid-cols-5 gap-1">
          {pctButtons.map((p) => (
            <button key={p} onClick={() => applyPct(p)} className={`rounded-md border py-1 text-[10px] font-medium transition ${pct === p ? 'border-lime/40 bg-lime/10 text-lime' : 'border-white/10 text-muted hover:text-white'}`}>
              {p * 100}%
            </button>
          ))}
        </div>
      </label>

      {showLeverage && isDerivative && (
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="label">Leverage</span>
            <select value={leverage} onChange={(e) => setLeverage(Number(e.target.value))} className="field mt-1.5">
              {[1, 2, 5, 10, 20, 25, 50, 100, 200].filter((l) => l <= market.maxLeverage).map((l) => (
                <option key={l} value={l}>{l}×</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label">Margin mode</span>
            <select value={marginMode} onChange={(e) => setMarginMode(e.target.value as 'CROSS' | 'ISOLATED')} className="field mt-1.5">
              <option value="CROSS">Cross</option>
              <option value="ISOLATED">Isolated</option>
            </select>
          </label>
        </div>
      )}

      {showTpSl && !compact && (
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="label">Take profit</span>
            <input value={tp} onChange={(e) => setTp(e.target.value)} inputMode="decimal" placeholder="optional" className="field mt-1.5" />
          </label>
          <label className="block">
            <span className="label">Stop loss</span>
            <input value={sl} onChange={(e) => setSl(e.target.value)} inputMode="decimal" placeholder="optional" className="field mt-1.5" />
          </label>
        </div>
      )}

      <dl className="space-y-1 rounded-xl border border-white/[0.07] bg-ink-900/60 p-2.5 text-[11px]">
        <Row label="Notional" value={notional ? fmtMoney(notional) : '—'} />
        {isDerivative && <Row label={`Margin (${effLeverage}×)`} value={margin ? fmtMoney(margin) : '—'} />}
        <Row label="Est. taker fee" value={fee ? fmtMoney(fee) : '—'} />
        <Row label={side === 'BUY' ? 'Required' : isSpot ? 'You receive' : 'Required'} value={side === 'BUY' ? fmtMoney(requiredForBuy) : isSpot ? fmtMoney(Math.max(0, notional - fee)) : fmtMoney(margin + fee)} />
        <Row label="Available" value={fmtMoney(available)} muted />
      </dl>

      {error && <p className="rounded-lg border border-danger/30 bg-danger/10 px-2.5 py-2 text-[11px] leading-relaxed text-danger">{error}</p>}

      <button onClick={submit} disabled={!canSubmit} className={side === 'BUY' ? 'btn-up py-2.5 text-[13px]' : 'btn-down py-2.5 text-[13px]'}>
        {busy ? 'Submitting…' : `${side === 'BUY' ? (isSpot ? 'Buy' : 'Long') : isSpot ? 'Sell' : 'Short'} ${market.symbol}`}
      </button>
      {side === 'BUY' && requiredForBuy > available + 1e-9 && (
        <p className="text-center text-[10.5px] text-siren">Insufficient available balance — reduce quantity or leverage, or transfer funds from your other account.</p>
      )}
      <p className="text-center text-[10px] leading-relaxed text-muted">
        Orders are priced from the server quote ({quote?.source ?? 'provider'}), never from the browser.
      </p>
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted">{label}</dt>
      <dd className={`value-mono ${muted ? 'text-muted' : 'text-white'}`}>{value}</dd>
    </div>
  );
}

function roundTo(v: number, dp: number) {
  const f = Math.pow(10, dp);
  const r = Math.round(v * f) / f;
  return String(r);
}
