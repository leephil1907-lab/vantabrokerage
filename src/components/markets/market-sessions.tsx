'use client';
import { useEffect, useState } from 'react';
import { FX_SESSIONS, sessionAt } from '@/lib/market-sessions';

export function MarketSessions({ compact = false }: { compact?: boolean }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date()); tick();
    const timer = window.setInterval(tick, 30_000);
    const visible = () => { if (!document.hidden) tick(); };
    document.addEventListener('visibilitychange', visible);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', visible); };
  }, []);
  return <section id={compact ? undefined : "market-sessions"} className={`market-sessions ${compact ? 'is-compact' : ''}`} aria-labelledby={compact ? 'desk-sessions-title' : 'public-sessions-title'}>
    <div className="sessions-head"><div><p className="sessions-kicker">GLOBAL MARKET CLOCK</p><h2 id={compact ? 'desk-sessions-title' : 'public-sessions-title'}>Forex trading sessions</h2><p>Follow the local time across four major currency-market centres.</p></div><span className="sessions-utc">{now ? `UTC ${new Intl.DateTimeFormat('en-GB', {timeZone:'UTC',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(now)}` : 'UTC —:—'}</span></div>
    <div className="sessions-grid">{FX_SESSIONS.map(session => { const current = now ? sessionAt(session, now) : null; return <div className="session-card" key={session.name}><div className="session-card-top"><strong>{session.name}</strong><span className={current?.active ? 'session-active' : 'session-outside'}>{current ? current.active ? 'In window' : 'Outside window' : 'Loading'}</span></div><p className="session-time">{current?.time ?? '—:—'} <small>{current?.day ?? ''} local</small></p><p className="session-window">{String(session.start).padStart(2,'0')}:00–{String(session.end).padStart(2,'0')}:00 · Mon–Fri</p></div>; })}</div>
    <div className="sessions-guides"><p><strong>Crypto</strong> Generally around the clock; venues may pause.</p><p><strong>Equity reference</strong> NYSE 09:30–16:00 New York · LSE 08:00–16:30 London. CFD and index hours can differ.</p><p><strong>Commodities & futures</strong> Hours and breaks vary by contract and venue.</p></div>
    <div className="sessions-note"><span>Indicative local windows, adjusted for daylight saving. Holidays and venue schedules are not included; these are not asset-specific trading or execution hours.</span></div>
  </section>;
}
