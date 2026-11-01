'use client';

import { useEffect, useState } from 'react';

type Theme = 'dark' | 'light';
const EVENT = 'primevest-theme';
function current(): Theme { return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'; }

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark');
  useEffect(() => {
    const sync = () => setTheme(current());
    const onStorage = (event: StorageEvent) => {
      if (event.key !== 'primevest.theme' || (event.newValue !== 'light' && event.newValue !== 'dark')) return;
      document.documentElement.dataset.theme = event.newValue;
      document.documentElement.style.colorScheme = event.newValue;
      sync();
    };
    sync(); window.addEventListener(EVENT, sync); window.addEventListener('storage', onStorage);
    return () => { window.removeEventListener(EVENT, sync); window.removeEventListener('storage', onStorage); };
  }, []);
  const toggle = () => {
    const next = current() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    document.documentElement.style.colorScheme = next;
    try { localStorage.setItem('primevest.theme', next); } catch { /* storage can be disabled */ }
    window.dispatchEvent(new Event(EVENT));
  };
  return <button type="button" onClick={toggle} aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} title={theme === 'dark' ? 'Light theme' : 'Dark theme'} className="theme-toggle">
    {theme === 'dark' ? <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="3.7"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/></svg> : <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 15.1A8.8 8.8 0 0 1 8.9 4a8.8 8.8 0 1 0 11.1 11.1Z"/></svg>}
  </button>;
}
