'use client';

import { useMemo, useState } from 'react';
import { listEmailTemplates, renderEmailTemplate } from '@/lib/email-templates';
import type { EmailTemplateKey } from '@/lib/email-templates';

const templates = listEmailTemplates();

export default function AdminEmailTemplatesPage() {
  const [selected, setSelected] = useState<EmailTemplateKey>('verify_email');
  const preview = useMemo(() => renderEmailTemplate(selected, {
    firstName: 'Alex',
    actionUrl: 'https://primevest.example/secure-action',
    amount: '250.00',
    asset: 'USDT',
    network: 'Ethereum ERC20',
    reference: 'PV-EXAMPLE-1042',
    reason: 'Example review note',
    txHash: '0x1234…abcd',
    ticket: 'PV-SUPPORT-1042',
  }), [selected]);
  const active = templates.find((item) => item.key === selected);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-white">Email templates</h1>
        <p className="mt-1 text-[12px] text-muted">Preview the branded transactional emails used by PRIMEVEST. Secure action links and tokens are never stored in the email outbox.</p>
      </div>
      <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
        <section className="panel p-3">
          <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Template library · {templates.length}</p>
          <div className="space-y-1">
            {templates.map((item) => (
              <button key={item.key} type="button" onClick={() => setSelected(item.key as EmailTemplateKey)}
                className={`w-full rounded-lg border px-3 py-2.5 text-left transition ${selected === item.key ? 'border-lime/30 bg-lime/[0.08]' : 'border-transparent hover:border-white/10 hover:bg-white/[0.03]'}`}>
                <span className={`block text-[12px] font-medium ${selected === item.key ? 'text-lime' : 'text-white'}`}>{item.key.replaceAll('_', ' ')}</span>
                <span className="mt-0.5 block text-[10px] text-muted">{item.subject}</span>
              </button>
            ))}
          </div>
        </section>
        <section className="panel min-w-0 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.07] px-4 py-3">
            <div>
              <p className="text-[12px] font-semibold capitalize text-white">{selected.replaceAll('_', ' ')}</p>
              <p className="mt-0.5 text-[10.5px] text-muted">{active?.preheader}</p>
            </div>
            <span className="rounded-md border border-emerald/20 bg-emerald/10 px-2 py-1 text-[10px] font-medium text-emerald">HTML + plain text</span>
          </div>
          <div className="bg-[#0c100c] p-2 sm:p-4">
            <iframe title={`Preview of ${selected} email`} srcDoc={preview.html} sandbox="" className="h-[760px] w-full rounded-lg border border-white/10 bg-[#0c100c]" />
          </div>
          <div className="border-t border-white/[0.07] px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Plain-text fallback</p>
            <pre className="mt-2 whitespace-pre-wrap break-words rounded-lg bg-ink-950 p-3 text-[11px] leading-relaxed text-muted">{preview.text}</pre>
          </div>
        </section>
      </div>
    </div>
  );
}
