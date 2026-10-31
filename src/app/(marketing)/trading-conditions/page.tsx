import { prisma } from '@/lib/db';
import { PageHero, Section, StatBand, Callout, CTASection, SpecTable } from '@/components/marketing-ui';
import { AssetMark } from '@/components/asset-mark';

export const metadata = { title: 'Trading conditions' };
export const dynamic = 'force-dynamic';

const pct = (v: unknown) => `${(Number(v) * 100).toFixed(3).replace(/0+$/, '').replace(/\.$/, '')}%`;

export default async function TradingConditionsPage() {
  const pairs = await prisma.tradingPair.findMany({ where: { enabled: true }, orderBy: [{ category: 'asc' }, { symbol: 'asc' }] });
  const groups = pairs.reduce<Record<string, typeof pairs>>((acc, p) => { (acc[p.category] ||= []).push(p); return acc; }, {});
  const maxLev = Math.max(...pairs.map((p) => p.maxLeverage));

  return (
    <>
      <PageHero
        eyebrow="Trading conditions"
        title="Leverage, spreads, fees and settlement — stated plainly"
        body="Every value below is read live from the platform's instrument configuration at request time. Administrators can change availability, leverage caps, fees and payout rates; each change is written to the audit log with actor and before/after state."
        breadcrumbs={[{ label: 'Trading conditions' }]}
        aside={<StatBand items={[
          { k: String(pairs.length), label: 'Enabled instruments', sub: 'live from database' },
          { k: `${maxLev}×`, label: 'Highest leverage', sub: 'per-instrument caps' },
          { k: String(Object.keys(groups).length), label: 'Market groups', sub: Object.keys(groups).join(' · ').toLowerCase() },
          { k: 'audited', label: 'Config changes', sub: 'actor + timestamp' },
        ]} />}
      />

      <Section eyebrow="Instrument table" title="All enabled markets" body="Taker and maker fees are charged on notional. Payout applies to short-expiry contracts only.">
        <div className="space-y-8">
          {Object.entries(groups).map(([category, list]) => (
            <div key={category}>
              <div className="mb-2.5 flex items-center gap-2">
                <h3 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-white">{category}</h3>
                <span className="chip">{list.length} instruments</span>
              </div>
              <div className="overflow-hidden rounded-2xl border border-white/[0.07]">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px]">
                    <thead className="bg-white/[0.02]">
                      <tr>
                        <th className="th">Instrument</th>
                        <th className="th text-right">Max leverage</th>
                        <th className="th text-right">Taker fee</th>
                        <th className="th text-right">Maker fee</th>
                        <th className="th text-right">Min qty</th>
                        <th className="th text-right">Precision</th>
                        <th className="th text-right">Payout</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((p) => (
                        <tr key={p.id} className="table-row">
                          <td className="td">
                            <span className="flex items-center gap-2.5">
                              <AssetMark symbol={p.symbol} size={20} />
                              <span>
                                <span className="block font-medium text-white">{p.symbol}</span>
                                <span className="block text-[10px] text-muted">{p.displayName}</span>
                              </span>
                            </span>
                          </td>
                          <td className="td text-right value-mono">{p.maxLeverage}×</td>
                          <td className="td text-right value-mono">{pct(p.takerFee)}</td>
                          <td className="td text-right value-mono">{pct(p.makerFee)}</td>
                          <td className="td text-right value-mono">{Number(p.minQty)}</td>
                          <td className="td text-right value-mono text-muted">{p.pricePrecision} dp</td>
                          <td className="td text-right value-mono">{p.payoutRate != null ? pct(p.payoutRate) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section eyebrow="Platform rules" title="Execution, settlement and fees">
        <div className="grid gap-4 lg:grid-cols-2">
          <SpecTable
            columns={['Rule', 'Value']}
            rows={[
              ['Execution mode', 'Paper only; live execution unavailable'],
              ['Order types', 'Market · limit · stop'],
              ['Margin reservation', 'On placement, released on cancel/fill'],
              ['Liquidation', 'Continuous, engine-priced'],
              ['Funding interval', '8h default, per instrument'],
              ['Price providers', 'Kraken · Coinbase · Yahoo Finance'],
            ]}
            caption="Execution mode is shown in the header of every authenticated screen."
          />
          <div className="space-y-3">
            <Callout tone="info" title="How to read the fee columns">
              Fees are a fraction of notional, not of margin. A 0.10% taker fee on a $10,000 notional position is $10, regardless of leverage.
            </Callout>
            <Callout tone="warn" title="Leverage increases risk">
              Higher leverage reduces the price move needed to liquidate a position. Caps below are maximums, not recommendations.
            </Callout>
            <Callout tone="ok" title="Values are live">
              This page queries the database on every request. If an administrator changes leverage or fees, the table reflects it immediately
              and the change is audit-logged.
            </Callout>
          </div>
        </div>
      </Section>

      <CTASection title="Trade on these conditions" body="Open a paper account and see every fee applied to a real order before you commit capital." primary={{ href: '/register', label: 'Create account' }} secondary={{ href: '/legal/risk-disclosure', label: 'Risk disclosure' }} />
    </>
  );
}
