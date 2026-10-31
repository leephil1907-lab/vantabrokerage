import Link from 'next/link';
import type { ReactNode } from 'react';

export function PageHero({ eyebrow, title, body, children }: { eyebrow: string; title: string; body: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden border-b border-white/[0.07]">
      <div className="pointer-events-none absolute inset-0 grid-faint opacity-60" />
      <div className="relative mx-auto max-w-7xl px-5 py-14">
        <p className="label">{eyebrow}</p>
        <h1 className="mt-3 max-w-3xl text-[32px] font-semibold leading-tight tracking-[-0.015em] text-white sm:text-[42px]">{title}</h1>
        <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-muted">{body}</p>
        {children && <div className="mt-6">{children}</div>}
      </div>
    </section>
  );
}

export function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-5 py-14">
      <div className="space-y-4 text-[13.5px] leading-relaxed text-muted [&_h2]:mt-8 [&_h2]:text-[17px] [&_h2]:font-semibold [&_h2]:text-white [&_h3]:mt-6 [&_h3]:text-[14px] [&_h3]:font-semibold [&_h3]:text-white [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-white">
        {children}
      </div>
    </div>
  );
}

export function FeatureGrid({ items, cols = 3 }: { items: { title: string; body: string; tag?: string }[]; cols?: 2 | 3 }) {
  return (
    <div className={`grid gap-4 ${cols === 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2'}`}>
      {items.map((i) => (
        <div key={i.title} className="panel p-5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[13.5px] font-semibold text-white">{i.title}</h3>
            {i.tag && <span className="chip shrink-0">{i.tag}</span>}
          </div>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{i.body}</p>
        </div>
      ))}
    </div>
  );
}

export function Section({ eyebrow, title, body, children, tight }: { eyebrow?: string; title: string; body?: string; children?: ReactNode; tight?: boolean }) {
  return (
    <section className={`mx-auto max-w-7xl px-5 ${tight ? 'py-10' : 'py-14'}`}>
      {eyebrow && <p className="label">{eyebrow}</p>}
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">{title}</h2>
      {body && <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-muted">{body}</p>}
      {children && <div className="mt-6">{children}</div>}
    </section>
  );
}

export function CTASection({ title, body, primary, secondary }: { title: string; body: string; primary: { href: string; label: string }; secondary?: { href: string; label: string } }) {
  return (
    <section className="mx-auto max-w-7xl px-5 pb-16">
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-ink-850 p-9 text-center">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_220px_at_50%_-30%,rgba(200,247,81,0.15),transparent)]" />
        <h2 className="relative text-2xl font-semibold tracking-tight text-white">{title}</h2>
        <p className="relative mx-auto mt-2.5 max-w-xl text-[13.5px] leading-relaxed text-muted">{body}</p>
        <div className="relative mt-5 flex flex-wrap justify-center gap-3">
          <Link href={primary.href} className="btn-primary px-5 py-2.5 text-[13.5px]">{primary.label}</Link>
          {secondary && <Link href={secondary.href} className="btn-ghost px-5 py-2.5 text-[13.5px]">{secondary.label}</Link>}
        </div>
      </div>
    </section>
  );
}
