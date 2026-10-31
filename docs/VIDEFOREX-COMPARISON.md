# Vanta Markets vs Videforex — design, structure and navigation comparison

**Reference:** <https://videforex.com/> (fetched 31 Oct 2026)
**Subject:** Vanta Markets (`/home/user/vanta`, Next.js 15 + Prisma + PostgreSQL)
**Verification:** production build (`next build` → `next start`), Playwright walk of 13 public and 23 authenticated routes (desktop 1440×900 + mobile 390×844), plus the 127-assertion e2e suite.

---

## 1. Executive summary

| Question | Answer |
|---|---|
| Does Vanta follow the reference's **structure and navigation**? | **Yes.** The public homepage follows the reference's exact section order (offer → secondary promo → "3 steps" → step details → funding + bonus → payout → facts → advantages → CTA), and the dashboard mirrors its navigation groups (Home / Trading / Markets / Portfolio / Wallet / Company / Accounts). |
| Does Vanta use the reference's **colour scheme**? | **No — deliberately.** The reference is a blue/dark binary-options palette with photographic 3-D medal/badge art. Your standing brief specifies *deep charcoal/graphite surfaces, white type, controlled lime/emerald accents, no cartoonish illustration*. Vanta follows your brief. If you want the reference's blue palette instead, that is a one-file token change (`src/app/globals.css` + `tailwind.config.ts`) — say the word. |
| Is it a copy of Videforex's **brand**? | **No.** Original logo, wordmark, naming and copy throughout — per your instruction not to impersonate it. |
| Are the **transitions and motion** actually working? | **Yes, now verified — and one real bug was found and fixed.** See §7. |
| Is it **functionally** deeper than the reference? | **Yes.** The reference's claims are marketing copy plus a login modal; Vanta has a real trading engine, double-entry ledger, KYC, 2FA, audited admin. |

---

## 2. Public homepage — section-by-section

| # | Videforex section | Vanta equivalent | Status |
|---|---|---|---|
| 1 | Hero: "HIGH-FREQUENCY TRADING / Earn up to 98% in 5 seconds" + medal art + "Accounts from $500" + Open an Account | Hero: headline + live terminal preview (real BTC/USDT quote, bid/ask/spread, candles) + WebGL globe + CTA + live counters | **Rebuilt — same placement, honest numbers** |
| 2 | Promo block: "Withdrawals in 1 hour" | Live market strip (4 majors) + ticker tape | Same slot, different content |
| 3 | Promo: "Trade Forex and CFD / Get up to 95% in 60 sec" | Instruments grid: Forex / Indices & CFDs / Commodities / Crypto spot / Perpetual futures / Short-expiry | Matched |
| 4 | "Start now! Our Live Managers will help you succeed" + platform mockup | "Live prices, named sources" live market table (bid / ask / 24h / source / trend) | Same slot; mockup replaced by real data |
| 5 | "Just 3 steps to Your Success" (Register / Fund / Predict) with numbered step art | "Three steps to your first trade" (Create account / Fund wallet / Trade) — numbered cards, connector rail, staggered entrance | **Matched 1:1** |
| 6 | Step 1: registration preview + gift forms | Real `/register` route, email verification, instant paper account | Matched, real |
| 7 | Step 2: funding carousel (WebMoney, QIWI, Yandex, OkPay, Skrill, Neteller, Visa, Mastercard) | Funding rails on `/deposits-withdrawals`, crypto on-chain verification; **no unconnected logos are shown** | **Deliberate difference** — only rails the platform can actually process |
| 8 | Step 2 bonus table: 250→+20%=300, 1000→+50%=1500, 3000→+100%=6000 | Bonus engine exists (`Bonus` model, turnover requirements) but **no invented bonus table is advertised** | **Deliberate difference** — a bonus ladder is a regulatory statement; it needs your sign-off, not my invention |
| 9 | Step 3: "payouts within an hour" | Withdrawal state machine with real states (`locked → review → paid with txHash`) | **Deliberate difference** — see §6 |
| 10 | Login modal ("Binarymate" whitelabel, Stay logged in, reCAPTCHA) | Dedicated `/login` route (2FA-aware, device list) + header "Sign in" | Same job, full page instead of modal |
| 11 | "Videforex Facts": 5202 accounts, $3,567,582 volume, $401,271 payments, 57 min processing | Live counters from real DB state (44 markets, 5 desks, 100 % server-priced, 2 ledger entries) with count-up animation | **Deliberate difference** — fabricated social proof is exactly what you told me not to ship |
| 12 | "Our Advantages" bullet list (video chat 24/7, 1-hour withdrawals, weekend trading, many funding methods, data protection) | "Built like a brokerage, not a demo" — 6 advantage cards (server-side execution, double-entry ledger, risk engine, paper/live separation, audited back office, verifiable market data) | Matched placement |
| 13 | "Open an Account" CTA | CTA panel with risk disclosure line | Matched |
| 14 | — | FAQ accordion (animated), account types, security section, footer with legal routes | **Vanta adds** |

---

## 3. Navigation comparison

| Aspect | Videforex | Vanta |
|---|---|---|
| Top bar | Logo, Login, Register (modal) | Utility rail (data status, support, payments) → logo → **dropdown nav**: Trading / Markets / Accounts / Company → Sign in / Open account |
| Dropdowns | None | Animated dropdown panels with descriptions + active-route indicator pill (shared layout animation) |
| Market discovery | Scroll-heavy single page | `/markets` overview with 4 live tables + per-desk routes |
| Search | None | **⌘K command palette** — pages *and* instruments, deep-links into the right desk with `?symbol=` |
| Signed-in shell | Trading UI (whitelabel) | Left sidebar (Trade / Portfolio / Wallet / Grow / Account / Staff), animated active pill, unread + KYC badges, notifications |
| Mobile | Not a primary target | **Re-composed** bottom tab bar (5 destinations), collapsible drawer, SVG-flag + real asset marks, 390 px verified |
| Footer | Advantage list | Brand + 4 link columns + risk disclosure + legal routes |

---

## 4. Colour and visual language

| Token | Videforex (as observed) | Vanta | Why |
|---|---|---|---|
| Background | Dark navy/blue-black | `#08090b` ink with graphite surfaces `#0e1114` / `#12161a` | Your brief: deep charcoal, not blue |
| Accent | Blue / cyan CTA | Lime `#c8f751` → emerald `#2ee6a8` gradient accents, used sparingly | Your brief |
| Type | Condensed uppercase headings, oversized | Inter (display, tight tracking) + IBM Plex Mono for all numerics, tabular figures | Your brief: no oversized type |
| Imagery | Photographic 3-D medals, managers, platform renders | **Zero stock photography.** WebGL globe (hero), real candlestick charts, real asset marks, engineered depth | Your brief: no cartoonish illustration, no fake trading charts |
| Cards | Rounded, gradient-heavy | 12–16 px radius, 1 px hairline borders, subtle glass, no gradient soup | Your brief |
| Icons | Mixed raster | One inline SVG set (Lucide-style geometry) + official BTC/ETH/SOL/XRP/LTC/DOGE/BNB/ADA/TRX/USDC/USDT marks + country flags | Your brief: no emoji, no generic circles |

**Verdict:** structure mirrors the reference; the *skin* intentionally does not. That is what the approved spec asked for.

---

## 5. Motion system

| Behaviour | Videforex | Vanta |
|---|---|---|
| Page transitions | Full page reloads; carousel sliders | `AnimatePresence` route transition inside the shell + top progress bar |
| Nav state | Static | Shared-layout indicator pills (top nav, sidebar, mobile tabs) |
| Scroll reveals | No | Staggered `whileInView` reveals on every section |
| Counters | Static numbers | Count-up on enter, `prefers-reduced-motion` aware |
| Prices | Static/refresh | `AnimatedNumber` flash + slide on tick, tabular numerals |
| Dropdowns/modals | None | Framer Motion transitions; ⌘K palette with keyboard nav |
| Charts | Static images | TradingView Lightweight Charts: 6 timeframes, candles/line/area, volume, EMA/SMA, live merge updates |
| 3-D | Raster art | Real Three.js hero globe (idle-loaded, code-split, WebGL-detected, SVG fallback) |
| Terminal panels | N/A | Draggable / resizable / collapsible, layout persisted per desk |
| Loading | Spinner/none | Branded loader, chart + table skeletons, feed-status chips ("live / delayed / feed down") |

---

## 6. Integrity — where Vanta refuses to imitate the reference

The reference advertises payout percentages, fixed withdrawal SLAs, bonus multipliers and customer counters. Those are commercial/regulatory commitments, and your brief explicitly forbids fabricated numbers, fake payments and invented trade outcomes. So Vanta:

1. Shows **live prices only from named providers** (Kraken, Coinbase, Yahoo Finance), each stamped with source + fetch time, and labels stale feeds as *delayed* instead of pretending.
2. Runs **every balance through a double-entry ledger** — no admin can type a balance in.
3. Makes **withdrawals** a real state machine: KYC gate → re-authentication (password + TOTP) → funds locked → finance decision → `paid` only with a `txHash`.
4. Marks **paper trading as PAPER everywhere**; live execution returns `409 LIVE_EXECUTION_UNAVAILABLE` until a provider is connected.
5. Replaces the reference's "facts" counters with **facts the platform can prove** (44 markets, 5 desks, 100 % server-priced, 2 ledger legs per movement).

If you want the payout/bonus/withdrawal numbers published as marketing claims, tell me the exact approved figures and they can be added as static, clearly-labelled marketing content — but I won't invent them.

---

## 7. Verification evidence (this build)

**One real defect was found and fixed during this verification pass:** the Lightweight Charts canvas was rendering empty because the library threw `Incorrect locale information provided` in headless/embedded browsers, aborting the paint. The locale is now pinned (`localization: { locale: 'en-GB' }`). Canvas paint samples went from **0 → 300**; candles, volume, EMA overlays and the live "last bar" readout now render.

| Check | Result |
|---|---|
| Production build | ✅ `next build` exit 0, 103 kB shared JS, three.js code-split out of initial load |
| Public routes (13) | ✅ all clean: no console errors, no horizontal overflow, no broken images, no empty SVGs |
| Authenticated routes (23) | ✅ all 200, zero console errors, zero stuck skeletons |
| Client-side routing | ✅ in-page navigation (no reload), transitions replay per route |
| Terminal charts | ✅ canvas painting, 300 bars, live feed indicator `live feed` |
| e2e suite `scripts/test-e2e.ts` | ✅ **127 passed / 0 failed** (auth, 2FA, KYC, orders, settlement, deposits, withdrawals, referrals, support, admin audit, ledger reconciliation) |
| Mobile (390×844) | ✅ dedicated bottom nav, no overflow on any route |

Reproduce: `npm run build && npm start`, then `node scripts/visual-qa.mjs / /markets`, `node scripts/app-qa.mjs`, `npx tsx scripts/test-e2e.ts`.

Screenshots: `docs/screenshots/` (`home-desktop`, `home-mobile`, `markets-desktop`, `dashboard-overview`, `terminal-forex`, `terminal-crypto`).

---

## 8. Gaps still open (stated plainly)

Closed since the first pass:

- **All marketing routes now share one page kit.** Every public page composes the same primitives from `src/components/marketing-ui.tsx` — `PageHero` (breadcrumbs + eyebrow + title + body + live stat band aside), `Section`, `FeatureGrid`, `Split`, `SpecTable`, `Callout`, `Accordion`, `CTASection`. Routes rebuilt this pass: `/trading/forex`, `/trading/cfd`, `/trading/futures`, `/trading/crypto`, `/trading/short-expiry`, `/accounts`, `/company/about`, `/deposits-withdrawals`, `/trading-conditions`, `/referral-program`, `/contact`, `/help`. Legal documents (`/legal/terms`, `/privacy`, `/risk-disclosure`, `/aml`, `/cookies`) use a new `LegalPage` layout with a sticky table of contents, version and effective date.
- **`/trading-conditions` is data-driven** — it reads every enabled instrument, leverage cap, taker/maker fee, precision and payout rate from the database at request time, so the published page cannot drift from the engine's configuration.
- Mobile horizontal overflow on the split/table pages was found by `scripts/visual-qa.mjs` and fixed at the source (`min-w-0` on grid children containing `overflow-x-auto` tables).

Still open:

| Gap | Impact | Effort |
|---|---|---|
| No language switcher (reference is multi-locale) | Single-locale (`en`) only | Medium (i18n routing) |
| No live video-chat / manager widget (reference's differentiator) | Missing feature, not a design flaw | Large (needs a provider) |
| Login is a page, not a modal | Different UX pattern | Small |
| Bonus table and payout percentages not published | Intentional (see §6) | Needs your figures |

### Verification for this pass

- `npx tsc --noEmit` clean after every page written.
- `npx next build` → exit 0.
- `scripts/visual-qa.mjs` across the rebuilt routes → **all clean** (desktop + mobile, console errors, overflow, skeleton residue).
- `scripts/app-qa.mjs` across authenticated routes → unchanged, still clean.
