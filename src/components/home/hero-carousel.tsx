'use client';
import Link from 'next/link';
import { ArrowUpRight } from '@/components/ui/arrow-up-right';
import { PrimevestGlyph } from '@/components/brand';
import { useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { HeroScene } from '@/components/three/hero-scene';
import { EASE, Magnetic } from '@/components/motion/primitives';

const SLIDES = [
  { image: '/images/hero-dealing.jpg', kicker: 'The dealing desk', title: 'Precision, in every fill.', text: 'Orders execute against live market quotes with full ledger provenance — markets, sessions and risk in one considered workspace.' },
  { image: '/images/hero-markets.webp', kicker: 'A clearer view of markets', title: 'Perspective for every move.', text: 'Follow global markets, explore crypto and find the detail that matters — all in one considered workspace.' },
  { image: '/images/hero-perspective.webp', kicker: 'Global markets, in focus', title: 'A wider world. One view.', text: 'From currencies to digital assets, discover the markets shaping the world around you.' },
  { image: '/images/hero-workspace.webp', kicker: 'Built around your journey', title: 'Clarity in every detail.', text: 'Explore powerful charts, market information and an account experience designed to keep you focused.' },
];

export function HeroCarousel({ children }: { children: ReactNode }) {
  const [index, setIndex] = useState(0);
  const reduce = useReducedMotion();

  // The hero advances continuously. Pointer hover and keyboard focus do not
  // pause it, and there are intentionally no manual navigation controls.
  // Visitors who prefer reduced motion keep a stable first slide.
  useEffect(() => {
    if (reduce) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setIndex((current) => (current + 1) % SLIDES.length);
    }, 8000);
    return () => window.clearInterval(timer);
  }, [reduce]);

  const slide = SLIDES[index];

  return <section className="theme-island-dark story-hero" aria-roledescription="carousel" aria-label="The PRIMEVEST story">
    <AnimatePresence initial={false}>
      <motion.div
        aria-hidden="true"
        key={slide.image}
        className="story-hero-image"
        style={{ backgroundImage: `url('${slide.image}')` }}
        initial={reduce ? false : { opacity: 0, scale: 1.055, filter: 'blur(5px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        exit={reduce ? undefined : { opacity: 0, scale: 1.02, filter: 'blur(3px)' }}
        transition={{ duration: reduce ? 0 : 0.9, ease: EASE }}
      />
    </AnimatePresence>
    <div className="story-hero-overlay" aria-hidden="true" />
    <div className="story-hero-3d" aria-hidden="true"><HeroScene /></div>
    <div className="story-hero-inner">
      <div className="story-hero-copy">
        <div aria-live="off" aria-atomic="true">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={index}
              initial={reduce ? false : { opacity: 0, y: 14, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={reduce ? undefined : { opacity: 0, y: -7, filter: 'blur(3px)' }}
              transition={{ duration: reduce ? 0 : 0.42, ease: EASE }}
            >
              <h1>{slide.title}</h1>
              <p className="story-description">{slide.text}</p>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="story-actions">
          <Magnetic strength={0.25}><Link href="/markets" className="btn-primary story-button">Explore markets <ArrowUpRight /></Link></Magnetic>
          <a href="#live-charts" className="story-secondary">View live charts <span aria-hidden="true">→</span></a>
        </div>
      </div>
      <div className="story-preview">{children}</div>
    </div>
    <div className="story-brand-stamp" role="img" aria-label="PRIMEVEST"><PrimevestGlyph size={23}/><span aria-hidden="true">RIMEVEST</span></div>
  </section>;
}
