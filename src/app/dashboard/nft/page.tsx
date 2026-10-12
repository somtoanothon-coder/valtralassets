import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { NFTS, NFT_STATS } from "@/lib/nft";
import { ensureSchema, isDatabaseConfigured, query, type NftHoldingRow } from "@/lib/db";
import { formatUsd, statusTone } from "@/lib/format";
import { NftArtwork } from "@/components/ui/NftArtwork";
import { ArrowRight, Gem, Layers } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "NFT Marketplace",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DashboardNftPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  let holdings: NftHoldingRow[] = [];
  if (isDatabaseConfigured()) {
    await ensureSchema().catch(() => undefined);
    holdings = await query<NftHoldingRow>(
      `SELECT * FROM nft_holdings WHERE user_id = $1 ORDER BY created_at DESC`,
      [user.id],
    ).catch(() => []);
  }

  const byslug = new Map(holdings.map((h) => [h.slug, h]));

  return (
    <div className="space-y-8">
      <header>
        <span className="chip">
          <Gem size={12} />
          Digital Collectibles
        </span>
        <h1 className="mt-4 font-display text-[27px] font-extrabold tracking-[-0.02em] text-brand-100 sm:text-[31px]">
          NFT Marketplace
        </h1>
        <p className="mt-2.5 max-w-2xl text-[14px] leading-relaxed text-brand-300/75">
          Discover, collect and trade unique digital assets. Every piece is minted on-chain with
          verified provenance, and purchases settle straight from your Valtra wallet.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {NFT_STATS.map((stat) => (
          <div key={stat.label} className="card px-5 py-6 text-center">
            <p className="bg-gradient-to-r from-brand-green to-brand-400 bg-clip-text font-display text-[24px] font-extrabold leading-none text-transparent">
              {stat.value}
            </p>
            <p className="mt-2 text-[12px] font-medium text-brand-300/70">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {NFTS.map((nft) => {
          const held = byslug.get(nft.slug);
          return (
            <article
              key={nft.slug}
              className="group overflow-hidden rounded-2xl border border-white/[0.07] bg-ink-700/55 shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-400/35 hover:shadow-glow"
            >
              <div className="relative aspect-square overflow-hidden">
                <div className="h-full w-full transition-transform duration-700 group-hover:scale-[1.06]">
                  <NftArtwork nft={nft} animate={false} />
                </div>
                <span className="absolute left-3 top-3 rounded-full border border-white/15 bg-ink-900/75 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-200 backdrop-blur">
                  {nft.rarity}
                </span>
                {held && (
                  <span
                    className={`absolute right-3 top-3 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide backdrop-blur ${statusTone(
                      held.status,
                    )}`}
                  >
                    {held.status === "pending" ? "Awaiting" : held.status === "approved" ? "Owned" : held.status}
                  </span>
                )}
              </div>

              <div className="p-5">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-brand-400/85">
                  {nft.category}
                </p>
                <h2 className="mt-2 truncate font-display text-[15.5px] font-bold text-brand-100">
                  {nft.name}
                </h2>

                <div className="mt-3.5 flex items-end justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-300/55">
                      Price
                    </p>
                    <p className="numeric text-[18px] font-extrabold leading-tight text-brand-100">
                      {formatUsd(nft.priceUsd)}
                    </p>
                    <p className="numeric text-[11.5px] font-medium text-brand-400">
                      {nft.priceEth.toFixed(4)} ETH
                    </p>
                  </div>
                  <span className="mb-1 inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-semibold text-brand-300/80">
                    <Layers size={10} />
                    {nft.chain}
                  </span>
                </div>

                <Link
                  href={`/dashboard/nft/${nft.slug}`}
                  className="btn-primary mt-5 w-full py-2.5 text-[13px]"
                >
                  View Details
                  <ArrowRight size={14} />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
