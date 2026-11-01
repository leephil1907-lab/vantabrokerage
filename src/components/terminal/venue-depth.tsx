'use client';
import { useEffect, useState } from 'react';
import { fmtPrice, fmtQty, relTime } from '@/lib/format';

type Book = { symbol: string; source: 'Kraken'; fetchedAt: string; stale: boolean; bids: {price:number;quantity:number;time:number}[]; asks: {price:number;quantity:number;time:number}[] };
const SUPPORTED = new Set(['BTC/USD','BTC/USDT','ETH/USD','ETH/USDT','SOL/USD','SOL/USDT']);
export function VenueDepth({ symbol }: { symbol: string }) {
  const [book, setBook] = useState<Book | null>(null);
  const [failed, setFailed] = useState(false);
  const [clock, setClock] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); let active = true;
    setBook(null); setFailed(false); setClock(Date.now());
    if (!SUPPORTED.has(symbol)) return () => controller.abort();
    const load = async () => {
      try {
        const res = await fetch(`/api/markets/venue-depth?symbol=${encodeURIComponent(symbol)}`, { cache:'no-store', signal:controller.signal });
        if (!res.ok) throw new Error('unavailable');
        const next = await res.json() as Book;
        if (active && next.symbol === symbol) { setBook(next); setFailed(false); setClock(Date.now()); }
      } catch (e) { if (active && !(e instanceof Error && e.name === 'AbortError')) { setFailed(true); setClock(Date.now()); } }
    };
    void load(); const timer = setInterval(() => { setClock(Date.now()); if (!document.hidden) void load(); }, 10_000);
    const visible = () => { if (!document.hidden) void load(); }; document.addEventListener('visibilitychange', visible);
    return () => { active = false; controller.abort(); clearInterval(timer); document.removeEventListener('visibilitychange', visible); };
  }, [symbol]);
  const delayed = failed || !!book?.stale || (!!book && clock - Date.parse(book.fetchedAt) > 25_000);
  const visibleBook = book?.symbol === symbol ? book : null;
  const max = Math.max(0.00000001, ...(visibleBook?.asks ?? []).map(l => l.quantity), ...(visibleBook?.bids ?? []).map(l => l.quantity));
  return <section aria-label="External venue order book" className="venue-depth">
    <div className="venue-depth-header"><div><p className="venue-depth-title">Market depth</p><p className="venue-depth-sub">Kraken · {symbol} · external venue</p></div><span className={`venue-depth-status ${delayed || !SUPPORTED.has(symbol) ? 'is-delayed' : ''}`}>{visibleBook ? delayed ? 'Delayed' : 'Snapshot' : failed ? 'Unavailable' : SUPPORTED.has(symbol) ? 'Loading' : 'Unavailable'}</span></div>
    {!SUPPORTED.has(symbol) ? <p className="venue-depth-empty">Kraken depth is available here for supported BTC, ETH and SOL pairs.</p> : !visibleBook ? <p className="venue-depth-empty">{failed ? 'Market depth is temporarily unavailable.' : 'Connecting to Kraken market depth…'}</p> : <>
      <div className="venue-depth-columns"><span>Price</span><span>Amount</span></div>
      {[...visibleBook.asks].slice(0, 6).reverse().map((level, i) => <div className="venue-depth-row ask" key={`a-${i}-${level.price}`}><span className="venue-depth-fill" style={{width:`${level.quantity / max * 100}%`}}/><span>{fmtPrice(level.price, 2)}</span><span>{fmtQty(level.quantity, 8)}</span></div>)}
      <div className="venue-depth-spread"><span>Spread</span><strong>{fmtPrice(visibleBook.asks[0].price - visibleBook.bids[0].price, 2)}</strong></div>
      {visibleBook.bids.slice(0, 6).map((level, i) => <div className="venue-depth-row bid" key={`b-${i}-${level.price}`}><span className="venue-depth-fill" style={{width:`${level.quantity / max * 100}%`}}/><span>{fmtPrice(level.price, 2)}</span><span>{fmtQty(level.quantity, 8)}</span></div>)}
      <p className="venue-depth-foot">{delayed ? 'Delayed · ' : ''}Fetched {relTime(visibleBook.fetchedAt)} · refreshed approximately every 10s</p>
    </>}
    <p className="venue-depth-disclaimer">Live order book via Kraken.</p>
  </section>;
}
