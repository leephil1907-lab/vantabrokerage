'use client';

import { useEffect, useState } from 'react';
import { FX_SESSIONS, sessionAt } from '@/lib/market-sessions';
import { CountryFlag } from '@/components/asset-mark';

const FLAGS: Record<string, string> = { Sydney: 'AU', Tokyo: 'JP', London: 'GB', 'New York': 'US' };

/** Live global desk strip: which trading centres are open right now. */
export function FooterLiveStrip() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  const states = FX_SESSIONS.map((s) => ({ name: s.name, ...sessionAt(s, now) }));
  return (
    <div className="border-b border-white/[0.06] bg-ink-950/60">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-5 gap-y-2 px-5 py-3">
        <span className="font-mono text-[10px] uppercase tracking-[.2em] text-muted">Global desk</span>
        {states.map((s) => (
          <span key={s.name} className="flex items-center gap-1.5">
            <CountryFlag code={FLAGS[s.name] ?? 'US'} size={14} />
            <span className="text-[11px] font-medium text-white/80">{s.name}</span>
            <span className="font-mono text-[10.5px] text-muted">{s.time}</span>
            <span className={`h-1.5 w-1.5 rounded-full ${s.active ? 'bg-emerald shadow-[0_0_6px_rgba(14,203,129,0.8)]' : 'bg-white/20'}`} title={s.active ? 'Open' : 'Closed'} />
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium text-white/80">Crypto</span>
          <span className="font-mono text-[10.5px] text-muted">24/7</span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald shadow-[0_0_6px_rgba(14,203,129,0.8)]" />
        </span>
      </div>
    </div>
  );
}
