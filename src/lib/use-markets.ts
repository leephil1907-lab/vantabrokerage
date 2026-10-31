'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { MarketRow } from '@/components/market-selector';

export function useMarkets(category?: string, symbols?: string[]) {
  const [markets, setMarkets] = useState<MarketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const attempts = useRef(0);
  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (symbols?.length) params.set('symbols', symbols.join(','));
      const res = await fetch(`/api/markets?${params.toString()}`, { cache: 'no-store' });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.message ?? 'Market feed unavailable');
      attempts.current = 0;
      if (mounted.current) { setMarkets(body.markets); setError(null); }
    } catch (e) {
      if (mounted.current) setError((e as Error).message);
      // One quick retry: a cold dev server or a brief provider hiccup should not
      // leave a desk empty until the next 15s poll.
      if (mounted.current && attempts.current < 1) {
        attempts.current += 1;
        setTimeout(() => { if (mounted.current) void load(); }, 900);
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [category, symbols?.join(',')]);

  useEffect(() => {
    mounted.current = true;
    load();
    const id = setInterval(load, 15_000);
    return () => { mounted.current = false; clearInterval(id); };
  }, [load]);

  return { markets, loading, error, reload: load };
}
