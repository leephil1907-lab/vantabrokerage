/** Illustrative local FX liquidity windows, not exchange calendars or execution availability. */
export const FX_SESSIONS = [
  { name:'Sydney', zone:'Australia/Sydney', start:8, end:17 },
  { name:'Tokyo', zone:'Asia/Tokyo', start:9, end:18 },
  { name:'London', zone:'Europe/London', start:8, end:17 },
  { name:'New York', zone:'America/New_York', start:8, end:17 },
] as const;
export type FXSession = typeof FX_SESSIONS[number];
export function sessionAt(session: FXSession, date: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone:session.zone, weekday:'short', hour:'2-digit', minute:'2-digit', hourCycle:'h23' }).formatToParts(date);
  const get = (key: string) => parts.find(p => p.type === key)?.value ?? '';
  const day = get('weekday'), hour = Number(get('hour')), minute = Number(get('minute'));
  const active = ['Mon','Tue','Wed','Thu','Fri'].includes(day) && hour >= session.start && hour < session.end;
  return { day, hour, minute, active, time:`${get('hour')}:${get('minute')}` };
}

const WEEKEND_DAYS = new Set(['Sat', 'Sun']);
export function isWeekend(date: Date, zone = 'UTC') {
  const day = new Intl.DateTimeFormat('en-GB', { timeZone: zone, weekday: 'short' }).format(date);
  return WEEKEND_DAYS.has(day);
}

/** Overall market status: crypto trades around the clock; FX liquidity follows the
 *  four centre windows above. When FX is closed (weekends, overnight gaps between
 *  sessions) we report when the next window opens so the page never looks dead. */
export function marketStatus(date: Date) {
  const states = FX_SESSIONS.map((s) => ({ session: s, ...sessionAt(s, date) }));
  const fxOpen = states.some((s) => s.active);
  let nextOpenMs: number | null = null;
  let nextOpenLabel = '';
  if (!fxOpen) {
    const formatters = FX_SESSIONS.map((s) => new Intl.DateTimeFormat('en-GB', { timeZone: s.zone, weekday: 'short', hour: '2-digit', hourCycle: 'h23' }));
    const step = 15 * 60 * 1000;
    for (let t = date.getTime(); t < date.getTime() + 9 * 24 * 3600 * 1000; t += step) {
      const probe = new Date(t);
      const hit = FX_SESSIONS.findIndex((s, i) => {
        const p = formatters[i].formatToParts(probe);
        const day = p.find((x) => x.type === 'weekday')?.value ?? '';
        const hour = Number(p.find((x) => x.type === 'hour')?.value ?? '');
        return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(day) && hour >= s.start && hour < s.end;
      });
      if (hit >= 0) { nextOpenMs = t - date.getTime(); nextOpenLabel = FX_SESSIONS[hit].name; break; }
    }
  }
  return { fxOpen, cryptoOpen: true, weekend: isWeekend(date, 'Australia/Sydney'), states, nextOpenMs, nextOpenLabel };
}
