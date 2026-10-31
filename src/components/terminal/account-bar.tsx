'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui';
import { fmtMoney } from '@/lib/format';

export type AccountOption = { id: string; type: 'LIVE' | 'PAPER'; available: number; locked: number; currency: string };

/** Account switcher shared by every terminal. Persists the selection locally. */
export function useAccount({ liveOnly = false }: { liveOnly?: boolean } = {}) {
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [accountId, setAccountId] = useState<string>('');
  const [liveEnabled, setLiveEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/accounts', { cache: 'no-store' })
      .then((r) => r.json())
      .then((b) => {
        if (cancelled || !b.accounts) return;
        const visibleAccounts = liveOnly ? b.accounts.filter((a: AccountOption) => a.type === 'LIVE') : b.accounts;
        setAccounts(visibleAccounts);
        setLiveEnabled(!!b.liveExecutionEnabled);
        const stored = typeof window !== 'undefined' ? window.localStorage.getItem('vanta.accountId') : null;
        const fromStore = visibleAccounts.find((a: AccountOption) => a.id === stored);
        const fallback = visibleAccounts.find((a: AccountOption) => a.type === (liveOnly ? 'LIVE' : 'PAPER')) ?? visibleAccounts[0];
        setAccountId((fromStore ?? fallback)?.id ?? '');
      })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [liveOnly]);

  const select = (id: string) => {
    setAccountId(id);
    if (typeof window !== 'undefined') window.localStorage.setItem('vanta.accountId', id);
  };

  const active = accounts.find((a) => a.id === accountId) ?? null;
  return { accounts, accountId, select, active, liveEnabled, loading, reloadAccounts: () => {
    fetch('/api/accounts', { cache: 'no-store' }).then((r) => r.json()).then((b) => b.accounts && setAccounts(liveOnly ? b.accounts.filter((a: AccountOption) => a.type === 'LIVE') : b.accounts)).catch(() => undefined);
  } };
}

export function AccountSwitcher({
  accounts,
  accountId,
  onSelect,
  active,
  liveEnabled,
}: {
  accounts: AccountOption[];
  accountId: string;
  onSelect: (id: string) => void;
  active: AccountOption | null;
  liveEnabled: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-0.5 rounded-lg border border-white/10 bg-ink-900 p-0.5">
        {accounts.map((a) => (
          <button
            key={a.id}
            onClick={() => onSelect(a.id)}
            className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${accountId === a.id ? 'bg-white/10 text-white' : 'text-muted hover:text-white'}`}
          >
            {a.type}
          </button>
        ))}
      </div>
      {active && (
        <span className="value-mono rounded-lg border border-white/[0.07] bg-ink-900 px-2.5 py-1.5 text-[11.5px] text-white">
          {fmtMoney(active.available)} <span className="text-muted">available</span>
        </span>
      )}
      {active?.type === 'PAPER' && <Badge tone="blue">simulated funds</Badge>}
      {active?.type === 'LIVE' && !liveEnabled && <Badge tone="amber">live execution not connected</Badge>}
    </div>
  );
}
