'use client';
import Link from 'next/link';
import { PrimevestGlyph } from '@/components/brand';
import { useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

const SLIDES = [
  { image: '/images/hero-markets.webp', kicker: 'A clearer view of markets', title: 'Perspective for every move.', text: 'Follow global markets, explore crypto and find the detail that matters — all in one considered workspace.' },
  { image: '/images/hero-perspective.webp', kicker: 'Global markets, in focus', title: 'A wider world. One view.', text: 'From currencies to digital assets, discover the markets shaping the world around you.' },
  { image: '/images/hero-workspace.webp', kicker: 'Built around your journey', title: 'Clarity in every detail.', text: 'Explore powerful charts, market information and an account experience designed to keep you focused.' },
];
export function HeroCarousel({ children }: { children: ReactNode }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [hovered, setHovered] = useState(false);
  const reduce = useReducedMotion();
  useEffect(() => { if (!reduce) setPlaying(true); }, [reduce]);
  useEffect(() => {
    if (!playing || hovered) return;
    const timer = window.setInterval(() => { if (!document.hidden) setIndex(i => (i + 1) % SLIDES.length); }, 8000);
    return () => clearInterval(timer);
  }, [playing, hovered]);
  const go = (i: number) => { setIndex((i + SLIDES.length) % SLIDES.length); setPlaying(false); };
  const slide = SLIDES[index];
  return <section className="story-hero" aria-roledescription="carousel" aria-label="The PRIMEVEST story" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setHovered(true)} onBlurCapture={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setHovered(false); }}>
    <AnimatePresence initial={false}><motion.div aria-hidden="true" key={slide.image} className="story-hero-image" style={{backgroundImage:`url('${slide.image}')`}} initial={reduce ? false : {opacity:0, scale:1.025}} animate={{opacity:1,scale:1}} exit={{opacity:0}} transition={{duration:reduce ? 0 : 0.9}} /></AnimatePresence>
    <div className="story-hero-overlay" aria-hidden="true" />
    <div className="story-hero-inner">
      <div className="story-hero-copy">
        <div className="story-eyebrow"><span className="story-dot" /> PRIMEVEST <span className="story-eyebrow-divider" /> {slide.kicker}</div>
        <div aria-live={playing ? 'off' : 'polite'} aria-atomic="true">
          <AnimatePresence mode="wait" initial={false}><motion.div key={index} initial={reduce ? false : {opacity:0,y:12}} animate={{opacity:1,y:0}} exit={reduce ? undefined : {opacity:0,y:-6}} transition={{duration:reduce ? 0 : 0.3}}>
            <h1>{slide.title}</h1><p className="story-description">{slide.text}</p>
          </motion.div></AnimatePresence>
        </div>
        <div className="story-actions"><Link href="/markets" className="btn-primary story-button">Explore markets <span aria-hidden="true">↗</span></Link><a href="#live-charts" className="story-secondary">View live charts <span aria-hidden="true">→</span></a></div>
        <div className="story-controls" aria-label="Carousel controls">
          <button type="button" onClick={() => go(index-1)} aria-label="Previous slide" className="story-arrow">←</button><button type="button" onClick={() => go(index+1)} aria-label="Next slide" className="story-arrow">→</button>
          <div className="story-dots">{SLIDES.map((s,i)=><button key={s.kicker} type="button" onClick={() => go(i)} aria-label={`Go to slide ${i+1}: ${s.kicker}`} aria-current={index === i ? 'true' : undefined} className={index === i ? 'active' : ''}/>)}</div>
          <button type="button" className="story-pause" onClick={() => setPlaying(p=>!p)} aria-label={playing ? 'Pause slideshow' : 'Play slideshow'}>{playing ? 'Ⅱ' : '▶'}</button>
          <span className="story-count">0{index+1} / 0{SLIDES.length}</span>
        </div>
      </div>
      <div className="story-preview">{children}</div>
    </div>
    <div className="story-brand-stamp" role="img" aria-label="PRIMEVEST"><PrimevestGlyph size={23}/><span aria-hidden="true">RIMEVEST</span></div>
  </section>;
}
