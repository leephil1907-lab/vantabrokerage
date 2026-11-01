'use client';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Gold back-to-top ring. Appears after 700px of scroll, bottom-left so it
 * never collides with the support launcher (bottom-right) or the mobile tab
 * bar. Uses the Lenis instance when present for a buttery glide.
 */
export function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 700);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toTop = () => {
    const lenis = (window as Window & { __lenis?: { scrollTo: (to: number, opts?: unknown) => void } }).__lenis;
    if (lenis) lenis.scrollTo(0, { duration: 1.2 });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          type="button"
          onClick={toTop}
          aria-label="Back to top"
          initial={{ opacity: 0, y: 12, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.9 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          className="fixed bottom-[calc(76px+env(safe-area-inset-bottom))] left-4 z-[80] grid h-11 w-11 place-items-center rounded-full border border-gold/35 bg-ink-900/85 text-gold shadow-[0_8px_28px_-10px_rgba(223,192,136,0.5)] backdrop-blur-xl md:bottom-6 md:left-6"
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
