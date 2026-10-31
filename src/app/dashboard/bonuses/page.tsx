'use client';

import { useEffect, useState } from 'react';
import { Badge, EmptyState, apiFetch } from '@/components/ui';
import { fmtMoney } from '@/lib/format';

type Bonus = { id: string; code: string; amount: number; turnoverRequired: number; turnoverDone: number; status: string; expiresAt: string | null; createdAt: string };

export default function BonusesPage() {
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [campaigns, setCampaigns] = useState<{ key: string; value: unknown }[]>([]);

  useEffect(() => {
    apiFetch<{ bonuses: Bonus[]; campaigns: { key: string; value: unknown }[] }>('/api/bonuses')
      .then((b) => { setBonuses(b.bonuses); setCampaigns(b.campaigns); })
      .catch(() => undefined);
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-white">Bonuses</h1>
        <p className="mt-0.5 text-[12px] text-muted">Promotional credit is tracked separately from deposits, with turnover requirements before withdrawal eligibility.</p>
      </div>

      {bonuses.length === 0 ? (
        <div className="panel">
          <EmptyState
            title="No active bonuses"
            body={campaigns.length ? 'Your account has no bonus credit assigned. Active platform campaigns are listed in your notifications when they apply to you.' : 'There are no bonus campaigns configured for this deployment.'}
          />
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {bonuses.map((b) => {
            const progress = b.turnoverRequired > 0 ? (b.turnoverDone / b.turnoverRequired) * 100 : 100;
            return (
              <div key={b.id} className="panel p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-semibold text-white">{b.code}</p>
                  <Badge tone={b.status === 'ACTIVE' ? 'lime' : 'gray'}>{b.status}</Badge>
                </div>
                <p className="value-mono mt-1.5 text-[18px] font-semibold text-lime">{fmtMoney(b.amount)}</p>
                <div className="mt-3">
                  <div className="flex justify-between text-[10.5px] text-muted"><span>Turnover</span><span className="value-mono">{fmtMoney(b.turnoverDone)} / {fmtMoney(b.turnoverRequired)}</span></div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-lime" style={{ width: `${Math.min(100, progress)}%` }} /></div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
