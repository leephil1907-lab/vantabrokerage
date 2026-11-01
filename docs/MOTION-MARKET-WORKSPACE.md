# Motion and market workspace

The photographic hero slides are original generated conceptual imagery, presented as brand artwork rather than a claim about real people or an actual PRIMEVEST office. The PRIMEVEST glyph and wordmark are the existing selected vector logo, layered over each slide. The carousel pauses for interaction and honors reduced-motion preferences.

The homepage and supported authenticated desks use the public TradingView Advanced Chart widget. TradingView controls its chart feeds and availability. Widget failures have a retry and an external link; the widget does not connect to PRIMEVEST accounts or execute trades.

The market-depth endpoint proxies Kraken's public L2 snapshots for an explicit allowlist of BTC, ETH, and SOL USD/USDT pairs. The view identifies the venue and pair and polls around every 10 seconds. The server caches for five seconds per warm instance, shares in-flight requests, uses an eight-second upstream timeout and can return a stale snapshot for up to 30 seconds. Polling is paused while the page is hidden. A stale or failed feed is labelled; no synthetic book is substituted. The Kraken reference is not PRIMEVEST liquidity or an execution venue and prices from different sources can differ. These per-instance caches are not a distributed rate limiter; deploy a shared cache/rate limiter if traffic requires it.

Account orders, positions and fills are still sourced from the authenticated PRIMEVEST account endpoints. The chart and third-party depth do not enable trading or deposits. Those actions remain unavailable until real, authorized infrastructure and necessary controls are in place.
