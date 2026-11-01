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
