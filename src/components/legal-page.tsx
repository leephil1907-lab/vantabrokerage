import Link from 'next/link';
import type { ReactNode } from 'react';
import { Reveal } from '@/components/motion/primitives';

/**
 * Legal document layout — the standard shape for regulatory pages: breadcrumb,
 * document title, version/effective date, a sticky table of contents on desktop
 * and a readable measure on every screen.
 */
export type LegalSection = { id: string; title: string; body: ReactNode };

export function LegalPage({
  title,
  summary,
  updated,
  version = '1.0',
  breadcrumb,
  sections,
  contactHref = '/contact',
}: {
  title: string;
  summary: string;
  updated: string;
  version?: string;
  breadcrumb: string;
  sections: LegalSection[];
  contactHref?: string;
}) {
  return (
    <>
      <section className="relative overflow-hidden border-b border-white/[0.07]">
        <div className="pointer-events-none absolute inset-0 grid-lines opacity-50" />
        <div className="shell relative pb-10 pt-8">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[11px] text-muted">
            <Link href="/" className="transition-colors hover:text-white">Home</Link>
            <span className="text-white/20">/</span>
            <span>Legal</span>
            <span className="text-white/20">/</span>
            <span className="text-white/70">{breadcrumb}</span>
          </nav>
          <Reveal>
            <h1 className="display mt-4 max-w-2xl text-[28px] leading-tight sm:text-[36px]">{title}</h1>
          </Reveal>
          <Reveal delay={0.05}>
            <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-muted">{summary}</p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mt-5 flex flex-wrap items-center gap-2 text-[10.5px] text-muted">
              <span className="chip">Version {version}</span>
              <span className="chip">Effective {updated}</span>
              <span className="chip">{sections.length} sections</span>
            </div>
          </Reveal>
        </div>
      </section>

      <div className="shell grid gap-10 py-12 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <p className="label mb-2.5">On this page</p>
            <nav className="space-y-0.5">
              {sections.map((s) => (
                <a key={s.id} href={`#${s.id}`} className="block rounded-md px-2 py-1.5 text-[11.5px] leading-snug text-muted transition-colors hover:bg-white/[0.04] hover:text-white">
                  {s.title}
                </a>
              ))}
            </nav>
            <div className="mt-5 rounded-xl border border-white/[0.07] bg-ink-850/60 p-3">
              <p className="text-[10.5px] leading-relaxed text-muted">
                Questions about this document? Open a support ticket from your dashboard or use the <Link href={contactHref} className="text-lime hover:underline">contact</Link> page.
              </p>
            </div>
          </div>
        </aside>

        <article className="max-w-2xl space-y-8">
          {sections.map((s, i) => (
            <Reveal key={s.id} delay={Math.min(i * 0.02, 0.1)}>
              <section id={s.id} className="scroll-mt-24">
                <h2 className="text-[15px] font-semibold text-white">
                  <span className="mr-2 text-[12px] font-normal text-lime/70">{String(i + 1).padStart(2, '0')}</span>
                  {s.title}
                </h2>
                <div className="mt-2 space-y-3 text-[12.5px] leading-relaxed text-muted [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-white/90 [&_a]:text-lime [&_a]:hover:underline">
                  {s.body}
                </div>
              </section>
            </Reveal>
          ))}
          <div className="rounded-xl border border-white/[0.07] bg-ink-850/60 px-4 py-3 text-[11px] leading-relaxed text-muted">
            This information reflects the platform as currently configured.
          </div>
        </article>
      </div>
    </>
  );
}
