/**
 * Live market data service.
 *
 * Every published quote comes from a real source — nothing is simulated:
 *   • Crypto                      → CoinGecko public API.
 *   • Forex                       → Yahoo Finance, with open.er-api.com as a
 *                                   price backup when Yahoo is unreachable.
 *   • Metals, energy and indices  → Yahoo Finance.
 *
 * All providers are best-effort and run in parallel. When a provider fails the
 * last successful quote for that asset is reused; only when no live quote has
 * ever been obtained is the asset's last published value shown with a flat 0%
 * change. The feed never invents movement and never renders empty.
 */

export type MarketAsset = {
  symbol: string;
  name: string;
  category: "Forex" | "Crypto" | "Metals" | "Commodities" | "Indices";
  price: number;
  change24h: number;
  decimals: number;
  prefix?: string;
  flag?: string;
  badge?: string;
  badgeColor?: string;
};

type Quote = { price: number; change24h: number };

type AssetDef = {
  symbol: string;
  name: string;
  category: MarketAsset["category"];
  decimals: number;
  flag?: string;
  badge?: string;
  badgeColor?: string;
  /** Yahoo Finance ticker — used for FX, metals, energy and indices. */
  yahoo?: string;
  /** CoinGecko coin id — used for crypto. */
  coingecko?: string;
  /** Last published value, shown only when no live quote is available. */
  fallback: number;
};

const ASSETS: AssetDef[] = [
  // --- Forex ---------------------------------------------------------------
  { symbol: "EUR/USD", name: "Euro / US Dollar", category: "Forex", decimals: 4, flag: "🇪🇺", yahoo: "EURUSD=X", fallback: 1.1162 },
  { symbol: "GBP/USD", name: "British Pound / US Dollar", category: "Forex", decimals: 4, flag: "🇬🇧", yahoo: "GBPUSD=X", fallback: 1.3207 },
  { symbol: "USD/JPY", name: "US Dollar / Japanese Yen", category: "Forex", decimals: 3, flag: "🇯🇵", yahoo: "USDJPY=X", fallback: 158.658 },
  { symbol: "AUD/USD", name: "Australian Dollar / US Dollar", category: "Forex", decimals: 4, flag: "🇦🇺", yahoo: "AUDUSD=X", fallback: 0.696 },
  { symbol: "USD/CHF", name: "US Dollar / Swiss Franc", category: "Forex", decimals: 4, flag: "🇨🇭", yahoo: "USDCHF=X", fallback: 0.8346 },
  { symbol: "NZD/USD", name: "New Zealand Dollar / US Dollar", category: "Forex", decimals: 4, flag: "🇳🇿", yahoo: "NZDUSD=X", fallback: 0.5586 },
  { symbol: "USD/CAD", name: "US Dollar / Canadian Dollar", category: "Forex", decimals: 4, flag: "🇨🇦", yahoo: "USDCAD=X", fallback: 1.4285 },
  { symbol: "EUR/GBP", name: "Euro / British Pound", category: "Forex", decimals: 4, flag: "🇪🇺", yahoo: "EURGBP=X", fallback: 0.8449 },

  // --- Crypto --------------------------------------------------------------
  { symbol: "BTC/USD", name: "Bitcoin", category: "Crypto", decimals: 2, badge: "₿", badgeColor: "#F7931A", coingecko: "bitcoin", fallback: 82450 },
  { symbol: "ETH/USD", name: "Ethereum", category: "Crypto", decimals: 2, badge: "Ξ", badgeColor: "#627EEA", coingecko: "ethereum", fallback: 2510.1 },
  { symbol: "SOL/USD", name: "Solana", category: "Crypto", decimals: 2, badge: "◎", badgeColor: "#14F195", coingecko: "solana", fallback: 107.73 },
  { symbol: "BNB/USD", name: "BNB", category: "Crypto", decimals: 2, badge: "B", badgeColor: "#F3BA2F", coingecko: "binancecoin", fallback: 744.11 },
  { symbol: "XRP/USD", name: "XRP", category: "Crypto", decimals: 4, badge: "✕", badgeColor: "#25A0E0", coingecko: "ripple", fallback: 1.36 },
  { symbol: "USDT/USD", name: "Tether", category: "Crypto", decimals: 4, badge: "₮", badgeColor: "#26A17B", coingecko: "tether", fallback: 0.9991 },

  // --- Metals --------------------------------------------------------------
  { symbol: "XAU/USD", name: "Gold", category: "Metals", decimals: 2, badge: "Au", badgeColor: "#E7B84B", yahoo: "GC=F", fallback: 4192.5 },
  { symbol: "XAG/USD", name: "Silver", category: "Metals", decimals: 2, badge: "Ag", badgeColor: "#C9D3DA", yahoo: "SI=F", fallback: 60.5 },

  // --- Commodities ---------------------------------------------------------
  { symbol: "WTI", name: "Crude Oil", category: "Commodities", decimals: 2, badge: "Oil", badgeColor: "#8A94A6", yahoo: "CL=F", fallback: 93.88 },
  { symbol: "NG", name: "Natural Gas", category: "Commodities", decimals: 3, badge: "Gas", badgeColor: "#7FB4E8", yahoo: "NG=F", fallback: 3.145 },

  // --- Indices -------------------------------------------------------------
  { symbol: "SPX", name: "S&P 500", category: "Indices", decimals: 1, badge: "500", badgeColor: "#D9534F", yahoo: "^GSPC", fallback: 7804.6 },
  { symbol: "NDX", name: "Nasdaq 100", category: "Indices", decimals: 1, badge: "100", badgeColor: "#2E8BC0", yahoo: "^NDX", fallback: 30657 },
];

const YAHOO_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  Accept: "application/json",
};

const CACHE_TTL_MS = 60_000;
/** Used when a provider hiccuped, so the next visitor retries almost at once. */
const RETRY_TTL_MS = 15_000;
const REQUEST_TIMEOUT_MS = 8_000;

let cache: { at: number; ttl: number; data: MarketAsset[] } | null = null;

/** Last quote each symbol received from a live source, kept per server instance. */
const lastGood = new Map<string, Quote>();

function positive(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/* -------------------------------------------------------------- providers */

async function fetchCrypto(): Promise<Map<string, Quote>> {
  const out = new Map<string, Quote>();
  const ids = ASSETS.filter((a) => a.coingecko).map((a) => a.coingecko!);
  if (!ids.length) return out;

  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(",")}&vs_currencies=usd&include_24hr_change=true`,
    { cache: "no-store", signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) },
  );
  if (!res.ok) return out;

  const payload = (await res.json()) as Record<
    string,
    { usd?: number; usd_24h_change?: number }
  >;

  for (const asset of ASSETS) {
    if (!asset.coingecko) continue;
    const entry = payload[asset.coingecko];
    const price = positive(entry?.usd);
    if (price === null) continue;
    const change = Number(entry?.usd_24h_change);
    out.set(asset.symbol, { price, change24h: Number.isFinite(change) ? change : 0 });
  }
  return out;
}

async function fetchYahooBatch(targets: AssetDef[]): Promise<Map<string, Quote>> {
  const out = new Map<string, Quote>();

  await Promise.allSettled(
    targets.map(async (asset) => {
      const res = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(asset.yahoo!)}?interval=1d&range=1d`,
        { headers: YAHOO_HEADERS, cache: "no-store", signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) },
      );
      if (!res.ok) return;

      const data = (await res.json()) as {
        chart?: {
          result?: Array<{
            meta?: {
              regularMarketPrice?: number;
              chartPreviousClose?: number;
              previousClose?: number;
            };
          }>;
        };
      };
      const meta = data.chart?.result?.[0]?.meta;
      const price = positive(meta?.regularMarketPrice);
      if (price === null) return;

      const previous = positive(meta?.chartPreviousClose) ?? positive(meta?.previousClose);
      out.set(asset.symbol, {
        price,
        change24h: previous === null ? 0 : ((price - previous) / previous) * 100,
      });
    }),
  );

  return out;
}

async function fetchYahoo(): Promise<Map<string, Quote>> {
  const targets = ASSETS.filter((a) => a.yahoo);
  const out = await fetchYahooBatch(targets);

  // A single throttled or timed-out response should not push an asset onto its
  // static fallback for a whole cache window, so retry the stragglers once.
  const missing = targets.filter((asset) => !out.has(asset.symbol));
  if (missing.length) {
    const retried = await fetchYahooBatch(missing);
    for (const [symbol, quote] of retried) out.set(symbol, quote);
  }

  return out;
}

/** open.er-api.com publishes daily USD rates — used only if Yahoo is down. */
async function fetchErApi(): Promise<Map<string, Quote>> {
  const out = new Map<string, Quote>();
  const res = await fetch("https://open.er-api.com/v6/latest/USD", {
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) return out;

  const data = (await res.json()) as { result?: string; rates?: Record<string, number> };
  const rates = data.result === "success" ? data.rates : undefined;
  if (!rates) return out;

  const inverted = (code: string) => {
    const rate = positive(rates[code]);
    return rate === null ? null : 1 / rate;
  };
  const direct = (code: string) => positive(rates[code]);

  const euro = positive(rates.EUR);
  const pound = positive(rates.GBP);

  const pairs: Array<[string, number | null]> = [
    ["EUR/USD", inverted("EUR")],
    ["GBP/USD", inverted("GBP")],
    ["USD/JPY", direct("JPY")],
    ["AUD/USD", inverted("AUD")],
    ["USD/CHF", direct("CHF")],
    ["NZD/USD", inverted("NZD")],
    ["USD/CAD", direct("CAD")],
    ["EUR/GBP", euro !== null && pound !== null ? pound / euro : null],
  ];

  for (const [symbol, price] of pairs) {
    if (price === null) continue;
    out.set(symbol, { price, change24h: lastGood.get(symbol)?.change24h ?? 0 });
  }
  return out;
}

/* ----------------------------------------------------------------- public */

function toAsset(def: AssetDef, price: number, change24h: number): MarketAsset {
  return {
    symbol: def.symbol,
    name: def.name,
    category: def.category,
    decimals: def.decimals,
    flag: def.flag,
    badge: def.badge,
    badgeColor: def.badgeColor,
    price,
    change24h,
  };
}

export async function getMarketSnapshot(): Promise<MarketAsset[]> {
  if (cache && Date.now() - cache.at < cache.ttl) return cache.data;

  const [crypto, yahoo, erApi] = await Promise.allSettled([
    fetchCrypto(),
    fetchYahoo(),
    fetchErApi(),
  ]);

  // Yahoo wins because it reports an intraday previous close; the other
  // providers only fill symbols it did not return.
  const picked = new Map<string, Quote>();
  const apply = (result: PromiseSettledResult<Map<string, Quote>>) => {
    if (result.status !== "fulfilled") return;
    for (const [symbol, quote] of result.value) {
      if (!picked.has(symbol)) picked.set(symbol, quote);
    }
  };
  apply(yahoo);
  apply(crypto);
  apply(erApi);

  for (const [symbol, quote] of picked) lastGood.set(symbol, quote);

  let missingLiveData = false;

  const data = ASSETS.map((def) => {
    const quote = picked.get(def.symbol) ?? lastGood.get(def.symbol);
    if (!quote) {
      missingLiveData = true;
      return toAsset(def, def.fallback, 0);
    }
    return toAsset(def, quote.price, quote.change24h);
  });

  cache = { at: Date.now(), data, ttl: missingLiveData ? RETRY_TTL_MS : CACHE_TTL_MS };
  return data;
}

/** The compact subset used by the scrolling ticker in the hero. */
export function tickerSymbols(): string[] {
  return [
    "BTC/USD",
    "ETH/USD",
    "XAU/USD",
    "EUR/USD",
    "SPX",
    "GBP/USD",
    "SOL/USD",
    "WTI",
    "NDX",
    "USD/JPY",
    "AUD/USD",
    "NG",
  ];
}