import Link from 'next/link';
import type { ReactNode } from 'react';
import { Reveal } from '@/components/motion/primitives';
import { AssetMark } from '@/components/asset-mark';

/* ────────────────────────────────────────────────────────────────────────────
   Shared marketing page kit.

   Every public route composes these primitives, so spacing, type scale,
   hairline borders, reveal timing and CTA styling are identical across the
   site. Nothing here fetches: pages stay server components and only the small
   interactive leaves (accordion, tables, charts) are client components.
   ──────────────────────────────────────────────────────────────────────────── */

export function Breadcrumbs({ items }: { items: { href?: string; label: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[11px] text-muted">
      <Link href="/" className="transition-colors hover:text-white">Home</Link>
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5">
          <span className="text-white/20">/</span>
          {i.href ? <Link href={i.href} className="transition-colors hover:text-white">{i.label}</Link> : <span className="text-white/70">{i.label}</span>}
        </span>
      ))}
    </nav>
  );
}

export function PageHero({
  eyebrow,
  title,
  body,
  breadcrumbs,
  children,
  aside,
  symbol,
  badge,
}: {
  eyebrow: string;
  title: string;
  body: string;
  breadcrumbs?: { href?: string; label: string }[];
  children?: ReactNode;
  aside?: ReactNode;
  symbol?: string;
  badge?: string;
}) {
  return (
    <section className="relative overflow-hidden border-b border-white/[0.07]">
      <div className="pointer-events-none absolute inset-0 grid-lines opacity-60" />
      <div className="pointer-events-none absolute -right-32 -top-24 h-[380px] w-[380px] rounded-full bg-lime/[0.06] blur-[110px]" />
      <div className="pointer-events-none absolute -left-20 top-40 h-[260px] w-[260px] rounded-full bg-emerald/[0.05] blur-[100px]" />
      <div className={`shell relative grid gap-8 pb-12 pt-8 lg:pt-10 ${aside ? 'lg:grid-cols-[1.15fr_0.85fr] lg:items-end' : ''}`}>
        <div>
          {breadcrumbs && <div className="mb-5"><Breadcrumbs items={breadcrumbs} /></div>}
          <Reveal>
            <p className="eyebrow flex items-center gap-2">
              {symbol && <AssetMark symbol={symbol} size={18} />}
              {eyebrow}
              {badge && <span className="chip ml-1 normal-case tracking-normal">{badge}</span>}
            </p>
          </Reveal>
          <Reveal delay={0.04}>
            <h1 className="display mt-3 max-w-2xl text-[30px] leading-[1.08] sm:text-[40px]">{title}</h1>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mt-4 max-w-xl text-[13.5px] leading-relaxed text-muted">{body}</p>
          </Reveal>
          {children && <Reveal delay={0.12}><div className="mt-6">{children}</div></Reveal>}
        </div>
        {aside && <Reveal delay={0.1} className="min-w-0 lg:pb-1">{aside}</Reveal>}
      </div>
    </section>
  );
}

/** Spec strip: four short facts under a hero (numbers already verified by data). */
export function StatBand({ items }: { items: { k: string; label: string; sub?: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      {items.map((i) => (
        <div key={i.label} className="rounded-xl border border-white/[0.07] bg-ink-850/60 px-3.5 py-3">
          <p className="value-mono text-[18px] font-semibold leading-none text-white">{i.k}</p>
          <p className="mt-1.5 text-[11px] font-medium text-white/80">{i.label}</p>
          {i.sub && <p className="mt-0.5 text-[10px] leading-snug text-muted">{i.sub}</p>}
        </div>
      ))}
    </div>
  );
}

export function Section({
  eyebrow,
  title,
  body,
  children,
  tight,
  aside,
  id,
  divider = true,
}: {
  eyebrow?: string;
  title?: string;
  body?: string;
  children?: ReactNode;
  tight?: boolean;
  aside?: ReactNode;
  id?: string;
  divider?: boolean;
}) {
  return (
    <section id={id} className={`shell min-w-0 ${tight ? 'py-10' : 'py-14'} ${divider ? 'border-b border-white/[0.05] last:border-0' : ''}`}>
      {(title || eyebrow) && (
        <Reveal className={`flex flex-wrap items-end justify-between gap-4 ${children ? 'mb-6' : ''}`}>
          <div>
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            {title && <h2 className={`display ${eyebrow ? 'mt-2' : ''} text-[22px] sm:text-[27px]`}>{title}</h2>}
            {body && <p className="mt-2.5 max-w-2xl text-[13px] leading-relaxed text-muted">{body}</p>}
          </div>
          {aside}
        </Reveal>
      )}
      {children}
    </section>
  );
}

export function FeatureGrid({ items, cols = 3 }: { items: { title: string; body: string; tag?: string; symbol?: string }[]; cols?: 2 | 3 }) {
  return (
    <div className={`grid gap-3.5 ${cols === 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2'}`}>
      {items.map((i, idx) => (
        <Reveal key={i.title} delay={idx * 0.035}>
          <div className="group h-full rounded-2xl border border-white/[0.07] bg-ink-850/70 p-4 transition-colors duration-300 hover:border-white/15">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                {i.symbol && <AssetMark symbol={i.symbol} size={20} />}
                <h3 className="text-[13px] font-semibold text-white">{i.title}</h3>
              </div>
              {i.tag && <span className="chip shrink-0">{i.tag}</span>}
            </div>
            <p className="mt-1.5 text-[12px] leading-relaxed text-muted">{i.body}</p>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

/** Two-column explanatory block: narrative left, cards/table right. */
export function Split({ left, right, flip }: { left: ReactNode; right: ReactNode; flip?: boolean }) {
  return (
    // `min-w-0` matters: grid children default to min-width:auto, which lets a
    // wide table inside `overflow-x-auto` blow out the mobile viewport.
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <Reveal className={`min-w-0 ${flip ? 'lg:order-2' : ''}`}>{left}</Reveal>
      <Reveal delay={0.06} className={`min-w-0 ${flip ? 'lg:order-1' : ''}`}>{right}</Reveal>
    </div>
  );
}

export function Callout({ tone = 'info', title, children }: { tone?: 'info' | 'warn' | 'ok'; title?: string; children: ReactNode }) {
  const tones = {
    info: 'border-sky-400/25 bg-sky-400/[0.07] text-sky-200',
    warn: 'border-siren/25 bg-siren/[0.07] text-siren',
    ok: 'border-emerald/25 bg-emerald/[0.07] text-emerald',
  } as const;
  return (
    <div className={`rounded-xl border px-4 py-3 text-[12px] leading-relaxed ${tones[tone]}`}>
      {title && <p className="mb-1 font-semibold">{title}</p>}
      {children}
    </div>
  );
}

/** Specification table used by trading-condition and desk pages. */
export function SpecTable({
  columns,
  rows,
  caption,
}: {
  columns: string[];
  rows: (string | number | ReactNode)[][];
  caption?: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.07]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px]">
          <thead className="bg-white/[0.02]">
            <tr>{columns.map((c, i) => <th key={c} className={`th ${i > 0 ? 'text-right' : ''}`}>{c}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((r, ri) => (
              <tr key={ri} className="table-row">
                {r.map((cell, ci) => (
                  <td key={ci} className={`td ${ci > 0 ? 'text-right value-mono' : ''}`}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {caption && <p className="border-t border-white/[0.06] px-4 py-2.5 text-[10.5px] text-muted">{caption}</p>}
    </div>
  );
}

export function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="shell max-w-3xl py-12">
      <div className="space-y-4 text-[13px] leading-relaxed text-muted [&_h2]:mt-8 [&_h2]:text-[16px] [&_h2]:font-semibold [&_h2]:text-white [&_h3]:mt-6 [&_h3]:text-[13.5px] [&_h3]:font-semibold [&_h3]:text-white [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-white/90">
        {children}
      </div>
    </div>
  );
}

export function CTASection({
  title,
  body,
  primary,
  secondary,
  footnote,
}: {
  title: string;
  body: string;
  primary: { href: string; label: string };
  secondary?: { href: string; label: string };
  footnote?: string;
}) {
  return (
    <section className="shell pb-16 pt-4">
      <Reveal className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-b from-ink-800 to-ink-900 p-8 text-center sm:p-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_220px_at_50%_-30%,rgba(200,247,81,0.15),transparent)]" />
        <div className="pointer-events-none absolute inset-0 grid-lines opacity-30" />
        <h2 className="display relative text-[22px] sm:text-[28px]">{title}</h2>
        <p className="relative mx-auto mt-2.5 max-w-xl text-[13px] leading-relaxed text-muted">{body}</p>
        <div className="relative mt-5 flex flex-wrap justify-center gap-3">
          <Link href={primary.href} className="btn-primary px-5 py-2.5 text-[13px]">{primary.label}</Link>
          {secondary && <Link href={secondary.href} className="btn-ghost px-5 py-2.5 text-[13px]">{secondary.label}</Link>}
        </div>
        <p className="relative mt-4 text-[10.5px] text-muted">{footnote ?? 'Leveraged and derivative products carry a high risk of loss. Simulated results do not reflect live performance.'}</p>
      </Reveal>
    </section>
  );
}
