"use client";

import clsx from "clsx";
import { useMemo } from "react";
import type { MarketAsset } from "@/lib/market";
import { tickerSymbols } from "@/lib/market";
import { useMarket } from "@/lib/useMarket";
import { formatPercent } from "@/lib/format";

function AssetGlyph({ asset }: { asset: MarketAsset }) {
  if (asset.badge) {
    return (
      <span
        className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-black"
        style={{ backgroundColor: asset.badgeColor || "#4FB8B4", color: "#04191F" }}
        aria-hidden="true"
      >
        {asset.badge}
      </span>
    );
  }
  if (asset.flag) {
    return (
      <span className="grid h-6 w-6 shrink-0 place-items-center text-[15px] leading-none" aria-hidden="true">
        {asset.flag}
      </span>
    );
  }
  return (
    <span
      className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-400/20 text-[10px] font-bold text-brand-300"
      aria-hidden="true"
    >
      {asset.symbol.slice(0, 2)}
    </span>
  );
}

function TickerItem({ asset }: { asset: MarketAsset }) {
  const up = asset.change24h >= 0;
  return (
    <div className="flex shrink-0 items-center gap-3 border-r border-white/[0.07] px-6 py-3">
      <AssetGlyph asset={asset} />
      <div className="flex flex-col leading-tight">
        <span className="text-[11.5px] font-semibold text-brand-300/85">{asset.name}</span>
        <span className="numeric text-[15px] font-bold text-brand-100">
          {asset.price.toLocaleString("en-US", {
            minimumFractionDigits: asset.decimals,
            maximumFractionDigits: asset.decimals,
          })}
        </span>
      </div>
      <span
        className={clsx(
          "numeric text-[11.5px] font-semibold",
          up ? "text-emerald-400" : "text-rose-400",
        )}
      >
        {formatPercent(asset.change24h, 2)}
      </span>
    </div>
  );
}

export function MarketTicker({ initial }: { initial: MarketAsset[] }) {
  const { assets, live } = useMarket(initial);

  const items = useMemo(() => {
    const wanted = tickerSymbols();
    const picked = wanted
      .map((symbol) => assets.find((a) => a.symbol === symbol))
      .filter((a): a is MarketAsset => Boolean(a));
    return picked.length ? picked : assets;
  }, [assets]);

  // Duplicated once so the CSS marquee can loop seamlessly at -50%.
  const loop = [...items, ...items];

  return (
    <div className="relative border-y border-white/[0.07] bg-ink-900/85 backdrop-blur">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-ink-900 to-transparent sm:w-24" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-ink-900 to-transparent sm:w-24" />

      <div className="flex items-center">
        <div className="z-20 hidden shrink-0 items-center gap-2 border-r border-white/[0.07] bg-ink-900 px-5 py-3.5 lg:flex">
          <span className="relative flex h-2 w-2">
            <span
              className={clsx(
                "absolute inline-flex h-full w-full rounded-full",
                live ? "animate-ping bg-emerald-400/70" : "bg-amber-400/70",
              )}
            />
            <span
              className={clsx(
                "relative inline-flex h-2 w-2 rounded-full",
                live ? "bg-emerald-400" : "bg-amber-400",
              )}
            />
          </span>
          <span className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-brand-300/80">
            {live ? "Live Markets" : "Markets"}
          </span>
        </div>

        <div className="group flex-1 overflow-hidden">
          <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused]">
            {loop.map((asset, index) => (
              <TickerItem key={`${asset.symbol}-${index}`} asset={asset} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MarketTicker;
