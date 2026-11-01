'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * Client-side gate for the GLSL gradient-mesh header.
 * Same contract as HeroScene: three.js is code-split and idle-loaded, and
 * visitors with reduced motion, no WebGL or metered connections get an
 * animated CSS gradient fallback instead — the hero paints instantly either way.
 */
const GradientCanvas = dynamic(() => import('./gradient-canvas'), {
  ssr: false,
  loading: () => <div className="shader-fallback" />,
});

function canUseWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch {
    return false;
  }
}

export function ShaderHero({ className = '' }: { className?: string }) {
  const reduce = useReducedMotion();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (reduce) return;
    if (!canUseWebGL()) return;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    if (conn?.saveData || conn?.effectiveType === '2g' || conn?.effectiveType === 'slow-2g') return;
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback;
    if (idle) {
      const id = idle(() => setEnabled(true), { timeout: 1500 });
      return () => (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback?.(id);
    }
    const t = setTimeout(() => setEnabled(true), 500);
    return () => clearTimeout(t);
  }, [reduce]);

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      {enabled ? <GradientCanvas /> : <div className="shader-fallback" />}
    </div>
  );
}
