'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Logo } from './brand';

const LINKS = [
  { href: '/markets', label: 'Markets' },
  { href: '/trading/forex', label: 'Forex' },
  { href: '/trading/cfd', label: 'CFDs' },
  { href: '/trading/crypto', label: 'Crypto' },
  { href: '/trading/futures', label: 'Futures' },
  { href: '/trading/short-expiry', label: 'Short-Expiry' },
  { href: '/accounts', label: 'Accounts' },
  { href: '/company/about', label: 'About' },
  { href: '/help', label: 'Help' },
];

export function SiteNav({ authenticated }: { authenticated: boolean }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className={`sticky top-0 z-50 transition-colors ${scrolled ? 'border-b border-white/[0.07] bg-ink-950/85 backdrop-blur-xl' : 'bg-transparent'}`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-5">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors ${pathname === l.href ? 'text-white' : 'text-muted hover:text-white'}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {authenticated ? (
            <Link href="/dashboard" className="btn-primary px-4 py-2 text-[13px]">Go to dashboard</Link>
          ) : (
            <>
              <Link href="/login" className="btn-ghost px-3.5 py-2 text-[13px]">Sign in</Link>
              <Link href="/register" className="btn-primary px-4 py-2 text-[13px]">Open account</Link>
            </>
          )}
        </div>
        <button className="rounded-lg border border-white/10 p-2 md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menu">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 5h12M2 11h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
        </button>
      </div>
      {open && (
        <div className="border-t border-white/[0.07] bg-ink-950/98 px-5 py-3 md:hidden">
          <div className="grid grid-cols-2 gap-1">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="rounded-lg px-3 py-2.5 text-[13px] text-muted hover:bg-white/5 hover:text-white">{l.label}</Link>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <Link href={authenticated ? '/dashboard' : '/login'} className="btn-ghost flex-1 py-2 text-[13px]">{authenticated ? 'Dashboard' : 'Sign in'}</Link>
            {!authenticated && <Link href="/register" className="btn-primary flex-1 py-2 text-[13px]">Open account</Link>}
          </div>
        </div>
      )}
    </header>
  );
}
