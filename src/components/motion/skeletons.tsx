import { PrimevestGlyph } from '../brand';

/** Chart placeholder that mimics the real chart frame while candles load. */
export function ChartSkeleton({ height = 320 }: { height?: number }) {
  return (
    <div className="flex flex-col" style={{ minHeight: height }}>
      <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="skeleton h-7 w-7 rounded-lg" />
          <div className="space-y-1.5">
            <div className="skeleton h-2.5 w-20" />
            <div className="skeleton h-2 w-14" />
          </div>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-5 w-7" />)}
        </div>
      </div>
      <div className="relative flex-1 overflow-hidden" style={{ height }}>
        <svg viewBox="0 0 600 260" className="h-full w-full" aria-hidden>
          {[0.2, 0.4, 0.6, 0.8].map((r) => (
            <line key={r} x1="0" x2="600" y1={260 * r} y2={260 * r} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 6" />
          ))}
          {Array.from({ length: 26 }).map((_, i) => {
            const x = 12 + i * 22;
            const height = 18 + ((i * 37) % 62);
            const y = 60 + ((i * 53) % 110);
            return <rect key={i} x={x} y={y} width="9" height={height} rx="1.5" fill="rgba(255,255,255,0.055)" />;
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-ink-950/70 px-3 py-1.5 backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime/60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-lime" />
            </span>
            <span className="text-[11px] text-muted">Streaming candles…</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Generic list skeleton. */
export function SkeletonRows({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="panel overflow-hidden">
      <div className="border-b border-white/[0.06] px-4 py-3">
        <div className="skeleton-shimmer h-3 w-32" />
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 border-b border-white/[0.04] px-4 py-3.5 last:border-0">
          <div className="skeleton h-7 w-7 rounded-lg" />
          <div className="skeleton h-3 w-24" />
          <div className="ml-auto flex gap-4">
            {Array.from({ length: cols }).map((_, c) => <div key={c} className="skeleton h-3 w-16" />)}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Table skeleton that matches the real `<table>` grid. */
export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.07]">
      <div className="flex gap-4 border-b border-white/[0.06] bg-white/[0.02] px-4 py-3">
        {Array.from({ length: cols }).map((_, c) => <div key={c} className="skeleton h-2.5 flex-1" />)}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 border-b border-white/[0.04] px-4 py-3.5 last:border-0">
          <div className="skeleton h-6 w-6 rounded-full" />
          <div className="skeleton h-3 w-20" />
          <div className="ml-auto flex gap-4">
            {Array.from({ length: cols - 2 }).map((_, c) => <div key={c} className="skeleton h-3 w-14" />)}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Branded interstitial used inside panels while a feed reconnects. */
export function FeedStatus({ state, label }: { state: 'live' | 'delayed' | 'offline'; label?: string }) {
  const map = {
    live: { dot: 'bg-emerald', text: 'Live', tone: 'text-white' },
    delayed: { dot: 'bg-siren', text: 'Delayed feed', tone: 'text-siren' },
    offline: { dot: 'bg-danger', text: 'Feed unavailable', tone: 'text-danger' },
  } as const;
  const s = map[state];
  return (
    <span className="inline-flex items-center gap-1.5 text-[10.5px] font-medium">
      <span className={`relative flex h-1.5 w-1.5 ${s.tone}`}>
        {state === 'live' && <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${s.dot} opacity-60`} />}
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${s.dot}`} />
      </span>
      <span className={s.tone}>{label ?? s.text}</span>
    </span>
  );
}

export function LogoPulse() {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="brand-pulse"><PrimevestGlyph size={18} /></span>
      <span className="skeleton-shimmer h-2.5 w-16" />
    </span>
  );
}
