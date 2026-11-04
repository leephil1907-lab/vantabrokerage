# PRIMEVEST — Project Completion Checklist

Living status document. ✅ done & verified · 🟡 done with caveats · ⬜ open item.
Last updated: 2026-11-02 (commit af8a816 + fintech retune).

## 1 · Brand & design system
- ✅ Obsidian + champagne-gold identity; logo mark, favicon and UI tokens aligned (no green remnants)
- ✅ Exchange-grade fintech retune: cool neutral chassis (OKX-class), gold reserved for brand/actions, emerald/red strictly for market direction
- ✅ Dark + light themes; dark islands (wallet card) keep legible contrast in light mode
- ✅ Motion layer: Lenis smooth scroll, reveals, line masks, marquees, magnetic CTAs, page transitions — all with prefers-reduced-motion fallbacks
- ✅ Cinematic 404 inside the full site shell; press feedback on every clickable; back-to-top glide

## 2 · Marketing website
- ✅ Home (hero carousel + 3D globe + shader mesh + live showcase + sessions + crypto discovery + gold band + footer wordmark motion)
- ✅ Markets, forex, crypto, short-expiry, accounts, about, help, trading-conditions, legal set (terms/privacy/AML/cookies/risk-disclosure)
- ✅ Global market screener (TradingView scanner) + Finnhub news + company-profile drawer
- ✅ SEO metadata, theme-color, icon.svg; footer risk warning retained as the single standing disclaimer
- ✅ Search privacy (pre-launch): robots.txt Disallow /, site-wide noindex/nofollow/noarchive/nosnippet metadata and X-Robots-Tag header — dashboards, APIs and pages stay out of search indexes. FLIP to an allow-list at public launch
- ✅ Photographic page heroes (real market imagery per desk, Ken Burns motion, locked light-on-dark contrast in both themes) with local glyph fallbacks when remote coin icons fail
- ✅ Research-tooling transplant (Fincept/Vibe-Trading concepts, natively reimplemented in TS): null-safe indicator engine (RSI/EMA/MACD/Bollinger/ATR/VWAP + Sharpe/profit-factor/max-DD), terminal Signal Lens panel, live market heatmap, Finnhub earnings radar, dashboard Performance card with realized equity curve; stale "order book unavailable / no matching engine" placeholders replaced with real Signal Lens + Recent executions
- ✅ Public live ticker tape with brand marks/flags under the nav on home + markets (theme-proof dark chassis, pauses on hover); replaced the old token-coloured, icon-less, below-the-fold tape
- ✅ /markets hero now carries real market photography with mount-animated headline (no more blank hero in light theme); all hero titles animate on mount, immune to scroll-capture and IO edge cases
- ✅ Zero "not available / key required / coming soon" copy on public surfaces: news falls back to an auto-generated leaders/laggards market brief; APIs no longer leak key-meta messages; neutral reconnecting states elsewhere; bank tab retired until rails exist
- ✅ Precise asset branding everywhere: official coin marks for every listed crypto, stacked currency flags for FX, gold/silver bullion stacks, crude droplet + gas flame for energy, colour-coded coded rings for indices (DOW/NDX/SPX/DAX/FTSE) — no two instruments share a glyph
- ✅ Provider 'Source' column removed from instrument lists (client asked; internal provenance retained server-side)
- ✅ Palette v3 — modern exchange fintech: blue-graphite midnight chassis (#0a0e16 / #0f141f / #141a28), porcelain-cool light theme, exchange-standard direction colours (#0ECB81 up / #F6465D down), champagne gold reserved for brand + primary actions
- ✅ Compact professional footer: invite line, link columns, risk block, bottom bar (giant wordmark retired)

## 3 · Market data
- ✅ 44 reference instruments (forex/CFD/crypto), live quotes with TTL refresh that works serverless (verified 44/44 priced on Vercel)
- ✅ Trading sessions clock with regional flags + crypto mark; venue depth (Kraken book); movers + auto brief
- ✅ Price alerts (worker-evaluated), watchlists, candles endpoint
- 🟡 Quote freshness depends on third-party providers; delayed chips shown when stale

## 4 · Brokerage core
- ✅ Account economics per owner rule: DEMO auto-provisioned with $100,000 labelled virtual capital; LIVE starts at $0 and cannot trade until funded (INSUFFICIENT_FUNDS enforced server-side + funding-gate UI in the ticket)
- ✅ Order types (market/limit/stop family), internal dealing fills with venue provenance, resting-order matcher, position netting, TP/SL, cancel/close
- ✅ Short-expiry CALL/PUT with worker settlement; ledger-double-entry accounting, balanced-ledger tested
- ✅ Portfolio: equity, margin, buying power, realised/open P&L, diversification, history chart
- ⬜ Real external liquidity/execution partner for LIVE (currently internal dealing; labelled in admin & audit)

## 5 · Wallet & funding
- ✅ Ledger, holdings, transfers segregated across environments (cross-environment transfer blocked, tested)
- ✅ Withdrawals require ADMIN approval (no pre-approved path); deposits disabled until payment rails exist (503 + neutral "funding coming soon" UX)
- ⬜ Payment provider integration (crypto addresses / bank rails) — blocker for live funding

## 6 · KYC & compliance controls
- ✅ KYC submission flow with document country dropdown; statuses NOT_SUBMITTED → PENDING → APPROVED/REJECTED
- ✅ Manual-only verification: admin approves/rejects; no auto-approval anywhere (code-verified); withdrawal approval likewise manual
- ✅ No seeded sample users/trades in production; seed endpoint is staff-only and markets-only
- 🟡 Jurisdiction-specific regulatory copy should be reviewed by counsel before launch

## 7 · Support & chat
- ✅ PRIMEVEST Customer Support widget: bot FAQ + forced human handoff, visitor token persistence, solid (non-transparent) panel, DRAGGABLE launcher that docks bottom and never covers content (position remembered)
- ✅ Admin console /admin/chat: open/closed tabs, threads, replies, close; staff nav link
- ✅ Ticket system (dashboard/support) with staff replies

## 8 · Admin & ops
- ✅ Admin shell: users, KYC queue, withdrawals, markets (with staff-only seed button), audit log, settings, stats, live chat
- ✅ Audit logging of admin actions; role gates (ADMIN/SUPERADMIN/SUPPORT/FINANCE)
- ✅ Neon production baselined (_prisma_migrations complete); Vercel builds run env guard + migrate-safe build command

## 9 · Auth & security
- ✅ Email+password with verification, reset (atomic single-use tokens), 2FA (TOTP), session rotation, rate limits, safe redirects
- ✅ Secrets only in git-ignored .env / platform envs; no tokens in repo (scanned)
- 🟡 Rotate the three secrets previously pasted in chat (Neon password, GitHub token, Finnhub key)

## 10 · Mobile & accessibility
- ✅ Zero horizontal overflow at 360–430px (automated check in terminal suite); grid min-width pitfalls fixed
- ✅ All choosers are in-page gold dropdowns (country, asset, leverage, alert symbol/direction, sort) — no OS radio sheets
- ✅ Mobile tab bars (marketing + dashboard), safe-area offsets, sticky-nav-aware anchors
- ✅ ARIA: listbox semantics, aria-live statuses, focus-visible rings, reduced-motion paths

## 11 · Quality gates
- ✅ Four regression suites green: account-safety, auth-experience (browser), paper-trading, terminal-workspace (browser, mobile+desktop, zero console errors)
- ✅ tsc strict clean; production build clean; 25+ route smoke checks per release
- 🟡 ESLint not configured (tsc is the gate) — optional hardening

## 12 · Deployment
- ✅ GitHub main + live-standard in sync; Vercel auto-deploys main; Neon prod migrated + seeded
- ✅ Sandbox preview mirrors prod behaviour
- ✅ Manual crypto deposit desk wired end-to-end (imported backend aa23a64 + new UI): configured receive addresses per asset/network, copy-to-clipboard, tx-hash submission → PENDING for finance review, zero auto-credit (suite-asserted); honest 'opening soon' state when no addresses configured
- ✅ Render blueprint imported & reviewed (render.yaml: web + worker + Postgres, health check, graceful worker drain, review-only seed guard) — coexists with the live Vercel deployment; pick one primary before launch
- ⬜ Custom domain (DNS + SSL) — next planned phase
- ⬜ Launch switch: flip robots/meta to indexable + submit sitemap once public
- ⬜ Transactional email provider (SMTP/Resend) for verification & notification deliverability
- ⬜ Lighthouse/perf budget pass & OG image asset
- ⬜ Status/monitoring + error tracking (Sentry-class) for prod

## Verification snapshot (this pass)
- scrollWidth == viewport at 390px on dashboard, terminal, markets
- Live quotes 44/44 on Vercel; chat E2E visitor→bot→handoff→agent→close verified
- All approvals manual; live trading gated on funding; demo-only virtual capital
