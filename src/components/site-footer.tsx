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
    <footer className="site-footer">
      <div className="mx-auto max-w-7xl px-5">
        <div className="footer-invite"><div><p className="section-kicker"><span/> A MORE CONSIDERED VIEW</p><h2>Make space for<br/><em>what moves you.</em></h2><p>Markets, perspective and your account — together in one place.</p></div><div className="footer-invite-actions"><Link href="/markets" className="btn-primary px-5 py-3 text-[13px]">Explore markets <span aria-hidden="true">↗</span></Link><Link href="/register" className="footer-outline">Create an account <span aria-hidden="true">→</span></Link></div></div>
        <div className="footer-main grid gap-10 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div><Logo /><p className="mt-4 max-w-xs text-[13px] leading-relaxed text-muted">A focused workspace for exploring global markets and managing your PRIMEVEST account.</p><p className="footer-brand-note">BUILT FOR PERSPECTIVE <span>✳</span></p></div>
          {COLUMNS.map(c => <div key={c.title}><p className="label">{c.title}</p><ul className="mt-4 space-y-3">{c.links.map(([href,label]) => <li key={href}><Link href={href} className="footer-link">{label}<span aria-hidden="true">↗</span></Link></li>)}</ul></div>)}
        </div>
        <div className="footer-risk"><p>Risk warning</p><span>Trading foreign exchange, CFDs, short-expiry products and crypto derivatives involves substantial risk of loss and is not suitable for every investor. Leverage can amplify both gains and losses. Past performance is not indicative of future results. Only trade with capital you can afford to lose.</span></div>
        <div className="footer-bottom"><p>© {new Date().getFullYear()} PRIMEVEST. All rights reserved.</p><p>Market data is for reference. Trading and deposits are currently unavailable.</p></div>
        <div aria-hidden="true" className="footer-wordmark">PRIMEVEST</div>
      </div>
    </footer>
  );
}
