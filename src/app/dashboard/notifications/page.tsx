'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Badge, EmptyState, apiFetch, useToast } from '@/components/ui';
import { relTime } from '@/lib/format';

type Notification = { id: string; type: string; title: string; body: string; href: string | null; read: boolean; createdAt: string };

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const { push } = useToast();

  const load = () => apiFetch<{ notifications: Notification[]; unread: number }>('/api/notifications')
    .then((b) => { setItems(b.notifications); setUnread(b.unread); })
    .catch(() => undefined);

  useEffect(() => { load(); }, []);

  const markAll = async () => {
    await apiFetch('/api/notifications', { method: 'POST', body: JSON.stringify({ all: true }) });
    load();
    push({ tone: 'success', title: 'All notifications marked read' });
  };

  const markOne = async (id: string) => {
    await apiFetch('/api/notifications', { method: 'POST', body: JSON.stringify({ id }) });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">Notifications</h1>
          <p className="mt-0.5 text-[12px] text-muted">{unread} unread · account, trade, deposit, withdrawal and security events.</p>
        </div>
        <button onClick={markAll} disabled={!unread} className="btn-ghost px-3 py-1.5 text-[12px]">Mark all read</button>
      </div>

      <div className="panel divide-y divide-white/[0.05]">
        {items.length === 0 ? <EmptyState title="No notifications" body="Account, trade and wallet events appear here." /> : items.map((n) => (
          <div key={n.id} className={`flex items-start gap-3 px-4 py-3 ${n.read ? '' : 'bg-lime/[0.03]'}`}>
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${n.read ? 'bg-white/15' : 'bg-lime'}`} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[12.5px] font-semibold text-white">{n.title}</p>
                <Badge tone="gray">{n.type}</Badge>
                <span className="text-[10.5px] text-muted">{relTime(n.createdAt)}</span>
              </div>
              <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted">{n.body}</p>
              <div className="mt-1.5 flex gap-3">
                {n.href && <Link href={n.href} className="text-[11px] text-lime hover:underline">Open</Link>}
                {!n.read && <button onClick={() => markOne(n.id)} className="text-[11px] text-muted hover:text-white">Mark read</button>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
