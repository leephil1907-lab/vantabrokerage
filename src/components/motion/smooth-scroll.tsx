'use client';
import { useEffect, type ReactNode } from 'react';
import Lenis from 'lenis';
import { useReducedMotion } from 'framer-motion';

/**
 * Buttery smooth scrolling for the marketing site (Lenis).
 * Disabled entirely for reduced-motion visitors and never mounted on the
 * dashboard/terminal, where native scrolling keeps dense tables responsive.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    const lenis = new Lenis({
      duration: 1.05,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      anchors: true,
    });
    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    (window as Window & { __lenis?: Lenis }).__lenis = lenis;
    return () => {
      cancelAnimationFrame(raf);
      delete (window as Window & { __lenis?: Lenis }).__lenis;
      lenis.destroy();
    };
  }, [reduce]);

  return <>{children}</>;
}
