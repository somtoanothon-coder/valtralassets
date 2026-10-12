"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import type { MarketAsset } from "@/lib/market";
import { useMarket } from "@/lib/useMarket";
import { HERO_SLIDES, HERO_STATS } from "@/lib/content";
import { formatPercent } from "@/lib/format";
import { ArrowRight, LogIn, Rocket, ShieldCheck, Sparkles, TrendingDown, TrendingUp } from "@/components/ui/icons";
import { MarketTicker } from "./MarketTicker";

const SLIDE_MS = 5200;

function Sparkline({ values, up }: { values: number[]; up: boolean }) {
  const path = useMemo(() => {
    if (values.length < 2) return { line: "", area: "" };
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const step = 100 / (values.length - 1);
    const points = values.map((v, i) => [i * step, 38 - ((v - min) / span) * 34] as const);
    const line = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`).join(" ");
    const area = `${line} L100 40 L0 40 Z`;
    return { line, area };
  }, [values]);

  return (
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-14 w-full" aria-hidden="true">
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={up ? "#27B58D" : "#F24B5E"} stopOpacity="0.32" />
          <stop offset="100%" stopColor={up ? "#27B58D" : "#F24B5E"} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={path.area} fill="url(#spark-fill)" />
      <path
        d={path.line}
        fill="none"
        stroke={up ? "#27B58D" : "#F24B5E"}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function LivePriceCard({ assets }: { assets: MarketAsset[] }) {
  const btc = assets.find((a) => a.symbol === "BTC/USD");
  const eth = assets.find((a) => a.symbol === "ETH/USD");
  const eur = assets.find((a) => a.symbol === "EUR/USD");
  const [history, setHistory] = useState<number[]>([]);

  useEffect(() => {
    if (!btc) return;
    setHistory((prev) => [...prev.slice(-39), btc.price]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [btc?.price]);

  const up = (btc?.change24h ?? 0) >= 0;
  const series = history.length > 1 ? history : [83100, 83210, 83140, 83380, 83442];

  const rows = [btc, eth, eur].filter(Boolean) as MarketAsset[];

  return (
    <div className="relative">
      <div className="absolute -inset-6 rounded-[36px] bg-brand-grad-soft blur-2xl" aria-hidden="true" />
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.09] bg-ink-800/85 p-5 shadow-card backdrop-blur-xl sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#F7931A]/18 text-[13px] font-black text-[#F7931A]">
              ₿
            </span>
            <div className="leading-tight">
              <div className="text-[12.5px] font-semibold text-brand-200">Bitcoin</div>
              <div className="text-[10.5px] font-medium uppercase tracking-wider text-brand-300/60">
                BTC / USD · Spot
              </div>
            </div>
          </div>
          <span
            className={clsx(
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold",
              up
                ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
                : "border-rose-400/25 bg-rose-400/10 text-rose-300",
            )}
          >
            {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {formatPercent(btc?.change24h ?? 0, 2)}
          </span>
        </div>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div className="numeric text-[30px] font-extrabold leading-none text-brand-100 sm:text-[34px]">
            {btc
              ? `$${btc.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : "$83,442.00"}
          </div>
          <span className="mb-1 text-[11px] font-medium text-brand-300/60">24h range</span>
        </div>

        <div className="mt-3">
          <Sparkline values={series} up={up} />
        </div>

        <div className="mt-4 space-y-1.5">
          {rows.map((asset) => {
            const positive = asset.change24h >= 0;
            return (
              <div
                key={asset.symbol}
                className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2.5"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="grid h-6 w-6 place-items-center rounded-full text-[10px] font-black text-[#04191F]"
                    style={{ backgroundColor: asset.badgeColor || (asset.flag ? "#4FB8B4" : "#4FB8B4") }}
                  >
                    {asset.badge || asset.flag || asset.symbol.slice(0, 1)}
                  </span>
                  <span className="text-[12.5px] font-semibold text-brand-200">{asset.symbol}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="numeric text-[12.5px] font-semibold text-brand-100">
                    {asset.price.toLocaleString("en-US", {
                      minimumFractionDigits: asset.decimals > 2 ? 2 : asset.decimals,
                      maximumFractionDigits: asset.decimals > 2 ? 2 : asset.decimals,
                    })}
                  </span>
                  <span
                    className={clsx(
                      "numeric w-[62px] text-right text-[11.5px] font-semibold",
                      positive ? "text-emerald-400" : "text-rose-400",
                    )}
                  >
                    {formatPercent(asset.change24h, 2)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-xl border border-brand-400/15 bg-brand-400/[0.07] px-3.5 py-2.5">
          <ShieldCheck size={15} className="shrink-0 text-brand-400" />
          <p className="text-[11.5px] leading-snug text-brand-300/85">
            Segregated client wallets · manual review on every deposit
          </p>
        </div>
      </div>
    </div>
  );
}

export function Hero({ initial }: { initial: MarketAsset[] }) {
  const { assets } = useMarket(initial);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setSlide((s) => (s + 1) % HERO_SLIDES.length), SLIDE_MS);
    return () => window.clearInterval(id);
  }, []);

  const current = HERO_SLIDES[slide];

  return (
    <section className="relative isolate overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 -z-10 bg-grid [background-size:64px_64px]" aria-hidden="true" />
      <div
        className="absolute -left-40 -top-40 -z-10 h-[520px] w-[520px] rounded-full opacity-60 blur-[130px] transition-colors duration-1000"
        style={{ backgroundColor: `${current.tone}33` }}
        aria-hidden="true"
      />
      <div className="absolute -right-32 top-32 -z-10 h-[440px] w-[440px] rounded-full bg-brand-3/20 blur-[130px]" aria-hidden="true" />

      {/* Rotating display wordmark — mirrors the reference hero */}
      <div className="pointer-events-none absolute inset-x-0 top-[26%] -z-[5] flex justify-end overflow-hidden pr-4 sm:top-[22%] lg:pr-16" aria-hidden="true">
        <span
          key={current.word}
          className="animate-rise font-display text-[19vw] font-black leading-none tracking-[-0.045em] opacity-[0.14] sm:text-[15vw] lg:text-[11.5vw]"
          style={{ color: current.tone }}
        >
          {current.word}
        </span>
      </div>

      <div className="container-x relative pb-14 pt-12 sm:pb-20 sm:pt-16 lg:pb-24 lg:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-14">
          <div className="animate-rise">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-400/25 bg-brand-400/[0.08] px-3.5 py-1.5 text-[11.5px] font-semibold text-brand-400">
              <Sparkles size={13} />
              Next-Gen Trading &amp; Investment Platform
            </span>

            <h1 className="mt-5 font-display text-[40px] font-black leading-[1.03] tracking-[-0.032em] text-brand-100 sm:text-[56px] lg:text-[64px]">
              Trade Smarter.
              <br />
              <span className="bg-gradient-to-r from-brand-green via-brand-400 to-brand-500 bg-clip-text text-transparent glow-text">
                Invest Better.
              </span>
            </h1>

            <p className="mt-6 max-w-[540px] text-[15.5px] leading-[1.75] text-brand-300/85 sm:text-[16.5px]">
              Access global markets, fixed-term investment plans, IPOs, and a secure wallet — all in
              one powerful platform built for modern traders and investors.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/signup" className="btn-primary px-6 py-3.5 text-[14.5px]">
                <Rocket size={17} />
                Create Free Account
              </Link>
              <Link href="/login" className="btn-secondary px-6 py-3.5 text-[14.5px]">
                <LogIn size={17} />
                Log In
              </Link>
            </div>

            <dl className="mt-10 grid max-w-[460px] grid-cols-3 gap-6">
              {HERO_STATS.map((stat) => (
                <div key={stat.label} className="border-l-2 border-brand-400/25 pl-4">
                  <dt className="font-display text-[26px] font-extrabold leading-none text-brand-100 sm:text-[30px]">
                    {stat.value}
                  </dt>
                  <dd className="mt-1.5 text-[11.5px] font-medium text-brand-300/70">{stat.label}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-9 flex items-center gap-2.5" role="tablist" aria-label="Platform highlights">
              {HERO_SLIDES.map((s, i) => (
                <button
                  key={s.word}
                  type="button"
                  role="tab"
                  aria-selected={i === slide}
                  aria-label={s.word}
                  onClick={() => setSlide(i)}
                  className={clsx(
                    "h-1.5 rounded-full transition-all duration-300",
                    i === slide ? "w-10 bg-brand-400" : "w-4 bg-white/20 hover:bg-white/35",
                  )}
                />
              ))}
              <span className="ml-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-300/60">
                {current.eyebrow}
              </span>
            </div>
          </div>

          <div className="animate-rise lg:pl-4" style={{ animationDelay: "120ms" }}>
            <LivePriceCard assets={assets} />
          </div>
        </div>
      </div>

      <MarketTicker initial={initial} />
    </section>
  );
}

export default Hero;
