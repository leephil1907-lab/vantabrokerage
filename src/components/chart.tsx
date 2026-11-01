'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { fmtPrice, fmtPct } from '@/lib/format';

export type Candle = { time: number; open: number; high: number; low: number; close: number; volume: number };

const INTERVALS = [
  { id: '1m', label: '1m' },
  { id: '5m', label: '5m' },
  { id: '15m', label: '15m' },
  { id: '1h', label: '1H' },
  { id: '4h', label: '4H' },
  { id: '1d', label: '1D' },
] as const;

function ema(values: number[], period: number) {
  const k = 2 / (period + 1);
  const out: number[] = [];
  let prev = values[0] ?? 0;
  values.forEach((v, i) => {
    prev = i === 0 ? v : v * k + prev * (1 - k);
    out.push(prev);
  });
  return out;
}

function sma(values: number[], period: number) {
  return values.map((_, i) => {
    if (i < period - 1) return NaN;
    let s = 0;
    for (let j = i - period + 1; j <= i; j++) s += values[j];
    return s / period;
  });
}

export function ChartPanel({
  symbol,
  pricePrecision = 2,
  height = 380,
  onQuote,
  showVolume = true,
  headerRight,
}: {
  symbol: string;
  pricePrecision?: number;
  height?: number;
  onQuote?: (q: { last: number; change24h?: number; source: string }) => void;
  showVolume?: boolean;
  headerRight?: React.ReactNode;
}) {
  const [interval, setIntervalId] = useState<(typeof INTERVALS)[number]['id']>('5m');
  const [candles, setCandles] = useState<Candle[]>([]);
  const [quote, setQuote] = useState<{ last: number; bid: number; ask: number; change24h?: number; source: string; fetchedAt: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [indicators, setIndicators] = useState<{ ema: boolean; sma: boolean }>({ ema: true, sma: false });
  const [hover, setHover] = useState<{ x: number; y: number; candle: Candle | null } | null>(null);
  const [tool, setTool] = useState<'none' | 'hline' | 'trend'>('none');
  const [drawings, setDrawings] = useState<{ type: 'hline'; price: number }[]>([]);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setDrawings([]);
    const load = async () => {
      try {
        const [c, q] = await Promise.all([
          fetch(`/api/markets/${encodeURIComponent(symbol)}/candles?interval=${interval}&limit=220`).then((r) => r.json()),
          fetch(`/api/markets/${encodeURIComponent(symbol)}/quote`).then((r) => r.json()),
        ]);
        if (cancelled) return;
        if (c.error) throw new Error(c.error.message);
        setCandles(c.candles ?? []);
        if (q && !q.error) {
          setQuote(q);
          onQuote?.({ last: q.last, change24h: q.change24h, source: q.source });
        }
        setError(null);
      } catch (e) {
        if (!cancelled) setError((e as Error).message || 'Unable to load chart data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const id = globalThis.setInterval(load, 20_000);
    return () => { cancelled = true; globalThis.clearInterval(id); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, interval]);

  const W = 900, H = height;
  const padL = 8, padR = 62, padT = 14, padB = showVolume ? 52 : 24;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const geo = useMemo(() => {
    if (!candles.length) return null;
    const lo = Math.min(...candles.map((c) => c.low));
    const hi = Math.max(...candles.map((c) => c.high));
    const range = hi - lo || hi * 0.001 || 1;
    const bw = plotW / candles.length;
    const y = (v: number) => padT + (1 - (v - lo) / range) * plotH;
    const maxVol = Math.max(...candles.map((c) => c.volume || 0), 1);
    const closes = candles.map((c) => c.close);
    return {
      lo, hi, range, bw, y,
      ema20: ema(closes, 20),
      ema50: ema(closes, 50),
      sma50: sma(closes, 50),
      maxVol,
      gridPrices: [0, 0.25, 0.5, 0.75, 1].map((f) => lo + range * f),
    };
  }, [candles, plotW, plotH]);

  const last = candles[candles.length - 1];
  const up = (quote?.change24h ?? 0) >= 0;

  function handleMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!geo || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const yPos = ((e.clientY - rect.top) / rect.height) * H;
    const idx = Math.min(candles.length - 1, Math.max(0, Math.floor((x - padL) / geo.bw)));
    setHover({ x, y: yPos, candle: candles[idx] ?? null });
  }

  function handleClick() {
    if (!geo || tool === 'none' || !hover) return;
    const priceRaw = geo.lo + (1 - (hover.y - padT) / plotH) * geo.range;
    if (tool === 'hline') setDrawings((d) => [...d, { type: 'hline', price: priceRaw }]);
    if (tool === 'trend') setTool('none');
  }

  return (
    <div className="panel flex flex-col overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-lime/15 text-[10px] font-bold text-lime">{symbol.slice(0, 3)}</span>
          <div>
            <p className="text-[12.5px] font-semibold leading-none text-white">{symbol}</p>
            <p className="mt-1 text-[10px] leading-none text-muted">{quote?.source ?? 'provider'} · {interval}</p>
          </div>
          {quote && (
            <div className="ml-2 flex items-baseline gap-2">
              <span className="value-mono text-[15px] font-semibold text-white">{fmtPrice(quote.last, pricePrecision)}</span>
              <span className={`value-mono text-[11px] ${up ? 'text-emerald' : 'text-danger'}`}>{fmtPct(quote.change24h)}</span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-0.5 rounded-lg border border-white/10 bg-ink-900 p-0.5">
            {INTERVALS.map((i) => (
              <button
                key={i.id}
                onClick={() => setIntervalId(i.id)}
                className={`rounded-md px-2 py-1 text-[11px] font-medium transition ${interval === i.id ? 'bg-white/10 text-white' : 'text-muted hover:text-white'}`}
              >
                {i.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setIndicators((v) => ({ ...v, ema: !v.ema }))}
            className={`rounded-md border px-2 py-1 text-[11px] font-medium ${indicators.ema ? 'border-lime/30 bg-lime/10 text-lime' : 'border-white/10 text-muted'}`}
            title="EMA 20 / 50"
          >
            EMA
          </button>
          <button
            onClick={() => setIndicators((v) => ({ ...v, sma: !v.sma }))}
            className={`rounded-md border px-2 py-1 text-[11px] font-medium ${indicators.sma ? 'border-sky-400/30 bg-sky-400/10 text-sky-300' : 'border-white/10 text-muted'}`}
            title="SMA 50"
          >
            SMA
          </button>
          <button
            onClick={() => { setTool(tool === 'hline' ? 'none' : 'hline'); }}
            className={`rounded-md border px-2 py-1 text-[11px] font-medium ${tool === 'hline' ? 'border-lime/30 bg-lime/10 text-lime' : 'border-white/10 text-muted'}`}
            title="Draw horizontal line — click a price level"
          >
            H-line
          </button>
          <button onClick={() => setDrawings([])} className="rounded-md border border-white/10 px-2 py-1 text-[11px] text-muted hover:text-white" title="Clear drawings">
            Clear
          </button>
          {headerRight}
        </div>
      </div>

      <div className="relative">
        {loading && !candles.length ? (
          <div className="flex items-center justify-center" style={{ height }}>
            <div className="flex flex-col items-center gap-2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/15 border-t-lime" />
              <p className="text-[11px] text-muted">Loading {symbol} chart…</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-2 px-6 text-center" style={{ height }}>
            <p className="text-[12px] font-medium text-white">Chart unavailable</p>
            <p className="max-w-xs text-[11px] leading-relaxed text-muted">{error}</p>
          </div>
        ) : (
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className={`w-full ${tool === 'hline' ? 'cursor-crosshair' : 'cursor-default'}`}
            style={{ height }}
            onMouseMove={handleMove}
            onMouseLeave={() => setHover(null)}
            onClick={handleClick}
          >
            {geo?.gridPrices.map((p) => (
              <g key={p}>
                <line x1={padL} x2={padL + plotW} y1={geo.y(p)} y2={geo.y(p)} stroke="rgba(255,255,255,0.045)" strokeDasharray="2 5" />
                <text x={padL + plotW + 6} y={geo.y(p) + 3} fill="#8a97a6" fontSize="9" fontFamily="ui-monospace, monospace">{fmtPrice(p, pricePrecision)}</text>
              </g>
            ))}

            {candles.map((c, i) => {
              const cx = padL + i * geo!.bw + geo!.bw / 2;
              const isUp = c.close >= c.open;
              const bodyTop = geo!.y(Math.max(c.open, c.close));
              const bodyH = Math.max(1, Math.abs(geo!.y(c.open) - geo!.y(c.close)));
              const bw = Math.max(1.4, geo!.bw * 0.62);
              return (
                <g key={c.time}>
                  <line x1={cx} x2={cx} y1={geo!.y(c.high)} y2={geo!.y(c.low)} stroke={isUp ? '#2ee6a8' : '#ff5b6e'} strokeWidth="1" opacity="0.75" />
                  <rect x={cx - bw / 2} y={bodyTop} width={bw} height={bodyH} rx="0.5" fill={isUp ? '#2ee6a8' : '#ff5b6e'} opacity="0.92" />
                  {showVolume && (
                    <rect
                      x={cx - bw / 2}
                      y={H - 18 - ((c.volume || 0) / geo!.maxVol) * 26}
                      width={bw}
                      height={Math.max(0.6, ((c.volume || 0) / geo!.maxVol) * 26)}
                      fill={isUp ? 'rgba(46,230,168,0.35)' : 'rgba(255,91,110,0.35)'}
                    />
                  )}
                </g>
              );
            })}

            {indicators.ema && (
              <>
                <polyline points={geo!.ema20.map((v, i) => `${padL + i * geo!.bw + geo!.bw / 2},${geo!.y(v)}`).join(' ')} fill="none" stroke="#dfc088" strokeWidth="1.1" opacity="0.85" />
                <polyline points={geo!.ema50.map((v, i) => `${padL + i * geo!.bw + geo!.bw / 2},${geo!.y(v)}`).join(' ')} fill="none" stroke="#7c8bd9" strokeWidth="1.1" opacity="0.75" />
              </>
            )}
            {indicators.sma && (
              <polyline
                points={geo!.sma50.map((v, i) => (isNaN(v) ? '' : `${padL + i * geo!.bw + geo!.bw / 2},${geo!.y(v)}`)).join(' ')}
                fill="none" stroke="#38bdf8" strokeWidth="1.1" opacity="0.8"
              />
            )}

            {drawings.map((d, i) => (
              <g key={i}>
                <line x1={padL} x2={padL + plotW} y1={geo!.y(d.price)} y2={geo!.y(d.price)} stroke="#ffb020" strokeWidth="1" strokeDasharray="5 4" />
                <text x={padL + 4} y={geo!.y(d.price) - 4} fill="#ffb020" fontSize="9" fontFamily="ui-monospace, monospace">{fmtPrice(d.price, pricePrecision)}</text>
              </g>
            ))}

            {last && (
              <g>
                <line x1={padL} x2={padL + plotW} y1={geo!.y(last.close)} y2={geo!.y(last.close)} stroke={up ? '#2ee6a8' : '#ff5b6e'} strokeWidth="0.8" strokeDasharray="3 3" opacity="0.7" />
                <rect x={padL + plotW + 1} y={geo!.y(last.close) - 7} width={padR - 4} height={14} rx="3" fill={up ? '#2ee6a8' : '#ff5b6e'} />
                <text x={padL + plotW + 5} y={geo!.y(last.close) + 3.5} fill="#08090b" fontSize="9" fontWeight="700" fontFamily="ui-monospace, monospace">{fmtPrice(last.close, pricePrecision)}</text>
              </g>
            )}

            {hover?.candle && (
              <line x1={hover.x} x2={hover.x} y1={padT} y2={padT + plotH} stroke="rgba(255,255,255,0.18)" strokeWidth="0.8" />
            )}
          </svg>
        )}
        {hover?.candle && !error && (
          <div className="pointer-events-none absolute left-3 top-2 flex flex-wrap gap-x-3 gap-y-0.5 rounded-lg border border-white/10 bg-ink-950/90 px-2.5 py-1.5 text-[10px] text-muted backdrop-blur">
            <span>O <span className="value-mono text-white">{fmtPrice(hover.candle.open, pricePrecision)}</span></span>
            <span>H <span className="value-mono text-white">{fmtPrice(hover.candle.high, pricePrecision)}</span></span>
            <span>L <span className="value-mono text-white">{fmtPrice(hover.candle.low, pricePrecision)}</span></span>
            <span>C <span className="value-mono text-white">{fmtPrice(hover.candle.close, pricePrecision)}</span></span>
            <span>V <span className="value-mono text-white">{hover.candle.volume.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span></span>
            <span>{new Date(hover.candle.time * 1000).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between border-t border-white/[0.07] px-3 py-2 text-[10px] text-muted">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><span className="h-1.5 w-3 rounded-full bg-lime" />EMA 20</span>
          <span className="flex items-center gap-1"><span className="h-1.5 w-3 rounded-full bg-[#7c8bd9]" />EMA 50</span>
          <span className="hidden sm:inline">{candles.length} candles · server-timestamped</span>
        </div>
        <span className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${error ? 'bg-danger' : 'animate-pulse bg-emerald'}`} />
          {error ? 'disconnected' : 'live'}
        </span>
      </div>
    </div>
  );
}
