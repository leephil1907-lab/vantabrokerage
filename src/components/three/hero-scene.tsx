'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * Client-side gate for the WebGL hero object.
 *
 * - three.js is code-split: it downloads only after this component mounts and
 *   only if the device looks capable.
 * - Falls back to a static SVG "market orbit" when WebGL is unavailable, the
 *   visitor prefers reduced motion, or the connection is metered/slow.
 * - Never blocks first paint: the fallback renders immediately.
 */
const HeroCanvas = dynamic(() => import('./hero-canvas'), { ssr: false, loading: () => <FallbackOrbit /> });

function canUseWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch {
    return false;
  }
}

export function FallbackOrbit({ dim = false }: { dim?: boolean }) {
  return (
    <div className={`flex h-full w-full items-center justify-center ${dim ? 'opacity-80' : ''}`} aria-hidden>
      <svg viewBox="0 0 320 320" className="h-full max-h-[420px] w-full max-w-[420px]">
        <defs>
          <radialGradient id="orbit-core" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="rgba(200,247,81,0.22)" />
            <stop offset="55%" stopColor="rgba(46,230,168,0.10)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <circle cx="160" cy="150" r="120" fill="url(#orbit-core)" />
        <g stroke="rgba(200,247,81,0.22)" fill="none">
          <ellipse cx="160" cy="150" rx="120" ry="120" strokeDasharray="2 7" />
          <ellipse cx="160" cy="150" rx="120" ry="46" />
          <ellipse cx="160" cy="150" rx="120" ry="86" strokeDasharray="3 8" opacity="0.6" />
          <ellipse cx="160" cy="150" rx="46" ry="120" opacity="0.5" />
          <ellipse cx="160" cy="150" rx="86" ry="120" strokeDasharray="3 8" opacity="0.4" />
        </g>
        <circle cx="160" cy="150" r="62" fill="rgba(8,9,11,0.75)" stroke="rgba(255,255,255,0.10)" />
        <circle cx="160" cy="150" r="62" fill="none" stroke="rgba(46,230,168,0.35)" strokeDasharray="4 10" />
        {[
          [272, 150], [96, 74], [214, 236], [66, 196], [246, 96],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i % 2 ? 3 : 4} fill={i % 2 ? '#2ee6a8' : '#c8f751'} opacity="0.85" />
        ))}
      </svg>
    </div>
  );
}

export function HeroScene() {
  const reduce = useReducedMotion();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (reduce) { setEnabled(false); return; }
    if (!canUseWebGL()) return;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    if (conn?.saveData || conn?.effectiveType === '2g' || conn?.effectiveType === 'slow-2g') return;
    // Defer until the browser is idle so the hero paints instantly.
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback;
    if (idle) {
      const id = idle(() => setEnabled(true), { timeout: 1200 });
      return () => (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback?.(id);
    }
    const t = setTimeout(() => setEnabled(true), 400);
    return () => clearTimeout(t);
  }, [reduce]);

  if (!enabled) return <FallbackOrbit />;
  return <HeroCanvas />;
}
