'use client';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type SelectOption = { value: string; label: string; icon?: ReactNode; hint?: string };

/**
 * Standard in-page dropdown (custom listbox) replacing native <select> and
 * free-text country fields: a field-styled button opens a scrollable,
 * keyboard-navigable option panel styled to the champagne-gold design system.
 */
export function Select({
  id, label, value, onChange, options, placeholder = 'Select…', disabled, leading, className = '', buttonClassName = '',
}: {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  leading?: ReactNode;
  className?: string;
  buttonClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const root = useRef<HTMLDivElement | null>(null);
  const list = useRef<HTMLUListElement | null>(null);
  const autoId = useId();
  const fieldId = id ?? autoId;
  const selected = options.find((o) => o.value === value) ?? null;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      const idx = options.findIndex((o) => o.value === value);
      setHighlight(idx >= 0 ? idx : 0);
    }
  }, [open, options, value]);

  useEffect(() => {
    if (!open || !list.current) return;
    list.current.querySelector<HTMLElement>(`[data-idx="${highlight}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [highlight, open]);

  const commit = (idx: number) => {
    const opt = options[idx];
    if (opt) onChange(opt.value);
    setOpen(false);
  };

  return (
    <div ref={root} className={`relative ${className}`}>
      {label && <label htmlFor={fieldId} className="label block">{label}</label>}
      <button
        id={fieldId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            if (!open) { setOpen(true); return; }
            setHighlight((h) => Math.min(options.length - 1, Math.max(0, h + (e.key === 'ArrowDown' ? 1 : -1))));
          } else if (e.key === 'Enter' || e.key === ' ') {
            if (open) { e.preventDefault(); commit(highlight); }
          } else if (e.key === 'Escape' && open) {
            setOpen(false);
          }
        }}
        className={`field flex h-12 w-full items-center justify-between gap-2 text-left ${label ? 'mt-1.5' : ''} ${buttonClassName} ${disabled ? 'opacity-60' : ''}`}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          {leading ?? selected?.icon ?? null}
          <span className={`truncate text-sm ${selected ? 'text-white' : 'text-muted/70'}`}>{selected ? selected.label : placeholder}</span>
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.18 }} className="shrink-0 text-muted">
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            ref={list}
            role="listbox"
            aria-labelledby={fieldId}
            initial={{ opacity: 0, y: -4, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.99 }}
            transition={{ duration: 0.14 }}
            className="absolute z-40 mt-1.5 max-h-64 w-full overflow-y-auto rounded-xl border border-white/15 bg-ink-850 p-1 shadow-panel"
          >
            {options.map((o, i) => (
              <li key={o.value} data-idx={i} role="option" aria-selected={o.value === value}>
                <button
                  type="button"
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => commit(i)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors ${
                    o.value === value ? 'bg-gold/10 text-gold' : i === highlight ? 'bg-white/[0.06] text-white' : 'text-white/80'
                  }`}
                >
                  {o.icon}
                  <span className="min-w-0 flex-1 truncate">{o.label}</span>
                  {o.hint && <span className="shrink-0 text-[10px] text-muted">{o.hint}</span>}
                  {o.value === value && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0 text-gold"><path d="m2.5 6.5 2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  )}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
