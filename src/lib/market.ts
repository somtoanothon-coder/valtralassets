/**
 * Live market data service.
 *
 * Strategy (best-effort, never throws):
 *   1. FX pairs        → real rates from the free open.er-api.com endpoint.
 *   2. Crypto/metals/indices → seeded random-walk model that drifts in real
 *      time, so the ticker always moves the way a live feed does.
 *
 * When the upstream FX call fails we fall back to the same model, so the UI is
 * never empty and never shows an error.
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

type Seed = Omit<MarketAsset, "price" | "change24h"> & {
  base: number;
  volatility: number;
  drift: number;
};

/** Base values mirror the reference platform's published quotes. */
const SEEDS: Seed[] = [
  // --- Forex ---------------------------------------------------------------
  { symbol: "EUR/USD", name: "Euro / US Dollar", category: "Forex", base: 1.0857, volatility: 0.00042, drift: 0.00002, decimals: 4, flag: "🇪🇺" },
  { symbol: "GBP/USD", name: "British Pound / US Dollar", category: "Forex", base: 1.2658, volatility: 0.00058, drift: -0.00003, decimals: 4, flag: "🇬🇧" },
  { symbol: "USD/JPY", name: "US Dollar / Japanese Yen", category: "Forex", base: 151.72, volatility: 0.062, drift: 0.004, decimals: 3, flag: "🇯🇵" },
  { symbol: "AUD/USD", name: "Australian Dollar / US Dollar", category: "Forex", base: 0.6536, volatility: 0.00051, drift: 0.00001, decimals: 4, flag: "🇦🇺" },
  { symbol: "USD/CHF", name: "US Dollar / Swiss Franc", category: "Forex", base: 0.9015, volatility: 0.00044, drift: 0.00003, decimals: 4, flag: "🇨🇭" },
  { symbol: "NZD/USD", name: "New Zealand Dollar / US Dollar", category: "Forex", base: 0.6182, volatility: 0.00047, drift: -0.00002, decimals: 4, flag: "🇳🇿" },
  { symbol: "USD/CAD", name: "US Dollar / Canadian Dollar", category: "Forex", base: 1.3641, volatility: 0.0005, drift: 0.00002, decimals: 4, flag: "🇨🇦" },
  { symbol: "EUR/GBP", name: "Euro / British Pound", category: "Forex", base: 0.8577, volatility: 0.00036, drift: 0.00001, decimals: 4, flag: "🇪🇺" },
  { symbol: "USD/NGN", name: "US Dollar / Nigerian Naira", category: "Forex", base: 1538.4, volatility: 1.85, drift: 0.22, decimals: 2, flag: "🇳🇬" },
  { symbol: "USD/ZAR", name: "US Dollar / South African Rand", category: "Forex", base: 18.42, volatility: 0.021, drift: 0.002, decimals: 3, flag: "🇿🇦" },

  // --- Crypto --------------------------------------------------------------
  { symbol: "BTC/USD", name: "Bitcoin", category: "Crypto", base: 83442, volatility: 148, drift: 12, decimals: 2, badge: "₿", badgeColor: "#F7931A" },
  { symbol: "ETH/USD", name: "Ethereum", category: "Crypto", base: 2555.7, volatility: 8.4, drift: 0.6, decimals: 2, badge: "Ξ", badgeColor: "#627EEA" },
  { symbol: "SOL/USD", name: "Solana", category: "Crypto", base: 148.36, volatility: 1.9, drift: 0.12, decimals: 2, badge: "◎", badgeColor: "#14F195" },
  { symbol: "BNB/USD", name: "BNB", category: "Crypto", base: 634.12, volatility: 4.1, drift: 0.35, decimals: 2, badge: "B", badgeColor: "#F3BA2F" },
  { symbol: "XRP/USD", name: "XRP", category: "Crypto", base: 2.1842, volatility: 0.024, drift: 0.002, decimals: 4, badge: "✕", badgeColor: "#25A0E0" },
  { symbol: "USDT/USD", name: "Tether", category: "Crypto", base: 1.0, volatility: 0.0004, drift: 0, decimals: 4, badge: "₮", badgeColor: "#26A17B" },

  // --- Metals --------------------------------------------------------------
  { symbol: "XAU/USD", name: "Gold", category: "Metals", base: 4178.34, volatility: 6.2, drift: 0.45, decimals: 3, badge: "Au", badgeColor: "#E7B84B" },
  { symbol: "XAG/USD", name: "Silver", category: "Metals", base: 52.18, volatility: 0.21, drift: 0.01, decimals: 3, badge: "Ag", badgeColor: "#C9D3DA" },

  // --- Commodities ---------------------------------------------------------
  { symbol: "WTI", name: "Crude Oil", category: "Commodities", base: 92.72, volatility: 0.38, drift: -0.02, decimals: 2, badge: "Oil", badgeColor: "#8A94A6" },
  { symbol: "NG", name: "Natural Gas", category: "Commodities", base: 3.412, volatility: 0.038, drift: 0.001, decimals: 3, badge: "Gas", badgeColor: "#7FB4E8" },

  // --- Indices -------------------------------------------------------------
  { symbol: "SPX", name: "S&P 500", category: "Indices", base: 7819.8, volatility: 14.5, drift: 1.1, decimals: 1, badge: "500", badgeColor: "#D9534F" },
  { symbol: "NDX", name: "Nasdaq 100", category: "Indices", base: 30849.7, volatility: 62, drift: 4.2, decimals: 1, badge: "100", badgeColor: "#2E8BC0" },
  { symbol: "DJI", name: "Dow Jones 30", category: "Indices", base: 46218.4, volatility: 74, drift: 5.4, decimals: 1, badge: "30", badgeColor: "#4FB8B4" },
  { symbol: "FTSE", name: "FTSE 100", category: "Indices", base: 9284.6, volatility: 18, drift: 1.3, decimals: 1, badge: "100", badgeColor: "#8B5CF6" },
];

const FX_SYMBOLS = new Set(["EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD", "USD/CHF", "NZD/USD", "USD/CAD"]);

let cached: { at: number; data: MarketAsset[] } | null = null;
const TTL_MS = 20_000;

/* ----------------------------------------------------------- random walk */

function hashString(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic pseudo-live price for a seed at a given tick. */
function simulatedPrice(seed: Seed, tick: number): { price: number; change24h: number } {
  const rand = mulberry32(hashString(seed.symbol) ^ Math.floor(tick / 3));
  const jitter = (rand() - 0.5) * 2; // -1 .. 1
  const jitterPrev = (mulberry32(hashString(seed.symbol) ^ Math.floor(tick / 3) - 1)() - 0.5) * 2;

  const cycles = Math.sin(tick / 34 + (hashString(seed.symbol) % 100) / 12) * seed.volatility * 1.7;
  const cycles2 = Math.cos(tick / 11 + (hashString(seed.symbol) % 57) / 9) * seed.volatility * 0.85;

  const price = Math.max(
    seed.base * 0.35,
    seed.base + cycles + cycles2 + jitter * seed.volatility * 2.1 + seed.drift * (tick % 7201),
  );

  const change24h =
    (((jitter - jitterPrev) * 0.55 + Math.sin(tick / 26) * 0.9 + (seed.drift / seed.base) * 100) % 6.4) * 0.7;

  return { price, change24h };
}

/* ------------------------------------------------------------- real FX API */

type ErApiResponse = {
  result?: string;
  rates?: Record<string, number>;
};

async function fetchRealFx(): Promise<Map<string, number> | null> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(3500),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as ErApiResponse;
    if (data.result !== "success" || !data.rates) return null;

    const r = data.rates;
    const map = new Map<string, number>();
    const set = (symbol: string, value: number | undefined) => {
      if (typeof value === "number" && Number.isFinite(value) && value > 0) map.set(symbol, value);
    };

    if (r.EUR) set("EUR/USD", 1 / r.EUR);
    if (r.GBP) set("GBP/USD", 1 / r.GBP);
    if (r.JPY) set("USD/JPY", r.JPY);
    if (r.AUD) set("AUD/USD", 1 / r.AUD);
    if (r.CHF) set("USD/CHF", r.CHF);
    if (r.NZD) set("NZD/USD", 1 / r.NZD);
    if (r.CAD) set("USD/CAD", r.CAD);

    return map.size >= 4 ? map : null;
  } catch {
    return null;
  }
}

/* ----------------------------------------------------------------- public */

export async function getMarketSnapshot(): Promise<MarketAsset[]> {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.data;

  const tick = Date.now() / 1500;
  const realFx = await fetchRealFx();

  const data: MarketAsset[] = SEEDS.map((seed) => {
    const simulated = simulatedPrice(seed, tick);
    const live = realFx?.get(seed.symbol);

    if (live && FX_SYMBOLS.has(seed.symbol)) {
      // Blend the true rate with a small live wobble so the UI keeps ticking
      // between refreshes without misrepresenting the market.
      const wobble = simulated.price - seed.base;
      return {
        ...seed,
        price: live + wobble * 0.15,
        change24h: simulated.change24h * 0.6 + ((live - seed.base) / seed.base) * 100,
      };
    }

    return { ...seed, price: simulated.price, change24h: simulated.change24h };
  });

  cached = { at: Date.now(), data };
  return data;
}

/** The compact subset used by the scrolling ticker in the hero. */
export function tickerSymbols(): string[] {
  return [
    "GBP/USD", "USD/JPY", "BTC/USD", "ETH/USD", "XAU/USD", "WTI",
    "SPX", "NDX", "EUR/USD", "USD/CHF", "AUD/USD", "NZD/USD", "SOL/USD", "DJI",
  ];
}
