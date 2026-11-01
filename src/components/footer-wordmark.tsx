'use client';
import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';

/**
 * Giant footer wordmark with scroll-linked drift: as the footer enters the
 * viewport the letters fade up and glide horizontally, the classic luxury
 * sign-off. Static under reduced motion.
 */
export function FooterWordmark() {
  const ref = useRef<HTMLDivElement | null>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const x = useTransform(scrollYProgress, [0, 1], ['5%', '-5%']);
  const opacity = useTransform(scrollYProgress, [0, 0.35, 1], [0, 1, 1]);

  if (reduce) return <div aria-hidden className="footer-wordmark">PRIMEVEST</div>;
  return (
    <motion.div ref={ref} aria-hidden className="footer-wordmark" style={{ x, opacity }}>
      PRIMEVEST
    </motion.div>
  );
}
