'use client';

import { TerminalDesk } from '@/components/terminal/terminal-desk';

/**
 * Crypto futures route (the reference site's "Crypto Futures" nav item).
 * Same desk as /dashboard/futures, mounted under its own URL and workspace key
 * so each route remembers an independent panel layout.
 */
export default function CryptoFuturesTerminal() {
  return <TerminalDesk kind="futures" />;
}
