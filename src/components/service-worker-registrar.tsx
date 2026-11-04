'use client';

import { useEffect } from 'react';

/** Registers the PRIMEVEST service worker for offline shell + static caching. */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') return;
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    const timer = window.setTimeout(() => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
        /* offline support is progressive enhancement; never block the app */
      });
    }, 1200);
    return () => window.clearTimeout(timer);
  }, []);
  return null;
}
