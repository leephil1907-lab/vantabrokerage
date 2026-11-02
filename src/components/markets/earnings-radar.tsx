import { earningsCalendar } from '@/lib/finnhub';
import { AssetMark } from '@/components/asset-mark';

const compact = (n: number | null) => {
  if (n == null) return '—';
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toFixed(0);
};

const session = (h: string) => (h === 'bmo' ? 'Before open' : h === 'amc' ? 'After close' : h === 'dmh' ? 'Midday' : '—');

/** Upcoming listed-company earnings with consensus, from the Finnhub calendar. */
export async function EarningsRadar() {
  const events = await earningsCalendar(5).catch(() => []);
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Macro radar</p>
          <h2 className="display mt-2 text-[26px] sm:text-[32px]">Earnings radar</h2>
          <p className="mt-2 text-[13px] text-muted">Listed companies reporting this week, with consensus EPS and revenue where published — equity results move indices and sentiment.</p>
        </div>
        <span className="font-mono text-[10px] text-muted">source: Finnhub · refreshed every 10 min</span>
      </div>
      {events.length === 0 ? (
        <p className="panel p-5 text-[12.5px] text-muted">No scheduled reports in the current window — the radar repopulates as providers publish dates.</p>
      ) : (
        <ul className="panel divide-y divide-white/[0.06] overflow-hidden">
          {events.map((e, i) => (
            <li key={`${e.symbol}-${e.date}-${i}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 sm:px-5">
              <span className="flex w-[130px] shrink-0 items-center gap-2">
                <AssetMark symbol={e.symbol} size={16} />
                <span className="font-mono text-[12px] font-semibold text-white">{e.symbol}</span>
              </span>
              <span className="w-[92px] shrink-0 font-mono text-[11px] text-muted">{new Date(`${e.date}T00:00:00Z`).toLocaleDateString(undefined, { month: 'short', day: '2-digit' })}{e.year ? ` · Q${e.quarter}` : ''}</span>
              <span className="w-[92px] shrink-0 text-[11px] text-muted">{session(e.hour)}</span>
              <span className="flex-1 font-mono text-[11px] text-muted">EPS est. <span className="text-white/80">{e.epsEstimate == null ? '—' : e.epsEstimate.toFixed(2)}</span></span>
              <span className="font-mono text-[11px] text-muted">Rev est. <span className="text-white/80">{compact(e.revenueEstimate)}</span></span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
