'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Pro terminal workspace.
 *
 * Left = instrument navigation, centre = chart workspace, right = execution.
 * Panels are:
 *   · resizable  — drag the hairline between panels (pointer events, persisted)
 *   · collapsible — header chevron collapses a panel to a rail
 *   · draggable  — drag the header handle to swap a panel across the workspace
 *
 * The whole layout is persisted per desk in localStorage, so a trader's
 * workspace survives navigation and reloads. Below `xl` the workspace stacks
 * into a single column and the panels render inline (mobile-first, not shrunk).
 */

type Prefs = {
  leftW: number;
  rightW: number;
  leftCollapsed: boolean;
  rightCollapsed: boolean;
  leftSide: 'left' | 'right';
};

const DEFAULT_PREFS: Prefs = { leftW: 252, rightW: 320, leftCollapsed: false, rightCollapsed: false, leftSide: 'left' };

function usePrefs(key: string) {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`vanta.workspace.${key}`);
      if (raw) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) });
    } catch { /* ignore corrupted prefs */ }
    setLoaded(true);
  }, [key]);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(`vanta.workspace.${key}`, JSON.stringify(prefs)); } catch { /* storage full/blocked */ }
  }, [prefs, key, loaded]);

  const update = useCallback((patch: Partial<Prefs>) => setPrefs((p) => ({ ...p, ...patch })), []);
  return { prefs, update, reset: () => setPrefs(DEFAULT_PREFS), loaded };
}

function PanelChrome({
  title,
  side,
  collapsed,
  onToggle,
  onDragEnd,
  children,
  actions,
}: {
  title: string;
  side: 'left' | 'right';
  collapsed: boolean;
  onToggle: () => void;
  onDragEnd: (dx: number) => void;
  children: ReactNode;
  actions?: ReactNode;
}) {
  const reduce = useReducedMotion();
  return (
    <div className="flex h-full min-h-0 flex-col">
      <motion.div
        drag={reduce ? false : 'x'}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.16}
        dragMomentum={false}
        onDragEnd={(_, info) => onDragEnd(info.offset.x)}
        className={`flex h-9 shrink-0 items-center justify-between gap-2 border-b border-white/[0.06] px-2.5 ${reduce ? '' : 'cursor-grab active:cursor-grabbing'}`}
      >
        <span className="flex items-center gap-1.5">
          <svg width="9" height="13" viewBox="0 0 9 13" fill="none" className="text-white/20"><circle cx="2" cy="2" r="1" fill="currentColor" /><circle cx="7" cy="2" r="1" fill="currentColor" /><circle cx="2" cy="6.5" r="1" fill="currentColor" /><circle cx="7" cy="6.5" r="1" fill="currentColor" /><circle cx="2" cy="11" r="1" fill="currentColor" /><circle cx="7" cy="11" r="1" fill="currentColor" /></svg>
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">{title}</span>
        </span>
        <span className="flex items-center gap-1">
          {actions}
          <button onClick={onToggle} className="rounded p-1 text-muted transition-colors hover:bg-white/[0.06] hover:text-white" aria-label={collapsed ? `Expand ${title}` : `Collapse ${title}`}>
            <motion.svg animate={{ rotate: (side === 'left') === collapsed ? 0 : 180 }} transition={{ duration: 0.2 }} width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path d="M7.5 2.5 4 6l3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </motion.svg>
          </button>
        </span>
      </motion.div>
      {!collapsed && <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">{children}</div>}
    </div>
  );
}

function Resizer({ onDelta, label }: { onDelta: (dx: number) => void; label: string }) {
  const dragging = useRef(false);
  const startX = useRef(0);
  return (
    <div
      role="separator"
      aria-label={label}
      aria-orientation="vertical"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') onDelta(-16);
        if (e.key === 'ArrowRight') onDelta(16);
      }}
      onPointerDown={(e) => {
        dragging.current = true;
        startX.current = e.clientX;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!dragging.current) return;
        onDelta(e.clientX - startX.current);
        startX.current = e.clientX;
      }}
      onPointerUp={(e) => { dragging.current = false; (e.target as HTMLElement).releasePointerCapture(e.pointerId); }}
      onDoubleClick={() => onDelta(0)}
      className="group relative hidden w-[5px] shrink-0 cursor-col-resize items-center justify-center xl:flex"
    >
      <span className="h-10 w-px rounded-full bg-white/10 transition-all duration-200 group-hover:h-16 group-hover:w-[2px] group-hover:bg-lime/60" />
    </div>
  );
}

export function TerminalWorkspace({
  storageKey,
  left,
  center,
  right,
  height = 720,
}: {
  storageKey: string;
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
  height?: number;
}) {
  const { prefs, update, reset, loaded } = usePrefs(storageKey);
  const reduce = useReducedMotion();
  const [full, setFull] = useState(false);

  const leftNode = (
    <div className="h-full min-h-0">
      <PanelChrome
        title="Markets"
        side={prefs.leftSide}
        collapsed={prefs.leftCollapsed}
        onToggle={() => update({ leftCollapsed: !prefs.leftCollapsed })}
        onDragEnd={(dx) => { if (Math.abs(dx) > 110) update({ leftSide: prefs.leftSide === 'left' ? 'right' : 'left' }); }}
      >
        {left}
      </PanelChrome>
    </div>
  );

  const rightNode = (
    <div className="h-full min-h-0">
      <PanelChrome
        title="Execute"
        side="right"
        collapsed={prefs.rightCollapsed}
        onToggle={() => update({ rightCollapsed: !prefs.rightCollapsed })}
        onDragEnd={(dx) => { if (Math.abs(dx) > 110) update({ leftSide: prefs.leftSide === 'left' ? 'right' : 'left' }); }}
        actions={
          <button onClick={() => setFull((f) => !f)} className="hidden rounded p-1 text-muted transition-colors hover:bg-white/[0.06] hover:text-white xl:block" aria-label={full ? 'Exit focus mode' : 'Focus mode'}>
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d={full ? 'M4.5 1.5v3h-3M7.5 10.5v-3h3' : 'M1.5 4.5v-3h3M10.5 7.5v3h-3'} stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        }
      >
        {right}
      </PanelChrome>
    </div>
  );

  // A definite row height is what lets the panels inside size their charts,
  // scrollers and resizers correctly (no measuring, no layout thrash).
  const rowHeight = full ? 'calc(100vh - 140px)' : `clamp(600px, calc(100vh - 210px), ${Math.max(height, 760)}px)`;
  const style = { height: rowHeight };

  return (
    <div className="space-y-3">
      {/* Desktop workspace */}
      <div
        className="hidden gap-0 xl:flex"
        style={style}
      >
        {prefs.leftSide === 'left' ? (
          <>
            <motion.aside layout style={{ width: prefs.leftCollapsed ? 46 : prefs.leftW }} className="panel min-h-0 shrink-0 overflow-hidden" transition={{ duration: 0.25 }}>
              {leftNode}
            </motion.aside>
            <Resizer label="Resize markets panel" onDelta={(dx) => update({ leftW: Math.max(180, Math.min(420, prefs.leftW + dx)) })} />
          </>
        ) : null}

        <div className="panel flex min-w-0 flex-1 flex-col overflow-hidden">{center}</div>

        {prefs.leftSide === 'left' ? (
          <Resizer label="Resize execution panel" onDelta={(dx) => update({ rightW: Math.max(260, Math.min(460, prefs.rightW - dx)) })} />
        ) : null}
        <motion.aside layout style={{ width: prefs.rightCollapsed ? 46 : prefs.rightW }} className="panel min-h-0 shrink-0 overflow-hidden" transition={{ duration: 0.25 }}>
          {rightNode}
        </motion.aside>

        {prefs.leftSide === 'right' ? (
          <>
            <Resizer label="Resize markets panel" onDelta={(dx) => update({ leftW: Math.max(180, Math.min(420, prefs.leftW - dx)) })} />
            <motion.aside layout style={{ width: prefs.leftCollapsed ? 46 : prefs.leftW }} className="panel min-h-0 shrink-0 overflow-hidden" transition={{ duration: 0.25 }}>
              {leftNode}
            </motion.aside>
          </>
        ) : null}
      </div>

      {/* Workspace toolbar */}
      <div className="hidden items-center justify-between px-1 text-[10.5px] text-muted xl:flex">
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald" />workspace saved</span>
          <span className="hidden xl:inline">Drag a panel header to swap sides · drag the divider to resize · ⌥ click the chevron to collapse</span>
        </span>
        <button onClick={reset} className="rounded px-2 py-0.5 transition-colors hover:bg-white/[0.06] hover:text-white">Reset layout</button>
      </div>

      {/* Mobile / tablet stack — intentionally re-composed, not shrunk */}
      <div className="space-y-3 xl:hidden">
        <div className="panel overflow-hidden">{center}</div>
        <div className="panel overflow-hidden">
          <PanelChrome title="Execute" side="right" collapsed={false} onToggle={() => {}} onDragEnd={() => {}}>
            {right}
          </PanelChrome>
        </div>
        <div className="panel overflow-hidden">
          <PanelChrome title="Markets" side="left" collapsed={false} onToggle={() => {}} onDragEnd={() => {}}>
            {left}
          </PanelChrome>
        </div>
      </div>

      {!loaded && <span className="sr-only">Restoring saved workspace…</span>}
      {reduce && <span className="sr-only">Reduced motion enabled — panel animations disabled.</span>}
    </div>
  );
}
