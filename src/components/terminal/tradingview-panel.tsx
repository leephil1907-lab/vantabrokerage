'use client';
import { useEffect, useRef, useState } from 'react';

/** Official TradingView advanced chart widget; it does not execute orders. */
export function TradingViewPanel({ symbol, height = 500 }: { symbol: string; height?: number }) {
  const host = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<'dark'|'light'>('dark');
  const [status, setStatus] = useState<'loading'|'ready'|'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const sync = () => setTheme(document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');
    sync(); window.addEventListener('primevest-theme', sync); window.addEventListener('storage', sync);
    return () => { window.removeEventListener('primevest-theme', sync); window.removeEventListener('storage', sync); };
  }, []);
  useEffect(() => {
    const el = host.current; if (!el) return;
    setStatus('loading'); el.replaceChildren();
    const container = document.createElement('div'); container.className = 'tradingview-widget-container'; container.style.height = '100%'; container.style.width = '100%';
    const inner = document.createElement('div'); inner.className = 'tradingview-widget-container__widget'; inner.style.height = 'calc(100% - 28px)'; inner.style.width = '100%';
    const attribution = document.createElement('div'); attribution.className = 'tradingview-widget-copyright';
    const link = document.createElement('a'); link.href = 'https://www.tradingview.com/'; link.rel = 'noopener noreferrer'; link.target = '_blank'; link.textContent = 'Charts by TradingView'; attribution.append(link);
    const script = document.createElement('script'); script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'; script.async = true; script.type = 'text/javascript';
    script.textContent = JSON.stringify({ autosize: true, symbol, interval: '60', timezone:'Etc/UTC', theme, style:'1', locale:'en', allow_symbol_change:false, save_image:false, calendar:false, withdateranges:true, support_host:'https://www.tradingview.com' });
    script.onerror = () => setStatus('error');
    container.append(inner, attribution, script); el.append(container);
    const observer = new MutationObserver(() => { if (el.querySelector('iframe')) setStatus('ready'); }); observer.observe(el, { childList:true, subtree:true });
    const timeout = window.setTimeout(() => { if (!el.querySelector('iframe')) setStatus('error'); }, 14_000);
    return () => { clearTimeout(timeout); observer.disconnect(); el.replaceChildren(); };
  }, [symbol, theme, attempt]);
  return <div className="tv-shell" style={{height}}>
    <div ref={host} className="h-full w-full" aria-label={`TradingView chart for ${symbol}`} />
    {status !== 'ready' && <div className="tv-overlay" role="status"><p>{status === 'loading' ? 'Loading TradingView chart…' : 'TradingView chart could not be loaded.'}</p>{status === 'error' && <button onClick={() => setAttempt(n=>n+1)} className="btn-ghost mt-3 px-3 py-2 text-xs">Try again</button>}<a href={`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(symbol)}`} target="_blank" rel="noreferrer" className="mt-3 text-xs text-lime hover:underline">Open chart on TradingView ↗</a></div>}
  </div>;
}
