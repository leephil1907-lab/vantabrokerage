'use client';

import { ThemeToggle } from '@/components/theme-toggle';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Logo, PrimevestGlyph } from './brand';
import { Badge } from './ui';
import { PageTransition } from './motion/page-transition';
import { MotionIndicator } from './motion/primitives';
import { CommandPalette } from './command-palette';

const NAV: { group: string; items: { href: string; label: string; icon: string; badge?: string }[] }[] = [
  {
    group: 'Trade',
    items: [
      { href: '/dashboard', label: 'Overview', icon: 'grid' },
      { href: '/dashboard/forex', label: 'Forex & CFDs', icon: 'chart' },
      { href: '/dashboard/short-expiry', label: 'Short-Expiry', icon: 'clock' },
      { href: '/dashboard/crypto', label: 'Crypto Spot', icon: 'coins' },
      { href: '/dashboard/futures', label: 'Crypto Futures', icon: 'layers' },
      { href: '/dashboard/crypto-futures', label: 'Futures Pro', icon: 'bolt' },
      { href: '/dashboard/markets', label: 'Markets', icon: 'globe' },
    ],
  },
  {
    group: 'Portfolio',
    items: [
      { href: '/dashboard/positions', label: 'Open Positions', icon: 'activity' },
      { href: '/dashboard/orders', label: 'Orders', icon: 'list' },
      { href: '/dashboard/history', label: 'Trade History', icon: 'history' },
      { href: '/dashboard/portfolio', label: 'Portfolio', icon: 'pie' },
    ],
  },
  {
    group: 'Wallet',
    items: [
      { href: '/dashboard/wallet', label: 'Wallet', icon: 'wallet' },
      { href: '/dashboard/deposits', label: 'Deposits', icon: 'down' },
      { href: '/dashboard/withdrawals', label: 'Withdrawals', icon: 'up' },
      { href: '/dashboard/transactions', label: 'Transactions', icon: 'receipt' },
    ],
  },
  {
    group: 'Grow',
    items: [
      { href: '/dashboard/copy-trading', label: 'Copy Trading', icon: 'users' },
      { href: '/dashboard/referrals', label: 'Referrals', icon: 'share' },
      { href: '/dashboard/bonuses', label: 'Bonuses', icon: 'gift' },
    ],
  },
  {
    group: 'Account',
    items: [
      { href: '/dashboard/notifications', label: 'Notifications', icon: 'bell' },
      { href: '/dashboard/verification', label: 'Verification', icon: 'shield' },
      { href: '/dashboard/security', label: 'Security', icon: 'lock' },
      { href: '/dashboard/settings', label: 'Settings', icon: 'settings' },
      { href: '/dashboard/support', label: 'Support', icon: 'help' },
    ],
  },
];

function Icon({ name, className = 'h-4 w-4' }: { name: string; className?: string }) {
  const paths: Record<string, React.ReactNode> = {
    grid: <><rect x="2.5" y="2.5" width="5" height="5" rx="1" /><rect x="9.5" y="2.5" width="5" height="5" rx="1" /><rect x="2.5" y="9.5" width="5" height="5" rx="1" /><rect x="9.5" y="9.5" width="5" height="5" rx="1" /></>,
    chart: <><path d="M2 13V3M2 13h13" /><path d="M5 10.5 8 6l2.5 3L14 4.5" /></>,
    clock: <><circle cx="8.5" cy="8.5" r="6" /><path d="M8.5 5v4l2.5 1.5" /></>,
    coins: <><ellipse cx="8.5" cy="4.5" rx="5.5" ry="2.2" /><path d="M3 4.5v8c0 1.2 2.5 2.2 5.5 2.2s5.5-1 5.5-2.2v-8" /><path d="M3 8.5c0 1.2 2.5 2.2 5.5 2.2s5.5-1 5.5-2.2" /></>,
    layers: <><path d="M8.5 2 15 5.5 8.5 9 2 5.5z" /><path d="M2 9.5 8.5 13l6.5-3.5" /></>,
    globe: <><circle cx="8.5" cy="8.5" r="6" /><path d="M2.5 8.5h12M8.5 2.5c1.8 2 1.8 10 0 12-1.8-2-1.8-10 0-12z" /></>,
    activity: <path d="M1.5 8.5h3l2-5 3 9 2-4h3" />,
    list: <><path d="M5.5 4h9M5.5 8.5h9M5.5 13h9" /><circle cx="2.8" cy="4" r="0.9" /><circle cx="2.8" cy="8.5" r="0.9" /><circle cx="2.8" cy="13" r="0.9" /></>,
    history: <><path d="M2.5 8.5a6 6 0 1 0 2-4.5" /><path d="M2 3v3.5h3.5" /><path d="M8.5 5.5v3.5l2.5 1.5" /></>,
    pie: <><path d="M8.5 2.5a6 6 0 1 0 6 6h-6z" /><path d="M10.5 2.7a6 6 0 0 1 3.3 3.3h-3.3z" /></>,
    wallet: <><rect x="2" y="4" width="12.5" height="9" rx="2" /><path d="M11 8.5h3.5" /><circle cx="11.5" cy="8.5" r="0.9" /></>,
    down: <><path d="M8.5 2.5v9M5 8.5l3.5 3.5L12 8.5" /><path d="M2.5 14h12" /></>,
    up: <><path d="M8.5 13.5v-9M5 7.5l3.5-3.5L12 7.5" /><path d="M2.5 2h12" /></>,
    receipt: <><path d="M3.5 2.5h10v12l-2-1.3-2 1.3-2-1.3-2 1.3z" /><path d="M6 6h5M6 9h5" /></>,
    users: <><circle cx="6" cy="6" r="2.4" /><path d="M1.8 13.5c0-2.3 1.9-3.8 4.2-3.8s4.2 1.5 4.2 3.8" /><path d="M11 4.2a2.2 2.2 0 0 1 0 4.2M12.2 13.5c0-1.6-.7-2.7-1.8-3.3" /></>,
    share: <><circle cx="12" cy="3.5" r="2" /><circle cx="4" cy="8.5" r="2" /><circle cx="12" cy="13.5" r="2" /><path d="M5.8 7.6 10.2 4.4M5.8 9.4l4.4 3.2" /></>,
    gift: <><rect x="2.5" y="6.5" width="12" height="7.5" rx="1.5" /><path d="M1.5 6.5h14M8.5 6.5V14" /><path d="M8.5 6.5C6 6.5 4.8 5.6 4.8 4.2c0-.9.7-1.6 1.6-1.6 1.4 0 2.1 1.9 2.1 3.9zM8.5 6.5c2.5 0 3.7-.9 3.7-2.3 0-.9-.7-1.6-1.6-1.6-1.4 0-2.1 1.9-2.1 3.9z" /></>,
    bell: <><path d="M4 11.5V7a4.5 4.5 0 1 1 9 0v4.5l1.3 1.5H2.7z" /><path d="M6.8 13.2a1.8 1.8 0 0 0 3.4 0" /></>,
    shield: <><path d="M8.5 2 14 4v4.2c0 3.3-2.3 5.9-5.5 6.8-3.2-.9-5.5-3.5-5.5-6.8V4z" /><path d="M6.2 8.3 8 10l2.6-3" /></>,
    lock: <><rect x="3.5" y="7" width="10" height="7" rx="1.6" /><path d="M5.8 7V5.2a2.7 2.7 0 0 1 5.4 0V7" /></>,
    settings: <><circle cx="8.5" cy="8.5" r="2.3" /><path d="M8.5 1.8v1.6M8.5 13.6v1.6M2.4 8.5H4M13 8.5h1.6M4.2 4.2l1.1 1.1M11.7 11.7l1.1 1.1M12.8 4.2l-1.1 1.1M5.3 11.7l-1.1 1.1" /></>,
    help: <><circle cx="8.5" cy="8.5" r="6" /><path d="M6.6 6.4a1.9 1.9 0 1 1 2.8 1.7c-.6.3-.9.8-.9 1.4v.3" /><circle cx="8.5" cy="12" r="0.7" fill="currentColor" /></>,
    admin: <><path d="M8.5 2 14 4v4.2c0 3.3-2.3 5.9-5.5 6.8-3.2-.9-5.5-3.5-5.5-6.8V4z" /><path d="M6 8.5h5M8.5 6v5" /></>,
    bolt: <><path d="M9.6 1.8 3.4 9.6h3.6L6.6 15.2 13.4 7h-3.8z" /></>,
  };
  return (
    <svg viewBox="0 0 17 17" className={className} fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      {paths[name] ?? paths.grid}
    </svg>
  );
}

const MOBILE_TABS = [
  { href: '/dashboard', label: 'Home', icon: 'grid' },
  { href: '/dashboard/forex', label: 'Trade', icon: 'chart' },
  { href: '/dashboard/markets', label: 'Markets', icon: 'globe' },
  { href: '/dashboard/wallet', label: 'Wallet', icon: 'wallet' },
];

export function DashboardShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { email: string; role: string; name: string; emailVerified: boolean; kycStatus: string };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [signingOut, setSigningOut] = useState(false);
  const [palette, setPalette] = useState(false);

  useEffect(() => {
    setOpen(false);
    fetch('/api/notifications', { cache: 'no-store' })
      .then((r) => r.json())
      .then((b) => setUnread(b.unread ?? 0))
      .catch(() => undefined);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPalette((p) => !p);
      }
      if (e.key === 'Escape') setPalette(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const signOut = async () => {
    setSigningOut(true);
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    router.push('/');
    router.refresh();
  };

  const isStaff = ['ADMIN', 'SUPERADMIN', 'SUPPORT', 'FINANCE'].includes(user.role);
  const activeItem = useMemo(() => NAV.flatMap((g) => g.items).find((i) => i.href === pathname), [pathname]);

  return (
    <div className="flex min-h-screen">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[250px] shrink-0 overflow-y-auto border-r border-white/[0.07] bg-ink-950/95 backdrop-blur-xl transition-transform duration-300 ease-premium lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/[0.07] px-4">
          <Logo />
          <button className="rounded-md p-1.5 text-muted lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </button>
        </div>
        <nav className="px-2 py-3">
          {NAV.map((g) => (
            <div key={g.group} className="mb-3">
              <p className="px-2 pb-1 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-muted/70">{g.group}</p>
              {g.items.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative mb-0.5 flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[12.5px] font-medium transition-colors ${
                      active ? 'text-lime' : 'text-muted hover:bg-white/[0.04] hover:text-white'
                    }`}
                  >
                    {active && <MotionIndicator layoutId="sidebar-active" className="absolute inset-0 -z-10 rounded-lg bg-lime/10" />}
                    <Icon name={item.icon} className={`h-[15px] w-[15px] ${active ? 'text-lime' : ''}`} />
                    {item.label}
                    {item.href === '/dashboard/notifications' && unread > 0 && (
                      <span className="ml-auto rounded-full bg-danger px-1.5 py-0.5 text-[9px] font-bold text-white">{unread}</span>
                    )}
                    {item.href === '/dashboard/verification' && user.kycStatus !== 'APPROVED' && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-siren" />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
          {isStaff && (
            <div className="mb-3">
              <p className="px-2 pb-1 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-muted/70">Staff</p>
              <Link
                href="/admin"
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[12.5px] font-medium transition-colors ${
                  pathname.startsWith('/admin') ? 'bg-lime/10 text-lime' : 'text-muted hover:bg-white/[0.04] hover:text-white'
                }`}
              >
                <Icon name="admin" className="h-[15px] w-[15px]" />
                Admin console
                <span className="ml-auto rounded bg-lime/15 px-1.5 py-0.5 text-[9px] font-bold text-lime">{user.role === 'SUPERADMIN' ? 'ROOT' : user.role}</span>
              </Link>
            </div>
          )}
        </nav>
        <div className="mx-2 mb-4 rounded-xl border border-white/[0.07] bg-ink-900/80 p-3">
          <p className="truncate text-[12px] font-semibold text-white">{user.name}</p>
          <p className="truncate text-[10.5px] text-muted">{user.email}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {!user.emailVerified && <Badge tone="amber">email unverified</Badge>}
            {user.kycStatus !== 'APPROVED' && <Badge tone="gray">kyc {user.kycStatus.toLowerCase().replace('_', ' ')}</Badge>}
          </div>
          <button onClick={signOut} disabled={signingOut} className="mt-2.5 w-full rounded-lg border border-white/10 py-1.5 text-[11.5px] font-medium text-muted transition hover:border-danger/40 hover:text-danger">
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </aside>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-ink-950/70 lg:hidden"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-white/[0.07] bg-ink-950/80 px-4 backdrop-blur-xl lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button className="rounded-lg border border-white/10 p-2 text-muted lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2 5h12M2 11h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            </button>
            <div className="hidden items-center gap-2 text-[12px] text-muted sm:flex">
              <span className="text-white/50">Workspace</span><span className="text-white/20">/</span><span className="font-medium text-white">{activeItem?.label ?? 'Dashboard'}</span>
            </div>
            <div className="min-w-0 sm:hidden">
              <p className="truncate text-[13px] font-semibold text-white">{activeItem?.label ?? 'Dashboard'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setPalette(true)}
              className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-2.5 py-1.5 text-[11.5px] text-muted transition-colors hover:border-white/20 hover:text-white md:flex"
              aria-label="Open command palette"
            >
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4.2" stroke="currentColor" strokeWidth="1.3" /><path d="M9.2 9.2 12 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
              Search
              <kbd className="rounded border border-white/10 px-1 py-[1px] font-mono text-[9.5px]">⌘K</kbd>
            </button>
            <Link href="/dashboard/notifications" className="relative rounded-lg border border-white/10 p-2 text-muted transition-colors hover:text-white" aria-label="Notifications">
              <Icon name="bell" className="h-4 w-4" />
              {unread > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold text-white">{unread}</span>}
            </Link>
            <Link href="/dashboard/wallet" className="btn-ghost px-3 py-1.5 text-[12px]">Wallet</Link>
            <Link href="/dashboard/forex" className="btn-primary px-3.5 py-1.5 text-[12px]">Trade</Link>
          </div>
        </header>
        <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 px-4 pb-[76px] pt-5 lg:px-6 lg:pb-6 lg:pt-6">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>

      {/* ── Mobile tab bar ──────────────────────────────────────────────── */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.08] bg-ink-950/95 backdrop-blur-xl lg:hidden">
        <div className="grid grid-cols-5">
          {MOBILE_TABS.map((t) => {
            const active = pathname === t.href;
            return (
              <Link key={t.href} href={t.href} className="relative flex flex-col items-center gap-1 py-2.5">
                {active && <motion.span layoutId="dash-mobile-tab" className="absolute inset-x-3 top-0 h-[2px] rounded-full bg-lime" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                <span className={active ? 'text-lime' : 'text-muted'}><Icon name={t.icon} className="h-[18px] w-[18px]" /></span>
                <span className={`text-[10px] font-medium ${active ? 'text-white' : 'text-muted'}`}>{t.label}</span>
              </Link>
            );
          })}
          <button onClick={() => setOpen(true)} className="flex flex-col items-center gap-1 py-2.5" aria-label="More">
            <span className="text-muted"><Icon name="list" className="h-[18px] w-[18px]" /></span>
            <span className="text-[10px] font-medium text-muted">More</span>
          </button>
        </div>
      </nav>

      <CommandPalette open={palette} onClose={() => setPalette(false)} isStaff={isStaff} />
      {reduce && <span className="sr-only">Reduced motion enabled.</span>}
    </div>
  );
}

export { Icon };
