/**
 * Technical indicator + performance statistics engine.
 *
 * Pure, dependency-free TypeScript. Follows the correctness doctrine used by
 * modern research tooling (e.g. HKUDS/Vibe-Trading): a value that cannot be
 * computed from the available data returns null with a reason rather than a
 * plausible-looking number. Every consumer must render nulls as "—".
 */

export type Candle = { time: number; open: number; high: number; low: number; close: number; volume: number };

export type SignalSet = {
  symbol: string;
  interval: string;
  candles: number;
  rsi14: number | null;
  ema20: number | null;
  ema50: number | null;
  trend: 'up' | 'down' | 'flat' | null;
  atrPct: number | null;
  bbPosition: number | null; // 0 = lower band, 1 = upper band
  macdHist: number | null;
  vwap: number | null;
  computedAt: string;
};

const MIN = (n: number, arr: unknown[]) => (Array.isArray(arr) && arr.length >= n ? true : false);

export function sma(values: number[], period: number): number | null {
  if (!MIN(period, values)) return null;
  const slice = values.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

export function emaSeries(values: number[], period: number): number[] | null {
  if (!MIN(period, values)) return null;
  const k = 2 / (period + 1);
  let prev = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  const out = [prev];
  for (let i = period; i < values.length; i += 1) {
    prev = values[i] * k + prev * (1 - k);
    out.push(prev);
  }
  return out;
}

export const ema = (values: number[], period: number): number | null => {
  const s = emaSeries(values, period);
  return s ? s[s.length - 1] : null;
};

/** Wilder-smoothed RSI. */
export function rsi(closes: number[], period = 14): number | null {
  if (!MIN(period + 1, closes)) return null;
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i += 1) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) gain += d; else loss -= d;
  }
  let avgGain = gain / period;
  let avgLoss = loss / period;
  for (let i = period + 1; i < closes.length; i += 1) {
    const d = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(d, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-d, 0)) / period;
  }
  if (avgLoss === 0) return avgGain === 0 ? null : 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export function macd(closes: number[]): { hist: number | null; line: number | null; signal: number | null } {
  const fast = emaSeries(closes, 12);
  const slow = emaSeries(closes, 26);
  if (!fast || !slow) return { hist: null, line: null, signal: null };
  const offset = fast.length - slow.length;
  const line = slow.map((s, i) => fast[i + offset] - s);
  const signal = emaSeries(line, 9);
  if (!signal) return { hist: null, line: line[line.length - 1] ?? null, signal: null };
  const sig = signal[signal.length - 1];
  const lin = line[line.length - 1];
  return { hist: lin - sig, line: lin, signal: sig };
}

export function bollinger(closes: number[], period = 20, mult = 2): { upper: number | null; lower: number | null; mid: number | null; position: number | null } {
  if (!MIN(period, closes)) return { upper: null, lower: null, mid: null, position: null };
  const slice = closes.slice(-period);
  const mid = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((a, b) => a + (b - mid) ** 2, 0) / period;
  const sd = Math.sqrt(variance);
  if (sd === 0) return { upper: mid, lower: mid, mid, position: null };
  const upper = mid + mult * sd;
  const lower = mid - mult * sd;
  const last = closes[closes.length - 1];
  return { upper, lower, mid, position: Math.min(1, Math.max(0, (last - lower) / (upper - lower))) };
}

/** Average True Range as a percentage of the last close. */
export function atrPct(candles: Candle[], period = 14): number | null {
  if (!MIN(period + 1, candles)) return null;
  let sum = 0;
  for (let i = candles.length - period; i < candles.length; i += 1) {
    const c = candles[i];
    const prevClose = candles[i - 1].close;
    const tr = Math.max(c.high - c.low, Math.abs(c.high - prevClose), Math.abs(c.low - prevClose));
    sum += tr;
  }
  const last = candles[candles.length - 1].close;
  if (last <= 0) return null;
  return (sum / period / last) * 100;
}

export function vwap(candles: Candle[]): number | null {
  if (!MIN(1, candles)) return null;
  let pv = 0;
  let vv = 0;
  for (const c of candles) {
    const typical = (c.high + c.low + c.close) / 3;
    pv += typical * c.volume;
    vv += c.volume;
  }
  return vv > 0 ? pv / vv : null;
}

export function computeSignals(symbol: string, interval: string, candles: Candle[]): SignalSet {
  const closes = candles.map((c) => c.close);
  const e20 = ema(closes, 20);
  const e50 = ema(closes, 50);
  const last = closes[closes.length - 1] ?? null;
  let trend: SignalSet['trend'] = null;
  if (e20 !== null && e50 !== null && last) {
    const gap = (e20 - e50) / last;
    trend = gap > 0.0015 ? 'up' : gap < -0.0015 ? 'down' : 'flat';
  }
  const bb = bollinger(closes);
  const m = macd(closes);
  return {
    symbol,
    interval,
    candles: candles.length,
    rsi14: rsi(closes, 14),
    ema20: e20,
    ema50: e50,
    trend,
    atrPct: atrPct(candles, 14),
    bbPosition: bb.position,
    macdHist: m.hist,
    vwap: vwap(candles),
    computedAt: new Date().toISOString(),
  };
}

/* ------------------------------- performance ------------------------------ */

export type PerformanceStats = {
  trades: number;
  wins: number;
  losses: number;
  winRate: number | null;
  netRealized: number;
  profitFactor: number | null; // null when there are no losing trades (undefined, not ∞)
  avgWin: number | null;
  avgLoss: number | null;
  maxDrawdown: number | null; // on the cumulative realized-PnL equity curve
  sharpeDaily: number | null; // annualised (√365) from per-trade returns; null when undefined
  equityCurve: number[];
};

/** Build honest performance statistics from a chronologically ordered list of realized PnL values. */
export function performanceStats(realizedPnlSeries: number[]): PerformanceStats {
  const series = realizedPnlSeries.filter((n) => Number.isFinite(n));
  const wins = series.filter((n) => n > 0);
  const losses = series.filter((n) => n < 0);
  const net = series.reduce((a, b) => a + b, 0);
  const grossWin = wins.reduce((a, b) => a + b, 0);
  const grossLoss = Math.abs(losses.reduce((a, b) => a + b, 0));

  let curve = 0;
  let peak = 0;
  let maxDd: number | null = null;
  const equityCurve: number[] = [];
  for (const pnl of series) {
    curve += pnl;
    equityCurve.push(curve);
    peak = Math.max(peak, curve);
    const dd = peak - curve;
    maxDd = maxDd === null ? dd : Math.max(maxDd, dd);
  }
  if (series.length === 0) maxDd = null;

  // Per-trade return on running equity for a Sharpe-like ratio.
  let sharpe: number | null = null;
  if (series.length >= 8) {
    const returns: number[] = [];
    let equity = 0;
    for (const pnl of series) {
      const base = Math.max(equity, 1);
      returns.push(pnl / base);
      equity += pnl;
    }
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / returns.length;
    const sd = Math.sqrt(variance);
    if (sd > 0) sharpe = (mean / sd) * Math.sqrt(365);
  }

  return {
    trades: series.length,
    wins: wins.length,
    losses: losses.length,
    winRate: series.length ? wins.length / series.length : null,
    netRealized: net,
    profitFactor: grossLoss > 0 ? grossWin / grossLoss : null,
    avgWin: wins.length ? grossWin / wins.length : null,
    avgLoss: losses.length ? -grossLoss / losses.length : null,
    maxDrawdown: maxDd,
    sharpeDaily: sharpe,
    equityCurve,
  };
}
