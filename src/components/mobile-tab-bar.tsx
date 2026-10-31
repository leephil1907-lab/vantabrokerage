'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

const ITEMS = [
  { href: '/', label: 'Home', icon: 'home' },
  { href: '/markets', label: 'Markets', icon: 'chart' },
  { href: '/trading/short-expiry', label: 'Trade', icon: 'bolt' },
  { href: '/accounts', label: 'Accounts', icon: 'shield' },
];

const ICONS: Record<string, React.ReactNode> = {
  home: <><path d="M3 8.4 10 3l7 5.4V17H3z" /><path d="M7.6 17v-4.6h4.8V17" /></>,
  chart: <><path d="M2.5 16.5V3.5M2.5 16.5h15" /><path d="M6 13 9 8.6l2.6 3.2L17 5.5" /></>,
  bolt: <path d="M11.5 2 4 11h4.6L8 18l7.6-9.2H11z" />,
  shield: <><path d="M10 2.5 16.5 5v5c0 4-2.7 7-6.5 8-3.8-1-6.5-4-6.5-8V5z" /><path d="M7.4 10.2 9.4 12l3-3.4" /></>,
  user: <><circle cx="10" cy="7" r="3.2" /><path d="M4 17.4c0-2.8 2.7-4.6 6-4.6s6 1.8 6 4.6" /></>,
};

/**
 * Mobile bottom navigation. The desktop chrome is not simply squashed — phones
 * get thumb-reachable primary destinations and the header collapses.
 */
export function MobileTabBar({ authenticated }: { authenticated: boolean }) {
  const pathname = usePathname();
  const items = authenticated ? [...ITEMS, { href: '/dashboard', label: 'Terminal', icon: 'user' }] : [...ITEMS, { href: '/login', label: 'Sign in', icon: 'user' }];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.08] bg-ink-950/92 backdrop-blur-xl md:hidden">
      <div className="grid grid-cols-5">
        {items.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className="relative flex flex-col items-center gap-1 py-2.5" aria-current={active ? 'page' : undefined}>
              {active && (
                <motion.span layoutId="mobile-tab" className="absolute inset-x-3 top-0 h-[2px] rounded-full bg-lime" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />
              )}
              <span className={active ? 'text-lime' : 'text-muted'}>
                <svg width="19" height="19" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  {ICONS[item.icon]}
                </svg>
              </span>
              <span className={`text-[10px] font-medium ${active ? 'text-white' : 'text-muted'}`}>{item.label}</span>
            </Link>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
