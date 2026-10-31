'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { EASE } from './motion/primitives';

export type FaqItem = { q: string; a: string };

/**
 * Animated FAQ accordion shared by the help centre and every desk page.
 * Single-open behaviour, keyboard accessible (`<button aria-expanded>`), height
 * animated with Framer Motion and disabled automatically by reduced-motion.
 */
export function Accordion({ items, defaultOpen = 0, dense = false }: { items: FaqItem[]; defaultOpen?: number | null; dense?: boolean }) {
  const [open, setOpen] = useState<number | null>(defaultOpen);
  return (
    <div className="divide-y divide-white/[0.07] overflow-hidden rounded-2xl border border-white/[0.07] bg-ink-850/50">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q}>
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className={`flex w-full items-center justify-between gap-4 text-left font-medium text-white transition-colors hover:bg-white/[0.02] ${dense ? 'px-4 py-3 text-[12.5px]' : 'px-5 py-4 text-[13.5px]'}`}
            >
              {item.q}
              <motion.span animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.2 }} className="shrink-0 text-muted">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.26, ease: EASE }}
                  className="overflow-hidden"
                >
                  <p className={`${dense ? 'px-4 pb-3 text-[11.5px]' : 'px-5 pb-4 text-[12.5px]'} leading-relaxed text-muted`}>{item.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
