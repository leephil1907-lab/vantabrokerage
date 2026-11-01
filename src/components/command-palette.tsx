'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AssetMark } from './asset-mark';

type Entry = { label: string; href: string; group: string; hint?: string };

const PAGES: Entry[] = [
  { label: 'Overview', href: '/dashboard', group: 'Navigate' },
  { label: 'Live Trading', href: '/dashboard/live-trading', group: 'Navigate' },
  { label: 'Demo Trading', href: '/dashboard/demo-trading', group: 'Navigate' },
  { label: 'All Markets', href: '/dashboard/trade', group: 'Navigate' },
  { label: 'Forex & CFDs terminal', href: '/dashboard/forex', group: 'Navigate' },
  { label: 'Short-expiry terminal', href: '/dashboard/short-expiry', group: 'Navigate' },
  { label: 'Crypto spot terminal', href: '/dashboard/crypto', group: 'Navigate' },
  { label: 'Crypto futures terminal', href: '/dashboard/futures', group: 'Navigate' },
  { label: 'Futures Pro terminal', href: '/dashboard/crypto-futures', group: 'Navigate' },
  { label: 'Open positions', href: '/dashboard/positions', group: 'Portfolio' },
  { label: 'Orders', href: '/dashboard/orders', group: 'Portfolio' },
  { label: 'Trade history', href: '/dashboard/history', group: 'Portfolio' },
  { label: 'Portfolio allocation', href: '/dashboard/portfolio', group: 'Portfolio' },
  { label: 'Wallet', href: '/dashboard/wallet', group: 'Wallet' },
  { label: 'Deposit', href: '/dashboard/deposits', group: 'Wallet' },
  { label: 'Withdraw', href: '/dashboard/withdrawals', group: 'Wallet' },
  { label: 'Transactions', href: '/dashboard/transactions', group: 'Wallet' },
  { label: 'Copy trading', href: '/dashboard/copy-trading', group: 'Grow' },
  { label: 'Referrals', href: '/dashboard/referrals', group: 'Grow' },
  { label: 'Bonuses', href: '/dashboard/bonuses', group: 'Grow' },
  { label: 'Verification (KYC)', href: '/dashboard/verification', group: 'Account' },
  { label: 'Security & 2FA', href: '/dashboard/security', group: 'Account' },
  { label: 'Settings', href: '/dashboard/settings', group: 'Account' },
  { label: 'Support', href: '/dashboard/support', group: 'Account' },
];

/**
 * ⌘K command palette. Searches dashboard destinations and live instruments;
 * instrument results jump straight into the relevant desk with ?symbol= set.
 */
export function CommandPalette({ open, onClose, isStaff }: { open: boolean; onClose: () => void; isStaff: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const [markets, setMarkets] = useState<{ symbol: string; category: string }[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) { setQuery(''); setIndex(0); return; }
    setTimeout(() => inputRef.current?.focus(), 30);
    fetch('/api/markets', { cache: 'no-store' })
      .then((r) => r.json())
      .then((b) => setMarkets((b.markets ?? []).map((m: { symbol: string; category: string }) => ({ symbol: m.symbol, category: m.category }))))
      .catch(() => undefined);
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pages = [...PAGES, ...(isStaff ? [{ label: 'Admin console', href: '/admin', group: 'Staff' }] : [])]
      .filter((p) => !q || p.label.toLowerCase().includes(q))
      .slice(0, q ? 6 : 8);
    const deskFor = (category: string) =>
      category === 'SPOT' ? '/dashboard/crypto' : category === 'FUTURES' ? '/dashboard/futures' : category === 'BINARY' ? '/dashboard/short-expiry' : '/dashboard/forex';
    const instruments = q
      ? markets.filter((m) => m.symbol.toLowerCase().includes(q)).slice(0, 6).map((m) => ({ label: m.symbol, href: `${deskFor(m.category)}?symbol=${encodeURIComponent(m.symbol)}`, group: 'Instruments', hint: m.category }))
      : [];
    return [...instruments, ...pages];
  }, [query, markets, isStaff]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setIndex((i) => Math.min(results.length - 1, i + 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setIndex((i) => Math.max(0, i - 1)); }
      if (e.key === 'Enter' && results[index]) { e.preventDefault(); go(results[index].href); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, results, index]);

  const go = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[90] flex items-start justify-center bg-ink-950/70 px-4 pt-[12vh] backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.99 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-ink-900/95 shadow-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
          >
            <div className="flex items-center gap-2.5 border-b border-white/[0.07] px-4 py-3">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-muted"><circle cx="6" cy="6" r="4.2" stroke="currentColor" strokeWidth="1.3" /><path d="M9.2 9.2 12 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setIndex(0); }}
                placeholder="Jump to a page or an instrument…"
                className="w-full bg-transparent text-[13.5px] text-white placeholder:text-muted/70 outline-none"
              />
              <kbd className="rounded border border-white/10 px-1.5 py-0.5 font-mono text-[9.5px] text-muted">esc</kbd>
            </div>
            <div className="max-h-[52vh] overflow-y-auto scroll-thin p-1.5">
              {results.length === 0 && <p className="px-3 py-6 text-center text-[12px] text-muted">No matches for “{query}”.</p>}
              {results.map((r, i) => (
                <button
                  key={`${r.group}-${r.href}-${r.label}`}
                  onMouseEnter={() => setIndex(i)}
                  onClick={() => go(r.href)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors ${i === index ? 'bg-white/[0.07]' : 'hover:bg-white/[0.04]'}`}
                >
                  {r.group === 'Instruments' ? <AssetMark symbol={r.label} size={18} /> : (
                    <span className="flex h-[18px] w-[18px] items-center justify-center rounded-md border border-white/10 text-[9px] text-muted">{r.group.slice(0, 1)}</span>
                  )}
                  <span className="flex-1 truncate text-[12.5px] text-white">{r.label}</span>
                  <span className="text-[10px] uppercase tracking-[0.1em] text-muted">{r.hint ?? r.group}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-white/[0.07] px-4 py-2 text-[10px] text-muted">
              <span>↑↓ to navigate · ↵ to open</span>
              <span>{results.length} results</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
