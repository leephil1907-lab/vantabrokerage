'use client';

import { AnimatePresence, motion, useInView, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import { useEffect, useRef, useState, type ReactNode } from 'react';

/* ────────────────────────────────────────────────────────────────────────────
   Shared motion language.
   Every animation in the app routes through these primitives so easing, timing
   and reduced-motion behaviour stay consistent (and are tuned in one place).
   ──────────────────────────────────────────────────────────────────────────── */

export const EASE = [0.22, 1, 0.36, 1] as const;
export const SOFT = [0.4, 0, 0.2, 1] as const;

export const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

export const staggerParent = (stagger = 0.07, delay = 0) => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren: delay } },
});

/** Fade + rise when the element scrolls into view. Fires once. */
export function Reveal({
  children,
  delay = 0,
  y = 16,
  className = '',
  as = 'div',
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'span';
}) {
  const reduce = useReducedMotion();
  const Comp = motion[as] as typeof motion.div;
  return (
    <Comp
      className={className}
      initial={reduce ? undefined : { opacity: 0, y }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, ease: EASE, delay }}
    >
      {children}
    </Comp>
  );
}

/** Parent that staggers its `StaggerItem` children. */
export function Stagger({ children, className = '', delay = 0, gap = 0.07 }: { children: ReactNode; className?: string; delay?: number; gap?: number }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} variants={staggerParent(gap, delay)} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }}>
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = '' }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} variants={fadeUp}>
      {children}
    </motion.div>
  );
}

/** Counts up to `value` the first time it enters the viewport. */
export function Counter({ value, prefix = '', suffix = '', decimals = 0, duration = 1.4, className = '' }: { value: number; prefix?: string; suffix?: string; decimals?: number; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(reduce ? value : 0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) { setDisplay(value); return; }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / (duration * 1000));
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(value * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration, reduce]);

  return (
    <span ref={ref} className={`value-mono tabular ${className}`}>
      {prefix}
      {display.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  );
}

/** Price cell that flashes green/red and slides when the value changes. */
export function AnimatedNumber({ value, className = '', decimals = 2, flash = true }: { value: number | null | undefined; className?: string; decimals?: number; flash?: boolean }) {
  const reduce = useReducedMotion();
  const prev = useRef<number | null | undefined>(value);
  const [dir, setDir] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    if (value == null || prev.current == null) { prev.current = value; return; }
    if (value > prev.current) setDir('up');
    else if (value < prev.current) setDir('down');
    prev.current = value;
    const t = setTimeout(() => setDir(null), 900);
    return () => clearTimeout(t);
  }, [value]);

  if (value == null) return <span className={className}>—</span>;
  return (
    <motion.span
      className={`value-mono tabular ${className}`}
      animate={reduce || !flash ? undefined : dir === 'up' ? { color: ['#2ee6a8', '#ffffff'], y: [-1.2, 0] } : dir === 'down' ? { color: ['#ff5b6e', '#ffffff'], y: [1.2, 0] } : {}}
      transition={{ duration: 0.55, ease: SOFT }}
    >
      {value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
    </motion.span>
  );
}

/** Sliding underline / pill shared by nav and tab groups. */
export function MotionIndicator({ layoutId, className = '' }: { layoutId: string; className?: string }) {
  return (
    <motion.span
      layoutId={layoutId}
      className={className}
      transition={{ type: 'spring', stiffness: 380, damping: 32, mass: 0.6 }}
    />
  );
}

/** Animated presence wrapper used by dropdowns, drawers and modals. */
export function Pop({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -6, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.985 }}
          transition={{ duration: 0.18, ease: SOFT }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** A cursor-following highlight for cards. Disabled for touch + reduced motion. */
export function Spotlight({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const reduce = useReducedMotion();
  const x = useMotionValue(50);
  const y = useMotionValue(50);
  const sx = useSpring(x, { stiffness: 240, damping: 30 });
  const sy = useSpring(y, { stiffness: 240, damping: 30 });
  const bg = useTransform([sx, sy], ([a, b]: number[]) => `radial-gradient(280px circle at ${a}% ${b}%, rgba(200,247,81,0.10), transparent 65%)`);

  if (reduce) return <div className={`relative ${className}`}>{children}</div>;
  return (
    <div
      ref={ref}
      className={`group relative ${className}`}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        x.set(((e.clientX - r.left) / r.width) * 100);
        y.set(((e.clientY - r.top) / r.height) * 100);
      }}
    >
      <motion.span aria-hidden className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: bg }} />
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
