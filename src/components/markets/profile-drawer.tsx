'use client';
import { useEffect, useState } from 'react';
import { Badge, Skeleton, apiFetch } from '@/components/ui';
import { NewsFeed } from '@/components/markets/news-feed';
import { fmtPct } from '@/lib/format';

type Profile = {
  country?: string; currency?: string; exchange?: string; finnhubIndustry?: string;
  ipo?: string; logo?: string; marketCapitalization?: number; name?: string;
  shareOutstanding?: number; ticker?: string; weburl?: string;
};
type Quote = { c?: number; d?: number; dp?: number; h?: number; l?: number; pc?: number };
type ProfileResponse = { provider: 'finnhub' | 'none'; ticker: string; profile: Profile | null; quote: Quote | null; message?: string };

export type ProfileTarget = { symbol: string; ticker: string };

const compactM = (millions: number | undefined, suffix = '') => {
  if (millions == null || !isFinite(millions)) return '—';
  const v = millions * 1e6;
  if (v >= 1e12) return `${(v / 1e12).toFixed(2)}T${suffix}`;
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B${suffix}`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M${suffix}`;
  return `${Math.round(v).toLocaleString()}${suffix}`;
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2">
      <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-0.5 truncate text-[12px] font-medium text-white" title={value}>{value}</p>
    </div>
  );
}

/** Slide-over with the Finnhub company profile + company news for a screener row. */
export function ProfileDrawer({ target, onClose }: { target: ProfileTarget | null; onClose: () => void }) {
  const [data, setData] = useState<ProfileResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!target) return;
    let cancelled = false;
    setData(null); setError(null);
    apiFetch<ProfileResponse>(`/api/markets/profile?symbol=${encodeURIComponent(target.symbol)}`)
      .then((res) => { if (!cancelled) setData(res); })
      .catch((e) => { if (!cancelled) setError((e as Error).message); });
    return () => { cancelled = true; };
  }, [target]);

  useEffect(() => {
    if (!target) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [target, onClose]);

  if (!target) return null;
  const p = data?.profile ?? null;
  const q = data?.quote ?? null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={`${target.ticker} company profile`}>
      <button type="button" aria-label="Close profile" onClick={onClose} className="absolute inset-0 bg-ink-950/70 backdrop-blur-[2px]" />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-[440px] flex-col overflow-y-auto border-l border-white/[0.08] bg-ink-900 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-white/[0.07] bg-ink-900/95 px-5 py-4 backdrop-blur">
          <div className="flex items-center gap-3">
            {p?.logo ? (
              // Company logos are external hotlinks; fall back to the ticker monogram when blocked.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.logo} alt="" className="h-10 w-10 rounded-lg border border-white/10 bg-white object-contain p-0.5" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] font-mono text-[12px] font-bold text-lime">{target.ticker.slice(0, 4)}</span>
            )}
            <div>
              <p className="text-[14.5px] font-semibold leading-tight text-white">{p?.name ?? target.ticker}</p>
              <p className="mt-0.5 flex items-center gap-1.5 font-mono text-[10.5px] text-muted">
                {target.symbol}
                {q?.dp != null && <span className={q.dp >= 0 ? 'text-emerald' : 'text-danger'}>{fmtPct(q.dp)}</span>}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] text-muted transition hover:text-white" aria-label="Close">✕</button>
        </div>

        <div className="space-y-4 px-5 py-4">
          {data?.provider === 'finnhub' && (
            <Badge tone="lime">Finnhub live</Badge>
          )}
          {error && <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-[11.5px] text-danger">{error}</p>}
          {!data && !error && <Skeleton className="h-40" />}
          {data?.provider === 'none' && (
            <p className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-[11.5px] leading-relaxed text-muted">{data.message}</p>
          )}
          {data && data.provider === 'finnhub' && !p && (
            <p className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-[11.5px] leading-relaxed text-muted">{data.message ?? 'No company profile is available for this listing.'}</p>
          )}

          {p && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <Stat label="Industry" value={p.finnhubIndustry ?? p.exchange ?? '—'} />
                <Stat label="Country" value={p.country ?? '—'} />
                <Stat label="Market cap" value={compactM(p.marketCapitalization)} />
                <Stat label="Shares out" value={compactM(p.shareOutstanding)} />
                <Stat label="IPO date" value={p.ipo ?? '—'} />
                <Stat label="Currency" value={p.currency ?? '—'} />
              </div>
              {q?.c != null && (
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
                  <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-muted">Last Finnhub quote (reference)</p>
                  <p className="mt-1 font-mono text-[18px] font-semibold text-white">
                    ${q.c.toFixed(2)}
                    {q.dp != null && <span className={`ml-2 text-[12.5px] ${q.dp >= 0 ? 'text-emerald' : 'text-danger'}`}>{fmtPct(q.dp)}</span>}
                  </p>
                  {q.h != null && q.l != null && <p className="mt-0.5 font-mono text-[10.5px] text-muted">Day range {q.l.toFixed(2)} – {q.h.toFixed(2)}{q.pc != null ? ` · prev close ${q.pc.toFixed(2)}` : ''}</p>}
                </div>
              )}
              {p.weburl && (
                <a href={p.weburl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-lime hover:underline">
                  {p.weburl.replace(/^https?:\/\//, '').replace(/\/$/, '')} ↗
                </a>
              )}
              <NewsFeed symbol={target.ticker} title="Company news" />
            </>
          )}

          <p className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-[10.5px] leading-relaxed text-muted">
            Reference profile from Finnhub for discovery only. PRIMEVEST currently trades forex, crypto, index and commodity CFDs — single-stock trading is not offered, and nothing here is a PRIMEVEST quote or investment advice.
          </p>
        </div>
      </aside>
    </div>
  );
}
