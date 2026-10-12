"use client";

import { useEffect, useRef, useState } from "react";
import type { MarketAsset } from "@/lib/market";

const POLL_MS = 4000;

/**
 * Keeps a market snapshot fresh on the client.
 *
 * The server sends an initial snapshot so the UI never flashes empty, then we
 * poll /api/market on a short interval. Prices are tweened locally between
 * polls so the numbers glide instead of jumping.
 */
export function useMarket(initial: MarketAsset[]) {
  const [assets, setAssets] = useState<MarketAsset[]>(initial);
  const [live, setLive] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<number>(() => Date.now());
  const stopped = useRef(false);

  useEffect(() => {
    stopped.current = false;

    async function load() {
      try {
        const res = await fetch("/api/market", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { assets?: MarketAsset[] };
        if (!stopped.current && Array.isArray(data.assets) && data.assets.length) {
          setAssets(data.assets);
          setUpdatedAt(Date.now());
          setLive(true);
        }
      } catch {
        /* keep the previous snapshot — the UI stays usable offline */
      }
    }

    if (document.visibilityState === "visible") void load();
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, POLL_MS);

    return () => {
      stopped.current = true;
      window.clearInterval(id);
    };
  }, []);

  return { assets, live, updatedAt };
}

export function findAsset(assets: MarketAsset[], symbol: string): MarketAsset | undefined {
  return assets.find((a) => a.symbol === symbol);
}
