'use client';

/**
 * Site-wide "live motion flow": two slow champagne-gold aurora fields drifting
 * behind the entire marketing site. Pure CSS transforms (GPU-composited, no
 * layout thrash), pointer-transparent, and frozen under prefers-reduced-motion
 * via the global reduced-motion rules.
 */
export function AmbientFlow() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="ambient-blob ambient-blob-a" />
      <div className="ambient-blob ambient-blob-b" />
      <div className="ambient-blob ambient-blob-c" />
    </div>
  );
}
