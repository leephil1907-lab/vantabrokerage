import { prisma } from '@/lib/db';
import { PageHero, Section, CTASection } from '@/components/marketing-ui';
import { fmtPrice } from '@/lib/format';

export const metadata = { title: 'Trading conditions' };
export const dynamic = 'force-dynamic';

export default async function TradingConditionsPage() {
  const pairs = await prisma.tradingPair.findMany({ where: { enabled: true }, orderBy: [{ category: 'asc' }, { symbol: 'asc' }] });
  const groups = pairs.reduce<Record<string, typeof pairs>>((acc, p) => { (acc[p.category] ||= []).push(p); return acc; }, {});

  return (
    <>
      <PageHero
        eyebrow="Trading conditions"
        title="Leverage, spreads, fees and settlement — stated plainly"
        body="These values are read live from the platform's market configuration. Administrators can adjust instrument availability, leverage caps, fees and payout rates; changes are audit-logged."
      />
      <div className="mx-auto max-w-7xl space-y-10 px-5 py-12">
        {Object.entries(groups).map(([category, list]) => (
          <section key={category}>
            <h2 className="text-[15px] font-semibold uppercase tracking-wide text-white">{category} instruments</h2>
            <div className="mt-3 overflow-x-auto rounded-2xl border border-white/[0.07]">
              <table className="w-full min-w-[720px]">
                <thead className="bg-white/[0.02]">
                  <tr><th className="th">Symbol</th><th className="th">Instrument</th><th className="th text-right">Max leverage</th><th className="th text-right">Taker fee</th><th className="th text-right">Maker fee</th><th className="th text-right">Min qty</th><th className="th text-right">Payout</th></tr>
                </thead>
                <tbody>
                  {list.map((p) => (
                    <tr key={p.id} className="table-row">
                      <td className="td font-medium text-white">{p.symbol}</td>
                      <td className="td text-muted">{p.displayName}</td>
                      <td className="td text-right value-mono">{p.maxLeverage}×</td>
                      <td className="td text-right value-mono">{(Number(p.takerFee) * 100).toFixed(3)}%</td>
                      <td className="td text-right value-mono">{(Number(p.makerFee) * 100).toFixed(3)}%</td>
                      <td className="td text-right value-mono">{fmtPrice(Number(p.minQty), 6)}</td>
                      <td className="td text-right value-mono">{p.payoutRate ? `${(Number(p.payoutRate) * 100).toFixed(0)}%` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}

        <section className="panel p-5">
          <h2 className="text-[15px] font-semibold text-white">Deposits & withdrawals</h2>
          <ul className="mt-3 space-y-2 text-[12.5px] leading-relaxed text-muted">
            <li>• Minimum withdrawal: 20.00 USD-equivalent. Fee: 0.5% (minimum 1.00).</li>
            <li>• Daily withdrawal limit applies per client and is enforced server-side.</li>
            <li>• Identity verification must be approved before a withdrawal can be requested.</li>
            <li>• Withdrawals require password re-authentication and, where enabled, a two-factor code.</li>
            <li>• Crypto deposits are verified on-chain through a configured provider; without a provider they queue for manual finance review.</li>
            <li>• Reserved funds for a rejected withdrawal are returned to the available balance automatically.</li>
          </ul>
        </section>

        <section className="panel p-5">
          <h2 className="text-[15px] font-semibold text-white">Execution & settlement</h2>
          <ul className="mt-3 space-y-2 text-[12.5px] leading-relaxed text-muted">
            <li>• Market orders fill at the server-side quoted bid/ask; the quote timestamp is stored on the execution.</li>
            <li>• Limit and stop orders rest with reserved margin and are matched by a background worker against live quotes.</li>
            <li>• Derivative margin, liquidation price, unrealised P/L and funding are computed on the backend.</li>
            <li>• Maintenance margin rate is 0.5%; liquidation triggers below 50% of the maintenance requirement, with warnings at 80%.</li>
            <li>• Short-expiry contracts settle against a fresh quote at expiry; tie outcomes return the stake with no P/L.</li>
            <li>• Where a live execution provider is not connected, live trading is reported as unavailable rather than simulated.</li>
          </ul>
        </section>
      </div>
      <CTASection title="Ready to trade these conditions?" body="Open an account and inspect every value in your terminal before placing an order." primary={{ href: '/register', label: 'Open account' }} secondary={{ href: '/deposits-withdrawals', label: 'Funding options' }} />
    </>
  );
}
