'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Logo } from './brand';
import { MotionIndicator, Pop } from './motion/primitives';

type Item = { href: string; label: string; desc?: string };

const PRIMARY: { label: string; href?: string; items?: Item[] }[] = [
  { label: 'Trading', items: [
    { href: '/trading/forex', label: 'Forex & CFDs', desc: 'Majors plus indices and commodities with server-side margin' },
    { href: '/trading/short-expiry', label: 'Short-Expiry', desc: 'CALL / PUT contracts from 30 seconds to 1 hour' },
    { href: '/trading/crypto', label: 'Crypto Spot', desc: 'Ten USDT markets with order book and holdings' },
    { href: '/trading/futures', label: 'Perpetual Futures', desc: 'Long/short, cross or isolated margin, funding' },
  ] },
  { label: 'Markets', href: '/markets' },
  { label: 'Accounts', items: [
    { href: '/accounts', label: 'Account types', desc: 'Paper, Standard and Pro — compare conditions' },
    { href: '/trading-conditions', label: 'Trading conditions', desc: 'Spreads, leverage limits, swap and expiry rules' },
    { href: '/deposits-withdrawals', label: 'Deposits & withdrawals', desc: 'Funding methods, review windows and limits' },
  ] },
  { label: 'Company', items: [
    { href: '/company/about', label: 'About Vanta', desc: 'Who runs the platform and how it is built' },
    { href: '/contact', label: 'Contact', desc: 'Support and escalation channels' },
    { href: '/help', label: 'Help centre', desc: 'Platform guides and trading walkthroughs' },
  ] },
];

export function SiteNav({ authenticated }: { authenticated: boolean }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const closeTimer = useRef<number | null>(null);
  const pathname = usePathname();
  const reduce = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => { setOpen(false); setActive(null); }, [pathname]);

  const enter = (label: string) => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setActive(label);
  };
  const leave = () => {
    closeTimer.current = window.setTimeout(() => setActive(null), 140);
  };

  const isActive = (item: (typeof PRIMARY)[number]) =>
    item.href ? pathname === item.href : (item.items ?? []).some((i) => pathname === i.href);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ease-premium ${
        scrolled ? 'border-b border-white/[0.07] bg-ink-950/80 backdrop-blur-xl' : 'border-b border-transparent bg-transparent'
      }`}
    >
      {/* Promo rail — mirrors the reference site's top utility strip. */}
      <div className="hidden border-b border-white/[0.05] bg-ink-900/60 lg:block">
        <div className="shell flex h-9 items-center justify-between text-[11.5px] text-muted">
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald" />Provider-sourced market data</span>
            <span className="hidden xl:inline">Server-side execution · Double-entry ledger</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/help" className="transition-colors hover:text-white">Support</Link>
            <Link href="/deposits-withdrawals" className="transition-colors hover:text-white">Payments</Link>
            <span className="text-white/50">Demo account available</span>
          </div>
        </div>
      </div>

      <div className="shell flex h-[64px] items-center justify-between gap-6">
        <Logo />

        <nav aria-label="Main navigation" className="hidden items-center gap-0.5 lg:flex" onMouseLeave={leave} onKeyDown={(e) => { if (e.key === 'Escape') { const trigger = e.currentTarget.querySelector<HTMLButtonElement>('button[aria-expanded="true"]'); setActive(null); trigger?.focus(); } }} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setActive(null); }}>
          {PRIMARY.map((item) => {
            const activeNow = isActive(item);
            return (
              <div key={item.label} className="relative" onMouseEnter={() => item.items && enter(item.label)}>
                {item.href ? (
                  <Link href={item.href} className="relative flex items-center rounded-lg px-3 py-2 text-[13px] font-medium text-white/85 transition-colors hover:text-white">
                    {activeNow && <MotionIndicator layoutId="nav-active" className="absolute inset-0 -z-10 rounded-lg bg-white/[0.07]" />}
                    {item.label}
                  </Link>
                ) : (
                  <button
                    type="button"
                    aria-expanded={active === item.label}
                    onClick={() => setActive((current) => current === item.label ? null : item.label)}
                    className={`relative flex items-center gap-1 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${active === item.label || activeNow ? 'text-white' : 'text-white/85 hover:text-white'}`}
                  >
                    {(active === item.label || activeNow) && <MotionIndicator layoutId="nav-active" className="absolute inset-0 -z-10 rounded-lg bg-white/[0.07]" />}
                    {item.label}
                    <motion.span animate={{ rotate: active === item.label ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </motion.span>
                  </button>
                )}

                {item.items && (
                  <div className="absolute left-0 top-full pt-2">
                    <Pop open={active === item.label}>
                      <div className="w-[340px] overflow-hidden rounded-2xl border border-white/10 bg-ink-900/95 p-1.5 shadow-panel backdrop-blur-xl">
                        {item.items.map((sub) => (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className={`group block rounded-xl px-3 py-2.5 transition-colors ${pathname === sub.href ? 'bg-white/[0.06]' : 'hover:bg-white/[0.05]'}`}
                          >
                            <span className="flex items-center justify-between text-[13px] font-medium text-white">
                              {sub.label}
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="translate-x-0 text-muted transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-lime"><path d="M2.5 6h7M6 2.5 9.5 6 6 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </span>
                            <span className="mt-0.5 block text-[11.5px] leading-relaxed text-muted">{sub.desc}</span>
                          </Link>
                        ))}
                      </div>
                    </Pop>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {authenticated ? (
            <Link href="/dashboard" className="btn-primary px-4 py-2 text-[13px]">Go to terminal</Link>
          ) : (
            <>
              <Link href="/login" className="btn-ghost px-3.5 py-2 text-[13px]">Sign in</Link>
              <Link href="/register" className="btn-primary px-4 py-2 text-[13px]">Open account</Link>
            </>
          )}
        </div>

        <button
          className="rounded-lg border border-white/10 p-2 lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          <motion.span animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.2 }} className="block">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d={open ? 'M4 4l8 8M12 4l-8 8' : 'M2 5h12M2 11h12'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </motion.span>
        </button>
      </div>

      {/* Mobile sheet */}
      {open && (
        <motion.div
          initial={reduce ? undefined : { height: 0, opacity: 0 }}
          animate={reduce ? undefined : { height: 'auto', opacity: 1 }}
          className="overflow-hidden border-t border-white/[0.07] bg-ink-950/98 px-5 py-4 lg:hidden"
        >
          <div className="space-y-4">
            {PRIMARY.map((item) => (
              <div key={item.label}>
                <p className="label mb-1.5">{item.label}</p>
                <div className="grid grid-cols-2 gap-1">
                  {(item.items ?? [{ href: item.href!, label: item.label }]).map((sub) => (
                    <Link key={sub.href} href={sub.href} className="rounded-lg px-3 py-2.5 text-[13px] text-white/80 hover:bg-white/5 hover:text-white">{sub.label}</Link>
                  ))}
                </div>
              </div>
            ))}
            <div className="flex gap-2 pt-1">
              <Link href={authenticated ? '/dashboard' : '/login'} className="btn-ghost flex-1 py-2 text-[13px]">{authenticated ? 'Terminal' : 'Sign in'}</Link>
              {!authenticated && <Link href="/register" className="btn-primary flex-1 py-2 text-[13px]">Open account</Link>}
            </div>
          </div>
        </motion.div>
      )}
    </header>
  );
}
