import Link from 'next/link';
import { ArrowUpRight } from '@/components/ui/arrow-up-right';
import { Logo } from './brand';
import { Magnetic } from '@/components/motion/primitives';
import { FooterLiveStrip } from '@/components/footer-live-strip';

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

/** Compact yet characterful footer: live desk strip, invite band, columns, risk block, ghost marquee. */
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <FooterLiveStrip />
      <div className="mx-auto max-w-7xl px-5 py-10 sm:py-12">
        <div className="relative flex flex-col gap-5 border-b border-white/[0.07] pb-8 md:flex-row md:items-center md:justify-between">
          <div aria-hidden="true" className="gold-hairline pointer-events-none absolute -top-px left-0 h-px w-full" />
          <div>
            <p className="text-[16px] font-semibold text-white">Make space for what moves you.</p>
            <p className="mt-1 text-[12.5px] text-muted">Markets, perspective and your account — together in one place.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Magnetic strength={0.2}><Link href="/markets" className="btn-primary px-4 py-2.5 text-[12.5px]">Explore markets <ArrowUpRight /></Link></Magnetic>
            <Link href="/register" className="btn-ghost px-4 py-2.5 text-[12.5px]">Create an account</Link>
          </div>
        </div>

        <div className="grid gap-8 py-8 sm:grid-cols-2 lg:grid-cols-[1.25fr_repeat(3,1fr)]">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-[12.5px] leading-relaxed text-muted">A focused workspace for exploring global markets and managing your PRIMEVEST account.</p>
            <p className="mt-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.18em] text-muted"><span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald opacity-60" /><span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald" /></span>Systems live · quotes streaming</p>
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
      <div aria-hidden="true" className="ghost-marquee overflow-hidden border-t border-white/[0.05] py-3 select-none">
        <div className="ghost-track flex w-max items-center gap-10">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="font-display text-[64px] font-semibold leading-none tracking-tight sm:text-[88px]">PRIMEVEST<span className="ml-10 text-lime/40">✳</span></span>
          ))}
        </div>
      </div>
    </footer>
  );
}
