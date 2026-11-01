export function fmtPrice(v: number | null | undefined, dp = 2) {
  if (v === null || v === undefined || !isFinite(v)) return '—';
  return v.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
}

export function fmtMoney(v: number | null | undefined, dp = 2, currency = 'USD') {
  if (v === null || v === undefined || !isFinite(v)) return '—';
  const abs = Math.abs(v);
  const s = abs.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
  return `${v < 0 ? '-' : ''}${currency === 'USD' ? '$' : ''}${s}`;
}

export function fmtSigned(v: number | null | undefined, dp = 2) {
  if (v === null || v === undefined || !isFinite(v)) return '—';
  return `${v > 0 ? '+' : ''}${v.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp })}`;
}

export function fmtPct(v: number | null | undefined, dp = 2) {
  if (v === null || v === undefined || !isFinite(v)) return '—';
  return `${v > 0 ? '+' : ''}${v.toFixed(dp)}%`;
}

export function fmtQty(v: number | null | undefined, dp = 6) {
  if (v === null || v === undefined || !isFinite(v)) return '—';
  return v.toLocaleString('en-US', { maximumFractionDigits: dp });
}

export function fmtTime(iso: string | null | undefined) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function relTime(iso: string | null | undefined) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function countdown(msRemaining: number) {
  const total = Math.max(0, Math.floor(msRemaining / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Decimal places for an instrument symbol.
 *
 * Forex majors quote in pips — 5 dp (3 for JPY crosses) — which is why the
 * pair branch comes first: rendering EUR/USD as 1.12 would hide the spread
 * entirely. Crypto, metals, energy and indices follow their own conventions.
 */
export const priceDp = (symbol: string) => {
  const sym = symbol.toUpperCase();
  if (sym.includes('USDT') || sym.includes('USDC') || sym.includes('-PERP')) {
    const base = sym.split('/')[0].replace('-PERP', '');
    if (['DOGE', 'ADA', 'TRX', 'XRP'].includes(base)) return 5;
    if (['SOL', 'LTC'].includes(base)) return 3;
    return 2;
  }
  // FX pairs: 3 dp for JPY quotes, 5 dp (pips) otherwise.
  if (sym.includes('/') || /^(EUR|GBP|AUD|NZD|USD|CAD|CHF|JPY)[/]?(EUR|GBP|AUD|NZD|USD|CAD|CHF|JPY)$/.test(sym)) {
    const quote = sym.includes('/') ? sym.split('/')[1] : sym.slice(3);
    return quote === 'JPY' ? 3 : 5;
  }
  if (sym.startsWith('JPY')) return 3;
  if (sym.startsWith('NATGAS')) return 4;
  if (sym.startsWith('XAG') || sym.startsWith('WTI') || sym.startsWith('BRENT')) return 3;
  return 2;
};

/** UI-friendly ledger descriptions: internal labels stay in the database,
 *  visitors see plain product language. */
export function friendlyLedgerDescription(desc: string | null, type?: string): string {
  if (!desc) return type ?? String.fromCharCode(8212);
  if (desc.startsWith('Virtual trading capital') || desc.startsWith('Virtual practice starting balance')) return 'Demo starting balance';
  return desc;
}
