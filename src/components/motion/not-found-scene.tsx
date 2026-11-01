'use client';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Magnetic, MaskLine } from '@/components/motion/primitives';
import { ShaderHero } from '@/components/three/shader-hero';
import { Logo } from '@/components/brand';

/**
 * The 404 scene: a crashed candlestick chart draws itself in gold over the
 * live shader mesh, the error code rises through a line mask, and every exit
 * is a magnetic, meaningful click — including one that opens live support.
 */
const QUICK = [
  { href: '/markets', label: 'Market overview' },
  { href: '/markets/screener', label: 'Global screener' },
  { href: '/trading/forex', label: 'Forex desk' },
  { href: '/help', label: 'Help centre' },
  { href: '/trading-conditions', label: 'Trading conditions' },
];

function CrashedChart() {
  const reduce = useReducedMotion();
  return (
    <svg viewBox="0 0 520 220" className="h-auto w-full max-w-[560px]" aria-hidden>
      <defs>
        <linearGradient id="crash-gold" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#b8924a" />
          <stop offset="60%" stopColor="#dfc088" />
          <stop offset="100%" stopColor="#ff5b6e" />
        </linearGradient>
      </defs>
      {/* grid */}
      {[40, 80, 120, 160, 200].map((y) => (
        <line key={y} x1="0" y1={y} x2="520" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      ))}
      {/* the rally… */}
      <motion.path
        d="M10 190 L60 168 L96 176 L140 128 L178 140 L226 92 L268 104 L308 62"
        fill="none" stroke="url(#crash-gold)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        initial={reduce ? undefined : { pathLength: 0 }}
        whileInView={reduce ? undefined : { pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
      />
      {/* …and the gap down into the void */}
      <motion.path
        d="M308 62 L318 66 L330 150 L352 158 L372 196 L420 205 L510 212"
        fill="none" stroke="#ff5b6e" strokeWidth="2.5" strokeDasharray="6 7" strokeLinecap="round"
        initial={reduce ? undefined : { pathLength: 0, opacity: 0 }}
        whileInView={reduce ? undefined : { pathLength: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, delay: 1.5, ease: [0.22, 1, 0.36, 1] }}
      />
      {/* candles along the rally */}
      {[[60, 158, 178], [140, 118, 148], [226, 82, 112], [308, 52, 82]].map(([x, y1, y2], i) => (
        <motion.g
          key={x}
          initial={reduce ? undefined : { opacity: 0, scaleY: 0.4 }}
          whileInView={reduce ? undefined : { opacity: 1, scaleY: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.35 + i * 0.3, duration: 0.4 }}
          style={{ originX: '0px', originY: `${y2}px` }}
        >
          <line x1={x} y1={y1 - 10} x2={x} y2={y2 + 10} stroke="#2ee6a8" strokeWidth="1.4" />
          <rect x={x - 5} y={y1} width="10" height={y2 - y1} rx="1.5" fill="#2ee6a8" opacity="0.85" />
        </motion.g>
      ))}
      {/* the missing candle: an outlined ghost at the cliff edge */}
      <motion.g
        initial={reduce ? undefined : { opacity: 0 }}
        whileInView={reduce ? undefined : { opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 2.4, duration: 0.6 }}
      >
        <rect x="392" y="96" width="12" height="46" rx="2" fill="none" stroke="#dfc088" strokeWidth="1.4" strokeDasharray="4 4" />
        <text x="398" y="88" textAnchor="middle" fill="#dfc088" fontSize="11" fontFamily="monospace">?</text>
      </motion.g>
      {/* orbiting gold spark */}
      <motion.circle
        r="3.5" fill="#dfc088"
        initial={reduce ? { cx: 308, cy: 62 } : { cx: 10, cy: 190 }}
        whileInView={reduce ? undefined : { cx: [10, 308, 510], cy: [190, 62, 212] }}
        viewport={{ once: true }}
        transition={{ duration: 2.8, ease: 'easeInOut', delay: 0.2 }}
        style={{ filter: 'drop-shadow(0 0 8px rgba(223,192,136,0.9))' }}
      />
    </svg>
  );
}

export function NotFoundScene() {
  return (
    <section className="relative flex min-h-[calc(100dvh-64px)] items-center overflow-hidden">
      <ShaderHero />
      <div className="pointer-events-none absolute inset-0 grid-lines opacity-40" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-ink-950/80 to-transparent" />

      <div className="shell relative grid items-center gap-10 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <div>
          <p className="eyebrow"><span className="story-dot" /> Error 404 · position not found</p>
          <h1 className="display mt-4 text-[64px] leading-[0.95] sm:text-[92px]">
            <MaskLine>Off the</MaskLine>
            <MaskLine delay={0.1}><em className="text-gold">charts.</em></MaskLine>
          </h1>
          <p className="mt-5 max-w-md text-[13.5px] leading-relaxed text-muted">
            This page never listed, delisted, or moved beyond our coverage. The markets, however,
            are exactly where you left them — and support is one click away.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Magnetic strength={0.25}><Link href="/" className="btn-primary px-5 py-2.5 text-[13px]">Back to home <span aria-hidden>↗</span></Link></Magnetic>
            <Magnetic strength={0.25}><Link href="/markets" className="btn-ghost px-5 py-2.5 text-[13px]">Explore markets</Link></Magnetic>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event('primevest:chat-open'))}
              className="inline-flex items-center gap-2 text-[13px] font-semibold text-gold transition-colors hover:text-gold-300"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full border border-gold/40 bg-gold/10">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
              </span>
              Ask PRIMEVEST Customer Support
            </button>
          </div>
          <div className="mt-9 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/[0.07] pt-5">
            {QUICK.map((q) => (
              <Link key={q.href} href={q.href} className="group inline-flex items-center gap-1.5 text-[12px] font-medium text-muted transition-colors hover:text-gold">
                <span className="h-1 w-1 rounded-full bg-gold/50 transition-all group-hover:w-2.5" />{q.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="glass relative overflow-hidden p-5 sm:p-7">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">PAGE/404 · reference only</p>
              <span className="chip"><span className="h-1.5 w-1.5 rounded-full bg-danger" /> halted</span>
            </div>
            <CrashedChart />
            <p className="mt-4 text-[10.5px] leading-relaxed text-muted">
              Indicative illustration. Not a PRIMEVEST quote, chart or investment advice.
            </p>
          </div>
          <div className="pointer-events-none absolute -bottom-6 -right-4 hidden select-none font-display text-[120px] font-semibold leading-none text-gold/[0.07] sm:block" aria-hidden>404</div>
        </div>
      </div>
    </section>
  );
}
