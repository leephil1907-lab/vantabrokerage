# PRIMEVEST — Website Completion Checklist & Inventory

Living inventory of everything on the website, its status, and what remains.
Updated 4 Nov 2026 · deployment target: **Render** (`primevest-web.onrender.com`, blueprint `render.yaml`) · Vercel retired.

Legend: ✅ shipped & verified · 🟡 partial / conditional · ⬜ open

---

## 1. Brand & shell
- ✅ Obsidian & champagne-gold identity; serif display + refined sans + Plex mono
- ✅ Exchange-grade palette v3: blue-graphite dark chassis, porcelain light theme, #0ECB81/#F6465D direction tokens
- ✅ Gold logo mark, favicon (`app/icon.svg`), apple-touch-icon + 192/512 PNGs, `manifest.webmanifest` (standalone PWA)
- ✅ OG social card `public/og.png` (1200×630) + full openGraph/twitter metadata, metadataBase from APP_URL (Render domain in production)
- ✅ PWA / PWABuilder checklist complete: full manifest (id, lang, categories, display, theme/bg, 192+512 any **and** true maskable icons, wide+narrow store screenshots, three app shortcuts), service worker `sw.js` (precached shell, static cache-first, navigations network-first with offline fallback — verified rendering offline), HTTPS + HSTS preload header on Render
- ✅ Theme system: dark/light with persisted preference, theme islands for cinematic surfaces, `theme-color` per theme
- ✅ Motion system: Lenis smooth scroll, scroll reveals, line-mask headings (mount-animated in heroes), magnetic buttons, marquees, parallax, Ken Burns hero photography — all with prefers-reduced-motion fallbacks

## 2. Marketing site (public)
- ✅ Home: cinematic photo carousel hero, live terminal preview card, coin ticker tape under nav, market sessions, movers, discovery grid, storytelling sections
- ✅ Markets: photographic hero, ticker tape, live table (no provider-source column), heatmap treemap of every instrument, movers, news/brief, earnings radar, screener link
- ✅ Screener: TradingView-powered global scanner (america/crypto/forex/cfd)
- ✅ Trading desks: forex / crypto spot / CFD / futures / short-expiry pages with photographic heroes, feature grids, live tables, sessions
- ✅ Accounts, trading conditions, deposits & withdrawals info, referral program, help center, contact (wired to admin inbox)
- ✅ Company about, legal suite (terms, privacy, risk disclosure, AML, cookies)
- ✅ 404 scene with shader + wayfinding
- ✅ Asset branding everywhere: official coin marks, stacked FX flags, bullion stacks, energy flames/droplets, coded index rings (DOW/NDX/SPX/DAX/FTSE)

## 3. Market data & research
- ✅ 44 reference instruments; live quotes (Kraken/Coinbase/Yahoo) with TTL refresh, serverless-safe caching, stale flags
- ✅ Candle history + reference charts; TradingView terminal charts; venue depth for major crypto
- ✅ Indicator engine (RSI/EMA/MACD/Bollinger/ATR/VWAP) + Signal Lens panel in terminal
- ✅ Performance maths (win rate, profit factor, max DD, Sharpe) — null-safe doctrine
- ✅ News: Finnhub editorial flow when key configured; auto leaders/laggards market brief otherwise (no dead-end copy)
- ✅ Economic/earnings radar; crypto discovery (CoinGecko) with branded-icon fallbacks

## 4. Brokerage core
- ✅ Auth: signup with country dropdown, email verification, sign-in, 2FA (TOTP + QR), password reset, safe redirects, atomic single-use tokens
- ✅ Accounts: PAPER ($100k virtual, labelled) + LIVE ($0 until funded); demo-first economics enforced client & server
- ✅ Order ticket: market/limit, leverage, margin modes; internal matching engine with provenance; resting orders; worker settlement; TP/SL; cancellations; position netting
- ✅ Short-expiry CALL/PUT with payout rates and worker settlement
- ✅ Live funding gate: unfunded live accounts see "Fund your live account" + deposit link; server rejects unfunded live orders
- ✅ Alerts, watchlists, copy-trading placeholder pages, referrals with tracking
- ✅ Wallet: ledger-consistent deposits/withdrawals/transfers, cross-environment transfer block, funding gates

## 5. Funding & payments
- ✅ Manual crypto deposit desk: configured receive addresses per asset/network, copy action, tx-hash intake → PENDING finance review, duplicate-hash rejection, zero auto-credit (suite-asserted)
- ✅ Admin credit/reject flow with notifications; idempotent single credit
- ⬜ Card / bank rails (future)
- ⬜ Real liquidity partner for LIVE execution (paper/internal dealing today)

## 6. KYC, support & admin
- ✅ KYC submission flow with document upload; admin manual approval only (no auto-approve anywhere)
- ✅ Support chat: draggable bottom-docked launcher, visitor→bot→handoff→agent→close, admin console
- ✅ Admin back office: users, KYC queue, withdrawals queue, deposit review, chat inbox, market management, audit log
- ✅ Zero premade sample users/trades in production; review seed is metadata-only

## 7. Dashboard & terminal
- ✅ Dashboard: viewport-aligned layout, wallet card, performance card (equity curve + stats), allocation donut, positions, orders, history, notifications
- ✅ Terminal desk: instrument rail, chart panel (TradingView/reference), Signal Lens, order ticket, venue depth, session stats, symbol news, recent executions
- ✅ Account bar with PAPER/LIVE switcher; auth-aware marketing nav (no Sign in when logged in)
- ✅ Deposits/withdrawals/transactions pages with friendly ledger copy

## 8. Quality, privacy & ops
- ✅ Suites: account-safety, auth-experience, paper-trading, terminal-workspace — all PASS on current build
- ✅ 19–21 route crawls: H1s present, zero horizontal overflow, zero console errors (mobile 390px)
- ✅ Search privacy pre-launch: robots.txt Disallow /, site-wide noindex/nofollow/nocache, X-Robots-Tag header; launch flip recorded below
- ✅ Security headers (frame, content-type, referrer, permissions, HSTS preload); health endpoint `/api/health`
- ✅ Render blueprint: web (pro) + worker (standard) + Postgres (pro-4gb), PR previews, healthcheck, graceful worker drain, review-only pre-deploy seed
- ✅ Secrets hygiene guidance: rotate GitHub token, Neon URL, Finnhub key (documented; user advised)

## 9. Footer & chrome
- ✅ Creative compact footer: live global-desk strip (session clocks + open dots), animated gold hairline, magnetic CTA, link columns with hover glide, systems-live pulse, risk block, ghost wordmark marquee
- ✅ Sticky nav with dropdown menus (opaque), command palette, scroll-top, route progress, chat launcher

## 10. Open items (next phases)
- ⬜ Custom domain (DNS + SSL on Render; then APP_URL/cookies/emails follow) — next planned phase
- ⬜ Launch flip: robots/meta to indexable + sitemap submission
- ⬜ Transactional email provider (templates + branded logo ready; delivery unconfigured)
- ⬜ Card/bank payment rails; real LIVE liquidity partner
- ⬜ Counsel review of jurisdictional copy
- ⬜ ESLint hardening pass; Lighthouse performance budget; production monitoring/alerting
- ⬜ Secret rotation (GitHub token, Neon URL, Finnhub key)
