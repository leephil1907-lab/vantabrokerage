import Link from 'next/link';
import { Logo } from './brand';

const COLUMNS = [
  {
    title: 'Markets',
    links: [
      ['/markets', 'All markets'],
      ['/#live-charts', 'Live charts'],
      ['/#market-sessions', 'Market sessions'],
      ['/trading/forex', 'Forex trading'],
      ['/trading/crypto', 'Crypto spot'],
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

/** Compact, proportionate footer: one invite line, link columns, risk block. */
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:py-12">
        <div className="flex flex-col gap-5 border-b border-white/[0.07] pb-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[16px] font-semibold text-white">Make space for what moves you.</p>
            <p className="mt-1 text-[12.5px] text-muted">Markets, perspective and your account — together in one place.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/markets" className="btn-primary px-4 py-2.5 text-[12.5px]">Explore markets <span aria-hidden="true">↗</span></Link>
            <Link href="/register" className="btn-ghost px-4 py-2.5 text-[12.5px]">Create an account</Link>
          </div>
        </div>

        <div className="grid gap-8 py-8 sm:grid-cols-2 lg:grid-cols-[1.25fr_repeat(3,1fr)]">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-[12.5px] leading-relaxed text-muted">A focused workspace for exploring global markets and managing your PRIMEVEST account.</p>
          </div>
          {COLUMNS.map((c) => (
            <div key={c.title}>
              <p className="label">{c.title}</p>
              <ul className="mt-3 space-y-2">
                {c.links.map(([href, label]) => (
                  <li key={href}><Link href={href} className="footer-link">{label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="footer-risk"><p>Risk warning</p><span>Trading foreign exchange, CFDs, short-expiry products and crypto derivatives involves substantial risk of loss and is not suitable for every investor. Leverage can amplify both gains and losses. Past performance is not indicative of future results. Only trade with capital you can afford to lose.</span></div>
        <div className="footer-bottom"><p>© {new Date().getFullYear()} PRIMEVEST. All rights reserved.</p><p>Market data is provided by leading third-party providers.</p></div>
      </div>
    </footer>
  );
}
