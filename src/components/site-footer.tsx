import Link from 'next/link';
import { Logo } from './brand';

const COLUMNS = [
  {
    title: 'Markets',
    links: [
      ['/markets', 'All markets'],
      ['/trading/forex', 'Forex trading'],
      ['/trading/cfd', 'CFD trading'],
      ['/trading/crypto', 'Crypto spot'],
      ['/trading/futures', 'Crypto futures'],
      ['/trading/short-expiry', 'Short-expiry'],
    ],
  },
  {
    title: 'Platform',
    links: [
      ['/accounts', 'Account types'],
      ['/trading-conditions', 'Trading conditions'],
      ['/deposits-withdrawals', 'Deposits & withdrawals'],
      ['/referral-program', 'Referral program'],
      ['/help', 'Help center'],
      ['/contact', 'Contact'],
    ],
  },
  {
    title: 'Company',
    links: [
      ['/company/about', 'About us'],
      ['/legal/terms', 'Terms & conditions'],
      ['/legal/privacy', 'Privacy policy'],
      ['/legal/risk-disclosure', 'Risk disclosure'],
      ['/legal/aml', 'AML policy'],
      ['/legal/cookies', 'Cookie policy'],
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-white/[0.07] bg-ink-950">
      <div className="mx-auto max-w-7xl px-5 py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-[12.5px] leading-relaxed text-muted">
              A multi-asset brokerage terminal combining forex, CFDs, short-expiry trading and a full cryptocurrency stack — one wallet, one ledger, an audit-logged back office.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="chip">Double-entry ledger</span>
              <span className="chip">Server-side execution</span>
              <span className="chip">Audit logging</span>
            </div>
          </div>
          {COLUMNS.map((c) => (
            <div key={c.title}>
              <p className="label">{c.title}</p>
              <ul className="mt-3 space-y-2">
                {c.links.map(([href, label]) => (
                  <li key={href}>
                    <Link href={href} className="text-[12.5px] text-muted transition-colors hover:text-white">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-xl border border-siren/20 bg-siren/[0.06] p-4">
          <p className="text-[11.5px] font-semibold uppercase tracking-wide text-siren">Risk warning</p>
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted">
            Trading foreign exchange, CFDs, short-expiry products and crypto derivatives involves substantial risk of loss and is not suitable for every investor.
            Leverage can amplify both gains and losses. Paper trading uses simulated funds and does not represent real market execution. Past performance is not indicative
            of future results. Only trade with capital you can afford to lose.
          </p>
        </div>

        <div className="mt-8 flex flex-col justify-between gap-3 border-t border-white/[0.07] pt-6 text-[11.5px] text-muted sm:flex-row">
          <p>© {new Date().getFullYear()} PRIMEVEST. All rights reserved.</p>
          <p className="max-w-2xl leading-relaxed">
            PRIMEVEST is a technology demonstration platform. Live trading, automated custody and payment processing are not connected. Do not deposit real funds.
          </p>
        </div>
      </div>
    </footer>
  );
}
