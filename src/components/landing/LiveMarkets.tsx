"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import clsx from "clsx";
import type { MarketAsset } from "@/lib/market";
import { useMarket } from "@/lib/useMarket";
import { formatPercent } from "@/lib/format";
import { Reveal } from "@/components/ui/Reveal";
import { ArrowRight, RefreshCw, Search } from "@/components/ui/icons";

const TABS: Array<MarketAsset["category"] | "All"> = [
  "All",
  "Forex",
  "Crypto",
  "Metals",
  "Commodities",
  "Indices",
];

function Glyph({ asset }: { asset: MarketAsset }) {
  if (asset.badge) {
    return (
      <span
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[12px] font-black text-[#04191F]"
        style={{ backgroundColor: asset.badgeColor || "#4FB8B4" }}
        aria-hidden="true"
      >
        {asset.badge}
      </span>
    );
  }
  if (asset.flag) {
    return (
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/[0.06] text-[16px]" aria-hidden="true">
        {asset.flag}
      </span>
    );
  }
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-400/20 text-[12px] font-bold text-brand-300">
      {asset.symbol.slice(0, 1)}
    </span>
  );
}

export function LiveMarkets({ initial }: { initial: MarketAsset[] }) {
  const { assets, live, updatedAt } = useMarket(initial);
  const [tab, setTab] = useState<(typeof TABS)[number]>("All");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return assets.filter((a) => {
      const matchesTab = tab === "All" || a.category === tab;
      const matchesQuery =
        !q || a.symbol.toLowerCase().includes(q) || a.name.toLowerCase().includes(q);
      return matchesTab && matchesQuery;
    });
  }, [assets, tab, query]);

  return (
    <section id="markets" className="relative scroll-mt-24 border-y border-white/[0.06] bg-ink-900/45 py-20 sm:py-24">
      <div className="container-x">
        <Reveal>
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <h2 className="section-title text-left">Live Markets</h2>
              <p className="mt-3.5 max-w-lg text-[15px] leading-relaxed text-brand-300/80">
                Explore the most popular assets available on the platform. Prices refresh in real
                time so you always trade on the latest quote.
              </p>
            </div>
            <Link href="/signup" className="btn-primary shrink-0 px-6 py-3.5">
              Start Trading
              <ArrowRight size={16} />
            </Link>
          </div>
        </Reveal>

        <Reveal delay={80} className="mt-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {TABS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setTab(item)}
                  className={clsx(
                    "shrink-0 rounded-full border px-4 py-2 text-[12.5px] font-semibold transition",
                    tab === item
                      ? "border-brand-400/45 bg-brand-400/[0.14] text-brand-100"
                      : "border-white/10 bg-white/[0.03] text-brand-300/70 hover:border-white/20 hover:text-brand-200",
                  )}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden items-center gap-1.5 text-[11.5px] font-medium text-brand-300/60 sm:flex">
                <RefreshCw size={12} className={live ? "text-emerald-400" : "text-amber-400"} />
                {updatedAt
                  ? `${live ? "Streaming" : "Cached"} · ${new Date(updatedAt).toLocaleTimeString(
                      "en-GB",
                      { hour: "2-digit", minute: "2-digit", second: "2-digit" },
                    )}`
                  : "Connecting…"}
              </span>
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-300/50" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search asset"
                  className="input w-full pl-10 lg:w-[230px]"
                  aria-label="Search assets"
                />
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={120} className="mt-6">
          <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-ink-700/50 shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.07] bg-white/[0.02]">
                    <th className="table-th">Asset</th>
                    <th className="table-th">Category</th>
                    <th className="table-th text-right">Price</th>
                    <th className="table-th text-right">24h Change</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((asset) => {
                    const up = asset.change24h >= 0;
                    return (
                      <tr
                        key={asset.symbol}
                        className="border-b border-white/[0.05] transition-colors last:border-0 hover:bg-white/[0.035]"
                      >
                        <td className="table-td">
                          <div className="flex items-center gap-3.5">
                            <Glyph asset={asset} />
                            <div className="leading-tight">
                              <div className="text-[14.5px] font-bold text-brand-100">{asset.symbol}</div>
                              <div className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-brand-300/55">
                                {asset.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="table-td text-brand-300/80">{asset.category}</td>
                        <td className="table-td numeric text-right text-[14.5px] font-semibold text-brand-100">
                          {asset.price.toLocaleString("en-US", {
                            minimumFractionDigits: asset.decimals,
                            maximumFractionDigits: asset.decimals,
                          })}
                        </td>
                        <td
                          className={clsx(
                            "table-td numeric text-right font-semibold",
                            up ? "text-emerald-400" : "text-rose-400",
                          )}
                        >
                          {formatPercent(asset.change24h, 2)}
                        </td>
                      </tr>
                    );
                  })}
                  {!rows.length && (
                    <tr>
                      <td colSpan={4} className="table-td py-12 text-center text-brand-300/60">
                        No assets match “{query}”.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default LiveMarkets;
