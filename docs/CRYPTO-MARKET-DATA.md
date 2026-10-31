# Crypto market discovery

The market directory fetches up to 250 top assets from the CoinGecko `/coins/markets` endpoint, quoted in USD. CoinGecko provides the name, symbol, icon, price, percentage change, market cap, volume and individual `last_updated` timestamp. `COINGECKO_DEMO_API_KEY` is optional and is kept server-side. Review CoinGecko's terms, attribution, licensing and API-plan limits before any public deployment.

The server shares a one-minute in-process cache and deduplicates in-flight requests. On provider failure it serves its last cached response marked delayed for up to 30 minutes, then returns an unavailable state; after a failure it backs off for 20 seconds. Every asset has its own five-minute stale indicator. The browser polls once a minute while visible. These are reference snapshots, not exchange execution quotes or a tick-by-tick stream. The cache is per process: a multi-instance deployment needs a shared cache and coordinated rate limits. Data and icons depend on provider/network availability; image failures show a text fallback.

CoinGecko crypto discovery is **not a catalogue of executable trading pairs**: no new orderable instruments are provisioned. Its USD reference data is not substituted for existing USD/USDT market-pair execution, charts or forex pricing. Forex and existing paper-trading instruments continue using their configured feeds and preserve provider attribution. Real-money execution remains disabled. Always display which account and markets are actually tradable and retain timestamps and delay indications.

The market hero includes a decorative generated background image and a real, code-split Three.js animated scene. It does not encode market data. The existing WebGL fallback and reduced-motion/low-bandwidth safeguards remain. Currency flags are real locally hosted assets from FlagCDN; their inclusion does not imply endorsement.

## Public quote display isolation

The browser-facing market directory and terminal instrument lists read from `GET /api/markets/display`. This endpoint fetches provider observations into a short-lived in-process cache and does not write to the Prisma `MarketQuote` table. A provider outage preserves only the last fetched observation and marks it stale after the freshness window; it never manufactures a new last price.

Order placement and position/risk workers continue to use the separate server-side `getQuote()` path and `MarketQuote` cache. The public display endpoint is not an execution source. The selected providers in the current market configuration are Kraken/Coinbase for supported crypto pairs and Yahoo Finance for configured FX, index and commodity symbols. Yahoo values are indicative reference quotes and may be delayed; Yahoo-derived bid/ask values use the existing modeled spread. They must not be described as executable venue quotes.

This separation is a software boundary, not a market-data redistribution license. Before exposing these feeds to brokerage customers in production, obtain and retain the applicable provider and exchange permissions for customer-facing commercial display. CoinGecko's separate crypto discovery feed also requires a paid plan for standard commercial display with attribution; its free Demo plan is for testing.
