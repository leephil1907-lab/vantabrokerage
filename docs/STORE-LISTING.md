# PRIMEVEST — Store Listing & Packaging Kit

Everything needed to list and package PRIMEVEST for app stores. Packaging is deliberately sequenced AFTER the custom-domain cutover: TWA/MSIX packages bake the site origin at generation time, so packaging against the Render subdomain would force re-submission on domain day.

## 1. Identity
| Field | Value |
|---|---|
| App name | PRIMEVEST — Multi-asset brokerage terminal |
| Short name | PRIMEVEST |
| Android package id (suggested) | `com.primevest.web` (reserve `app.primevest.android` as fallback) |
| Microsoft Store name | PRIMEVEST (reserve early; names are first-come) |
| Category | Finance (sub: Investing / Trading) |
| Keywords | trading, forex, crypto, terminal, brokerage, markets, CFD, futures, portfolio |
| Content language | en (neutral en-GB phrasing; store listing en-US) |
| Site origin at packaging time | https://primevest-web.onrender.com → replace with custom domain before packaging |

## 2. Listing copy
**Short description (Play, ≤80 chars):**
`Multi-asset brokerage: forex, CFDs, crypto spot and perps with live quotes.`

**Full description (Play / MS Store):**
PRIMEVEST is a multi-asset brokerage terminal for forex, CFDs, crypto spot, perpetual futures and short-expiry contracts, with live market quotes, candlestick charting, indicators and a unified wallet.

• Live quotes across 44 instruments — crypto, FX, metals, energies and indices
• Trading terminal with market and limit orders, leverage control, TP/SL and position netting
• Practice environment with virtual capital, clearly labelled and segregated from live funds
• Market research: heatmap, movers, earnings radar, screener and news briefs
• Portfolio accounting: ledger-consistent balances, executions and statements
• Manual-review funding desk for crypto deposits with full provenance
• Two-factor authentication, KYC verification and an audit-logged account history

PRIMEVEST executes live orders on a principal basis against its internal matching engine. Trading leveraged products and crypto assets carries substantial risk of loss; see the in-app risk disclosure. Available features and eligibility depend on your jurisdiction.

**MS Store description:** use the full description above; add "Runs as an installed PWA with offline shell, live tiles shortcuts and Windows window-controls-overlay support."

## 3. Assets (all in repo, `public/`)
| Asset | Path | Use |
|---|---|---|
| Feature graphic 1024×500 | `store/feature-graphic-1024x500.png` | Play feature graphic |
| Hi-res icon 512 | `icon-512.png` (+ `icon-512-maskable.png`, `icon-512-mono.png`) | Play/MS icon |
| Phone screenshot 780×1688 | `screenshots/mobile-narrow.png` | Play phone |
| Desktop/10" screenshot 1280×800 | `screenshots/desktop-wide.png` | Play tablet + MS |
| OG card 1200×630 | `og.png` | MS promo tile / press |
Regenerate screenshots after domain cutover so no subdomain is visible in store imagery.

## 4. Rating questionnaire cheat-sheet (IARC / Play content rating)
- Gambling content: **Yes — real-money gambling-like features** must be answered carefully: short-expiry CALL/PUT contracts are fixed-odds products. IARC path will likely yield 18+/PEGI 18; answer truthfully and expect an adults-only rating.
- Violence/sex/profanity: No. User-generated content: No (support chat is staff-only). Data collection: disclose per privacy policy.
- Play financial-services policy: trading apps require **government licensing documentation** for each distributed country and country-targeting restrictions. Prepare licence/registration certificates (or restrict distribution to licensed jurisdictions) BEFORE submission; without them Play will reject regardless of package quality.
- Microsoft Store: finance category + adults-only rating acceptable; no separate licence upload, but listing must carry the risk disclosure (it does, in-app and in description).
- Apple App Store: no PWA path exists; submission would require a native wrapper (WebKit rule 4.2 minimum-functionality makes pure wrappers risky). Treat iOS as Safari PWA only.

## 5. Packaging & submission steps (post-domain)
**Android / Play:**
1. Domain live, `PUBLIC_INDEXABLE=true`, HTTPS verified.
2. pwabuilder.com → enter domain → Package For Stores → Android: generates signed TWA (AAB + APK) from the manifest (43/46 — all required checks pass; the 3 empty optionals do not block packaging).
   Local alternative: Bubblewrap CLI (needs JDK 17 + Android SDK; not available in the build sandbox — JDK 11 only).
3. Play Console → create app → upload AAB → content rating questionnaire (section 4) → financial-services attestation + licence docs → target countries → review.
**Windows / Microsoft Store:**
1. PWABuilder → Package For Stores → Windows: unsigned MSIX zip for Partner Center.
2. Partner Center → reserve "PRIMEVEST" → upload MSIX → listing fields from sections 2–3 → age rating (IARC via Partner Center questionnaire) → submit.
**iOS:** ship as Safari PWA; no store package.

## 6. Pre-submission gates (owner actions)
- [ ] Custom domain live + APP_URL/PUBLIC_INDEXABLE flip (runbook in PROJECT-CHECKLIST §11)
- [ ] Play Console ($25 one-time) and Partner Center ($19/yr) accounts under company identity
- [ ] Licensing/regulatory documentation for target jurisdictions (Play financial policy)
- [ ] IARC certificate id → optional `iarc_rating_id` manifest member (also lifts PWABuilder ring to 44/46)
- [ ] Regenerate screenshots/feature graphic on the domain origin
- [ ] Rotate seeded admin credentials and service secrets
