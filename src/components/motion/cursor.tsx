'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';

/**
 * Luxury trailing cursor: a champagne-gold ring that lags behind the pointer
 * and swells over interactive elements. The native cursor stays visible — this
 * is an additive flourish, mounted only on fine-pointer devices with motion
 * enabled, so touch and reduced-motion visitors never see it.
 */
export function GoldCursor() {
  const reduce = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const [hot, setHot] = useState(false);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 320, damping: 28, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 320, damping: 28, mass: 0.5 });
  const raf = useRef(0);

  useEffect(() => {
    if (reduce) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    setEnabled(true);
    const move = (e: PointerEvent) => {
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => {
        x.set(e.clientX);
        y.set(e.clientY);
        const el = e.target as HTMLElement | null;
        setHot(!!el?.closest('a, button, [role="button"], input, select, textarea, summary, .cursor-hot'));
      });
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => {
      window.removeEventListener('pointermove', move);
      cancelAnimationFrame(raf.current);
    };
  }, [reduce, x, y]);

  if (!enabled) return null;
  return (
    <motion.span
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[9999] hidden rounded-full border border-gold/60 md:block"
      style={{
        x: sx,
        y: sy,
        translateX: '-50%',
        translateY: '-50%',
        background: 'radial-gradient(circle, rgba(223,192,136,0.10), transparent 70%)',
      }}
      animate={{ width: hot ? 44 : 26, height: hot ? 44 : 26, opacity: hot ? 0.95 : 0.55 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
    />
  );
}
