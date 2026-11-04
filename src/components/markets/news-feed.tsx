'use client';
import { MarketBrief } from '@/components/markets/market-brief';
import { useEffect, useState } from 'react';
import { Badge, Skeleton, apiFetch } from '@/components/ui';
import { relTime } from '@/lib/format';

type NewsItem = { id: string; headline: string; summary: string; source: string; url: string; publishedAt: string; symbol?: string };
type NewsResponse = { provider: 'finnhub' | 'none'; items: NewsItem[]; message?: string };

export function NewsFeed({ symbol, category = 'general', title = 'Market news' }: { symbol?: string; category?: 'general' | 'forex' | 'crypto' | 'merger'; title?: string }) {
  const [data, setData] = useState<NewsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await apiFetch<NewsResponse>(`/api/news${symbol ? `?symbol=${encodeURIComponent(symbol)}` : `?category=${category}`}`);
        if (!cancelled) { setData(res); setError(null); }
      } catch (e) { if (!cancelled) setError((e as Error).message); }
    };
    void load();
    const t = setInterval(load, 5 * 60_000);
    return () => { cancelled = true; clearInterval(t); };
  }, [symbol, category]);

  return (
    <section className="panel p-4 sm:p-5" aria-labelledby="news-title">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div><h2 id="news-title" className="text-[15px] font-semibold text-white">{title}</h2>
          <p className="text-[11px] text-muted">{symbol ? `Headlines mentioning ${symbol}` : 'Cross-market editorial flow'}</p></div>
        {data?.provider === 'finnhub' && <Badge tone="lime">Finnhub live</Badge>}
      </div>
      {error && <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-[11.5px] text-danger">{error}</p>}
      {!data && !error && <Skeleton className="h-32" />}
      {data?.provider === 'none' && <MarketBrief />}
      {data?.provider === 'finnhub' && (
        <ul className="space-y-3">
          {data.items.slice(0, 8).map((n) => (
            <li key={n.id} className="border-b border-white/[0.05] pb-3 last:border-0 last:pb-0">
              <a href={n.url} target="_blank" rel="noopener noreferrer" className="text-[12.5px] font-semibold leading-snug text-white hover:text-lime">{n.headline}</a>
              {n.summary && <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted">{n.summary}</p>}
              <p className="mt-1 text-[10px] text-muted">{n.source} · {relTime(n.publishedAt)}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
