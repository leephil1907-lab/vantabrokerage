'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Logo } from './brand';

const NAV = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/kyc', label: 'Verification' },
  { href: '/admin/trading', label: 'Trading' },
  { href: '/admin/wallets', label: 'Wallet ops' },
  { href: '/admin/markets', label: 'Markets' },
  { href: '/admin/affiliates', label: 'Affiliates' },
  { href: '/admin/support', label: 'Support' },
  { href: '/admin/settings', label: 'Settings' },
  { href: '/admin/audit', label: 'Audit log' },
];

export function AdminShell({ children, role, email }: { children: React.ReactNode; role: string; email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const signOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    router.push('/');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-ink-950">
      <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-ink-950/95 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-4">
            <Logo />
            <span className="rounded-md border border-lime/25 bg-lime/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-lime">admin console</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="btn-ghost px-3 py-1.5 text-[11.5px]">Client dashboard</Link>
            <span className="hidden text-[11px] text-muted sm:block">{email} · {role}</span>
            <button onClick={signOut} className="rounded-lg border border-white/10 px-3 py-1.5 text-[11.5px] text-muted hover:border-danger/40 hover:text-danger">Sign out</button>
            <button className="rounded-lg border border-white/10 p-1.5 text-muted lg:hidden" onClick={() => setMobileOpen((v) => !v)} aria-label="Menu">
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2 5h12M2 11h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            </button>
          </div>
        </div>
        <nav className={`mx-auto max-w-[1600px] gap-1 overflow-x-auto px-3 pb-2 lg:flex ${mobileOpen ? 'flex' : 'hidden'}`}>
          {NAV.map((n) => {
            const active = n.href === '/admin' ? pathname === '/admin' : pathname.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition ${active ? 'bg-white/[0.07] text-white' : 'text-muted hover:text-white'}`}>
                {n.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-[1600px] px-4 py-5">{children}</main>
    </div>
  );
}
