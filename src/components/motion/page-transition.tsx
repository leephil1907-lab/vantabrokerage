'use client';

import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { EASE } from './primitives';

/**
 * Route-level transition. Every navigation inside the marketing shell or the
 * dashboard replays this entrance, so the app never looks like a set of
 * disconnected static pages.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  if (reduce) return <>{children}</>;
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.32, ease: EASE }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/** Thin lime bar under the header that animates on each route change. */
export function RouteProgress() {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [key, setKey] = useState(0);
  useEffect(() => setKey((k) => k + 1), [pathname]);
  if (reduce) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[2px]">
      <motion.div
        key={key}
        className="h-full bg-gradient-to-r from-lime via-emerald to-lime"
        initial={{ width: '0%', opacity: 1 }}
        animate={{ width: '100%', opacity: [1, 1, 0] }}
        transition={{ duration: 0.7, ease: EASE }}
      />
    </div>
  );
}

/** Scroll-linked progress rail for long marketing pages. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const width = useSpring(scrollYProgress, { stiffness: 140, damping: 26, restDelta: 0.001 });
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[99] h-[2px]">
      <motion.div className="h-full origin-left bg-lime/70" style={{ scaleX: width }} />
    </div>
  );
}

/** Parallax helper: translate children against scroll. */
export function Parallax({ children, distance = 40, className = '' }: { children: ReactNode; distance?: number; className?: string }) {
  const reduce = useReducedMotion();
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    if (reduce) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setOffset(Math.min(distance, window.scrollY * 0.12)));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, [distance, reduce]);
  return (
    <div className={className} style={{ transform: reduce ? undefined : `translate3d(0, ${offset}px, 0)`, willChange: 'transform' }}>
      {children}
    </div>
  );
}
