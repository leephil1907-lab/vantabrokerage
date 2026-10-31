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

export const priceDp = (symbol: string) => {
  if (symbol.includes('USDT')) {
    if (symbol.startsWith('DOGE') || symbol.startsWith('ADA') || symbol.startsWith('TRX') || symbol.startsWith('XRP')) return 5;
    if (symbol.startsWith('SOL') || symbol.startsWith('LTC')) return 3;
    return 2;
  }
  if (symbol.startsWith('USD/JPY')) return 3;
  if (symbol.startsWith('NATGAS')) return 4;
  if (symbol.startsWith('XAG') || symbol.startsWith('WTI')) return 3;
  return 2;
};
