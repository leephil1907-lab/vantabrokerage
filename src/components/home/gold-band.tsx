'use client';
import Link from 'next/link';
import { Marquee } from '@/components/motion/primitives';

/**
 * Luxury ticker band: the product vocabulary drifting across a gold hairline
 * strip in the display serif. Pauses on hover (CSS), static under reduced
 * motion (Marquee handles it), edge-faded into the page background.
 */
const WORDS: [string, string][] = [
  ['Forex', '/trading/forex'],
  ['Crypto Spot', '/trading/crypto'],
  ['Perpetual Futures', '/trading/futures'],
  ['Index CFDs', '/trading/cfd'],
  ['Commodities', '/markets'],
  ['Short-Expiry', '/trading/short-expiry'],
  ['Global Screener', '/markets/screener'],
  ['Market Sessions', '/#market-sessions'],
];

export function GoldBand() {
  return (
    <div className="relative border-y border-gold/[0.14] bg-ink-900/50" aria-label="PRIMEVEST products">
      <Marquee speed={58} className="py-3">
        {WORDS.map(([label, href]) => (
          <span key={label} className="flex items-center">
            <Link
              href={href}
              className="cursor-hot px-5 font-display text-[15px] italic tracking-wide text-white/70 transition-colors duration-300 hover:text-gold sm:px-7 sm:text-[17px]"
            >
              {label}
            </Link>
            <span className="text-gold/55" aria-hidden>✳</span>
          </span>
        ))}
      </Marquee>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-ink-950 to-transparent sm:w-32" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-ink-950 to-transparent sm:w-32" />
    </div>
  );
}
