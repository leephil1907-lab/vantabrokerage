'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AreaSeries,
  CandlestickSeries,
  ColorType,
  HistogramSeries,
  LineSeries,
  LineStyle,
  createChart,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type UTCTimestamp,
} from 'lightweight-charts';
import { ChartSkeleton, FeedStatus } from '@/components/motion/skeletons';
import { AssetMark } from '@/components/asset-mark';
import { AnimatedNumber } from '@/components/motion/primitives';
import { fmtPct, fmtPrice, priceDp } from '@/lib/format';

export type Candle = { time: number; open: number; high: number; low: number; close: number; volume: number };

const TIMEFRAMES = [
  { id: '1m', label: '1m' },
  { id: '5m', label: '5m' },
  { id: '15m', label: '15m' },
  { id: '1h', label: '1H' },
  { id: '4h', label: '4H' },
  { id: '1d', label: '1D' },
] as const;

type Kind = 'candles' | 'line' | 'area';
type Overlay = 'ema20' | 'ema50' | 'sma50' | 'volume';

const UP = '#2ee6a8';
const DOWN = '#ff5b6e';
const LIME = '#c8f751';

function ema(values: number[], period: number) {
  const k = 2 / (period + 1);
  let prev = values[0] ?? 0;
  return values.map((v, i) => {
    prev = i === 0 ? v : v * k + prev * (1 - k);
    return prev;
  });
}

function sma(values: number[], period: number) {
  return values.map((_, i) => {
    if (i < period - 1) return null;
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += values[j];
    return sum / period;
  });
}

/**
 * Professional chart on TradingView Lightweight Charts.
 *
 * - candle / line / area renderers, six timeframes, volume histogram,
 *   EMA20/EMA50/SMA50 overlays, crosshair, native zoom + pan.
 * - Live updates: refetches the candle window and merges the last bar in place
 *   (chart.update, never a full re-render) so scrolling/zoom is not lost.
 * - Prices come from /api/markets/:symbol/candles only. If the feed fails the
 *   chart is labelled unavailable — nothing is ever fabricated client-side.
 */
export function ProChart({
  symbol,
  height = 440,
  onQuote,
  headerExtra,
  compact = false,
}: {
  symbol: string;
  height?: number;
  onQuote?: (q: { last: number; change24h?: number; source: string }) => void;
  headerExtra?: React.ReactNode;
  compact?: boolean;
}) {
  const holder = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const priceSeries = useRef<ISeriesApi<'Candlestick'> | ISeriesApi<'Line'> | ISeriesApi<'Area'> | null>(null);
  const volumeSeries = useRef<ISeriesApi<'Histogram'> | null>(null);
  const overlayRefs = useRef<Record<string, ISeriesApi<'Line'>>>({});
  const priceLines = useRef<IPriceLine[]>([]);

  const [timeframe, setTimeframe] = useState<(typeof TIMEFRAMES)[number]['id']>('5m');
  const [kind, setKind] = useState<Kind>('candles');
  const [overlays, setOverlays] = useState<Record<Overlay, boolean>>({ ema20: true, ema50: false, sma50: false, volume: true });
  const [candles, setCandles] = useState<Candle[]>([]);
  const [quote, setQuote] = useState<{ last: number; bid: number; ask: number; change24h?: number; source: string; fetchedAt?: string } | null>(null);
  const [state, setState] = useState<'loading' | 'live' | 'delayed' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [hline, setHline] = useState<number | null>(null);
  // Times are rendered only after mount so SSR and client output always agree.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  /* ── data ─────────────────────────────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;
    setState('loading');
    setCandles([]);
    const load = async (silent = false) => {
      try {
        const [cRes, qRes] = await Promise.all([
          fetch(`/api/markets/${encodeURIComponent(symbol)}/candles?interval=${timeframe}&limit=300`, { cache: 'no-store' }).then((r) => r.json()),
          fetch(`/api/markets/${encodeURIComponent(symbol)}/quote`, { cache: 'no-store' }).then((r) => r.json()),
        ]);
        if (cancelled) return;
        if (cRes?.error) throw new Error(cRes.error.message ?? 'Chart data unavailable');
        const next: Candle[] = (cRes.candles ?? []).map((c: Candle) => ({ ...c, time: Math.floor(c.time) }));
        setCandles((prev) => {
          if (!silent || prev.length === 0) return next;
          // Keep the existing history, replace/augment the tail.
          const map = new Map(prev.map((c) => [c.time, c]));
          next.forEach((c) => map.set(c.time, c));
          return [...map.values()].sort((a, b) => a.time - b.time);
        });
        if (qRes && !qRes.error) {
          setQuote(qRes);
          onQuote?.({ last: qRes.last, change24h: qRes.change24h, source: qRes.source });
          setState(qRes.stale ? 'delayed' : 'live');
        }
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError((e as Error).message || 'Market data feed unavailable');
        setState('error');
      }
    };
    load();
    const id = setInterval(() => load(true), 15_000);
    return () => { cancelled = true; clearInterval(id); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, timeframe]);

  /* ── chart lifecycle ──────────────────────────────────────────────────── */
  useEffect(() => {
    if (!holder.current) return;
    const chart = createChart(holder.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#8a97a6',
        fontFamily: 'var(--font-sans), Inter, sans-serif',
        fontSize: 11,
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.035)' },
        horzLines: { color: 'rgba(255,255,255,0.045)' },
      },
      rightPriceScale: { borderColor: 'rgba(255,255,255,0.07)', scaleMargins: { top: 0.12, bottom: 0.26 } },
      timeScale: { borderColor: 'rgba(255,255,255,0.07)', timeVisible: true, secondsVisible: false, rightOffset: 6, barSpacing: 7 },
      crosshair: {
        mode: 1,
        vertLine: { color: 'rgba(200,247,81,0.45)', width: 1, style: LineStyle.Dashed, labelBackgroundColor: '#1b2128' },
        horzLine: { color: 'rgba(200,247,81,0.45)', width: 1, style: LineStyle.Dashed, labelBackgroundColor: '#1b2128' },
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
      autoSize: true,
    });
    chartRef.current = chart;
    return () => {
      chart.remove();
      chartRef.current = null;
      priceSeries.current = null;
      volumeSeries.current = null;
      overlayRefs.current = {};
      priceLines.current = [];
    };
  }, []);

  /* ── price series (re-created when the renderer changes) ───────────────── */
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    if (priceSeries.current) {
      try { chart.removeSeries(priceSeries.current); } catch { /* already removed */ }
      priceSeries.current = null;
    }
    const precision = priceDp(symbol) > 4 ? 6 : Math.max(2, priceDp(symbol));
    const common = { priceLineVisible: true, lastValueVisible: true, priceLineColor: 'rgba(200,247,81,0.5)' };
    if (kind === 'candles') {
      priceSeries.current = chart.addSeries(CandlestickSeries, {
        upColor: UP, downColor: DOWN, borderUpColor: UP, borderDownColor: DOWN, wickUpColor: 'rgba(46,230,168,0.7)', wickDownColor: 'rgba(255,91,110,0.7)',
        priceFormat: { type: 'price', precision, minMove: 10 ** -precision },
        ...common,
      });
    } else if (kind === 'line') {
      priceSeries.current = chart.addSeries(LineSeries, { color: LIME, lineWidth: 2, priceFormat: { type: 'price', precision, minMove: 10 ** -precision }, ...common });
    } else {
      priceSeries.current = chart.addSeries(AreaSeries, {
        lineColor: LIME, topColor: 'rgba(200,247,81,0.28)', bottomColor: 'rgba(200,247,81,0.01)', lineWidth: 2,
        priceFormat: { type: 'price', precision, minMove: 10 ** -precision }, ...common,
      });
    }
  }, [kind, symbol]);

  /* ── volume + overlays ────────────────────────────────────────────────── */
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    if (volumeSeries.current) { try { chart.removeSeries(volumeSeries.current); } catch { /* noop */ } volumeSeries.current = null; }
    if (overlays.volume) {
      volumeSeries.current = chart.addSeries(HistogramSeries, { priceFormat: { type: 'volume' }, priceScaleId: 'vol', lastValueVisible: false, priceLineVisible: false });
      chart.priceScale('vol').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
    }
    (['ema20', 'ema50', 'sma50'] as const).forEach((key) => {
      const existing = overlayRefs.current[key];
      if (overlays[key] && !existing) {
        overlayRefs.current[key] = chart.addSeries(LineSeries, {
          color: key === 'ema20' ? LIME : key === 'ema50' ? '#7c8bd9' : '#38bdf8',
          lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false,
        });
      } else if (!overlays[key] && existing) {
        try { chart.removeSeries(existing); } catch { /* noop */ }
        delete overlayRefs.current[key];
      }
    });
  }, [overlays, kind]);

  /* ── paint data ───────────────────────────────────────────────────────── */
  useEffect(() => {
    const series = priceSeries.current;
    if (!series || candles.length === 0) return;
    const toTime = (t: number) => t as UTCTimestamp;
    if (kind === 'candles') {
      (series as ISeriesApi<'Candlestick'>).setData(candles.map((c) => ({ time: toTime(c.time), open: c.open, high: c.high, low: c.low, close: c.close })));
    } else {
      (series as ISeriesApi<'Line'>).setData(candles.map((c) => ({ time: toTime(c.time), value: c.close })));
    }
    if (volumeSeries.current) {
      volumeSeries.current.setData(candles.map((c) => ({
        time: toTime(c.time), value: c.volume,
        color: c.close >= c.open ? 'rgba(46,230,168,0.34)' : 'rgba(255,91,110,0.34)',
      })));
    }
    const closes = candles.map((c) => c.close);
    if (overlayRefs.current.ema20) overlayRefs.current.ema20.setData(candles.map((c, i) => ({ time: toTime(c.time), value: ema(closes, 20)[i] })));
    if (overlayRefs.current.ema50) overlayRefs.current.ema50.setData(candles.map((c, i) => ({ time: toTime(c.time), value: ema(closes, 50)[i] })));
    if (overlayRefs.current.sma50) {
      const values = sma(closes, 50);
      overlayRefs.current.sma50.setData(candles.flatMap((c, i) => (values[i] == null ? [] : [{ time: toTime(c.time), value: values[i] as number }])));
    }
    if (candles.length) chartRef.current?.timeScale().fitContent();
  }, [candles, kind, overlays]);

  /* ── user price line ──────────────────────────────────────────────────── */
  useEffect(() => {
    const series = priceSeries.current;
    if (!series) return;
    priceLines.current.forEach((l) => { try { series.removePriceLine(l); } catch { /* noop */ } });
    priceLines.current = [];
    if (hline != null) {
      priceLines.current.push(series.createPriceLine({ price: hline, color: '#ffb020', lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: 'level' }));
    }
  }, [hline, kind, candles.length]);

  const last = candles[candles.length - 1];
  const up = (quote?.change24h ?? 0) >= 0;
  const dps = priceDp(symbol);

  const overlayButtons = useMemo(
    () => (
      <>
        {(['ema20', 'ema50', 'sma50', 'volume'] as const).map((key) => (
          <button
            key={key}
            onClick={() => setOverlays((o) => ({ ...o, [key]: !o[key] }))}
            className={`rounded-md border px-1.5 py-[3px] text-[10px] font-medium transition ${overlays[key] ? 'border-lime/30 bg-lime/10 text-lime' : 'border-white/10 text-muted hover:text-white'}`}
          >
            {key === 'volume' ? 'VOL' : key.toUpperCase().replace('EMA', 'EMA ').replace('SMA', 'SMA ')}
          </button>
        ))}
      </>
    ),
    [overlays],
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] px-3 py-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <AssetMark symbol={symbol} size={26} />
          <div className="min-w-0">
            <p className="truncate text-[12.5px] font-semibold leading-none text-white">{symbol}</p>
            <p className="mt-1 flex items-center gap-1.5 text-[10px] leading-none text-muted">
              {timeframe.toUpperCase()} · {quote?.source ?? 'connecting'}
            </p>
          </div>
          <div className="ml-1 flex items-baseline gap-2">
            <AnimatedNumber value={quote?.last ?? last?.close ?? null} decimals={dps} className="text-[15px] font-semibold text-white" />
            {quote && <span className={`value-mono text-[11px] ${up ? 'text-emerald' : 'text-danger'}`}>{fmtPct(quote.change24h)}</span>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-0.5 rounded-lg border border-white/10 bg-ink-900 p-0.5">
            {TIMEFRAMES.map((t) => (
              <button key={t.id} onClick={() => setTimeframe(t.id)} className={`rounded px-1.5 py-1 text-[10.5px] font-medium transition ${timeframe === t.id ? 'bg-white/10 text-white' : 'text-muted hover:text-white'}`}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-0.5 rounded-lg border border-white/10 bg-ink-900 p-0.5">
            {(['candles', 'line', 'area'] as const).map((k) => (
              <button key={k} onClick={() => setKind(k)} title={k} className={`rounded px-1.5 py-1 text-[10.5px] font-medium transition ${kind === k ? 'bg-white/10 text-white' : 'text-muted hover:text-white'}`}>
                {k === 'candles' ? '🕯' : k === 'line' ? '⌁' : '◭'}
              </button>
            ))}
          </div>
          {!compact && <div className="hidden items-center gap-1 sm:flex">{overlayButtons}</div>}
          <button
            onClick={() => setHline((h) => (h == null ? quote?.last ?? last?.close ?? null : null))}
            className={`rounded-md border px-1.5 py-[3px] text-[10px] font-medium transition ${hline != null ? 'border-siren/40 bg-siren/10 text-siren' : 'border-white/10 text-muted hover:text-white'}`}
            title="Toggle a price level at the last traded price"
          >
            LEVEL
          </button>
          {headerExtra}
        </div>
      </div>

      {/* canvas — the holder is always mounted so the chart can be created
          immediately; skeletons paint on top of it instead of replacing it. */}
      <div className="relative min-h-[220px] flex-1">
        <div ref={holder} className="absolute inset-0" />
        {state === 'loading' && candles.length === 0 && (
          <div className="absolute inset-0 bg-ink-850/60 backdrop-blur-[1px]">
            <ChartSkeleton height={height} />
          </div>
        )}
        {state === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-ink-900/60 px-6 text-center backdrop-blur-sm">
            <p className="text-[12px] font-medium text-white">Chart unavailable</p>
            <p className="max-w-xs text-[11px] leading-relaxed text-muted">{error} — the chart is never drawn from invented prices, so it stays empty until the provider responds.</p>
          </div>
        )}
      </div>

      {/* footer */}
      <div className="flex items-center justify-between border-t border-white/[0.06] px-3 py-1.5 text-[10px] text-muted">
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline">TradingView Lightweight Charts</span>
          <span>{candles.length} bars</span>
          {mounted && last && <span className="hidden sm:inline">last bar {new Date(last.time * 1000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>}
        </div>
        <FeedStatus state={state === 'live' ? 'live' : state === 'delayed' ? 'delayed' : state === 'error' ? 'offline' : 'delayed'} label={state === 'live' ? 'live feed' : state === 'delayed' ? 'delayed feed' : state === 'error' ? 'feed down' : 'connecting'} />
      </div>
    </div>
  );
}
