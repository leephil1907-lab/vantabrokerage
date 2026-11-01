'use client';
import { useEffect, useState } from 'react';
import { FX_SESSIONS, sessionAt, marketStatus } from '@/lib/market-sessions';
import { countdown } from '@/lib/format';

export function MarketSessions({ compact = false }: { compact?: boolean }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date()); tick();
    const timer = window.setInterval(tick, 30_000);
    const visible = () => { if (!document.hidden) tick(); };
    document.addEventListener('visibilitychange', visible);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', visible); };
  }, []);
  const status = now ? marketStatus(now) : null;
  return <section id={compact ? undefined : "market-sessions"} className={`market-sessions ${compact ? 'is-compact' : ''}`} aria-labelledby={compact ? 'desk-sessions-title' : 'public-sessions-title'}>
    <div className="sessions-head"><div><p className="sessions-kicker">GLOBAL MARKET CLOCK</p><h2 id={compact ? 'desk-sessions-title' : 'public-sessions-title'}>Trading sessions</h2><p>Live status across the major currency centres and crypto, which trades around the clock.</p></div><span className="sessions-utc">{now ? `UTC ${new Intl.DateTimeFormat('en-GB', {timeZone:'UTC',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(now)}` : 'UTC —:—'}</span></div>
    {status && (
      <div className="sessions-status-strip">
        <span className={`sessions-status-chip ${status.fxOpen ? 'is-open' : 'is-closed'}`}>
          <i aria-hidden="true" /> Forex {status.fxOpen ? 'Open' : status.weekend ? 'Closed · weekend' : 'Closed'}
          {!status.fxOpen && status.nextOpenMs != null && <small> · {status.nextOpenLabel} opens in {countdown(status.nextOpenMs)}</small>}
        </span>
        <span className="sessions-status-chip is-open"><i aria-hidden="true" /> Crypto <small>· Open 24/7</small></span>
        <span className="sessions-status-chip is-neutral"><i aria-hidden="true" /> Indices &amp; commodities <small>· venue hours vary</small></span>
      </div>
    )}
    <div className="sessions-grid">
      <div className="session-card is-crypto"><div className="session-card-top"><strong>Crypto</strong><span className="session-active">Open · 24/7</span></div><p className="session-time">{now ? new Intl.DateTimeFormat('en-GB', {timeZone:'UTC',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(now) : '—:—'} <small>UTC</small></p><p className="session-window">Continuous · venues may pause for maintenance</p></div>
      {FX_SESSIONS.map(session => { const current = now ? sessionAt(session, now) : null; return <div className="session-card" key={session.name}><div className="session-card-top"><strong>{session.name}</strong><span className={current?.active ? 'session-active' : 'session-outside'}>{current ? current.active ? 'In window' : 'Outside window' : 'Loading'}</span></div><p className="session-time">{current?.time ?? '—:—'} <small>{current?.day ?? ''} local</small></p><p className="session-window">{String(session.start).padStart(2,'0')}:00–{String(session.end).padStart(2,'0')}:00 · Mon–Fri</p></div>; })}
    </div>
    <div className="sessions-guides"><p><strong>Crypto</strong> Generally around the clock; venues may pause.</p><p><strong>Equity reference</strong> NYSE 09:30–16:00 New York · LSE 08:00–16:30 London. CFD and index hours can differ.</p><p><strong>Commodities & futures</strong> Hours and breaks vary by contract and venue.</p></div>
    <div className="sessions-note"><span>Sessions are shown in your local time.</span></div>
  </section>;
}
