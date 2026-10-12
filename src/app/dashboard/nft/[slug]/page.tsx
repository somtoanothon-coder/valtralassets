import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getNft, NFTS } from "@/lib/nft";
import { getWallets } from "@/lib/wallets";
import { ensureSchema, isDatabaseConfigured, queryOne, type NftHoldingRow } from "@/lib/db";
import { formatDate, formatUsd, statusTone } from "@/lib/format";
import { NftArtwork } from "@/components/ui/NftArtwork";
import { PaymentForm } from "@/components/dashboard/PaymentForm";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Fingerprint,
  Gem,
  Globe,
  Layers,
  ShieldCheck,
  Sparkles,
  Target,
} from "@/components/ui/icons";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const nft = getNft(slug);
  return {
    title: nft ? nft.name : "Collectible",
    description: nft ? nft.description.slice(0, 155) : undefined,
    robots: { index: false, follow: false },
  };
}

export const dynamic = "force-dynamic";

export default async function NftDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { slug } = await params;
  const nft = getNft(slug);
  if (!nft) notFound();

  const wallets = await getWallets();

  let holding: NftHoldingRow | null = null;
  if (isDatabaseConfigured()) {
    await ensureSchema().catch(() => undefined);
    holding = await queryOne<NftHoldingRow>(
      `SELECT * FROM nft_holdings WHERE user_id = $1 AND slug = $2 LIMIT 1`,
      [user.id, nft.slug],
    ).catch(() => null);
  }

  const other = NFTS.filter((n) => n.slug !== nft.slug).slice(0, 3);

  const specs = [
    { icon: Layers, label: "Blockchain", value: nft.chain },
    { icon: ShieldCheck, label: "Token standard", value: nft.tokenStandard },
    { icon: Fingerprint, label: "Contract", value: nft.contract },
    { icon: Target, label: "Token ID", value: `#${nft.tokenId}` },
    { icon: Sparkles, label: "Rarity", value: nft.rarity },
    { icon: Gem, label: "Edition", value: nft.edition },
    { icon: Globe, label: "Creator", value: nft.creator },
    { icon: CalendarDays, label: "Created", value: formatDate(nft.createdOn) },
  ];

  return (
    <div className="space-y-10">
      <nav className="flex items-center gap-2 text-[12.5px] text-brand-300/60" aria-label="Breadcrumb">
        <Link href="/dashboard/nft" className="font-semibold text-brand-400 transition hover:text-brand-300">
          NFT Marketplace
        </Link>
        <span>/</span>
        <span className="text-brand-300/80">{nft.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        {/* Artwork ------------------------------------------------------ */}
        <div className="space-y-5">
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.09] shadow-card">
            <div className="aspect-square">
              <NftArtwork nft={nft} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Price", value: formatUsd(nft.priceUsd) },
              { label: "In ETH", value: nft.priceEth.toFixed(4) },
              { label: "Supply", value: nft.edition.replace("1 of ", "") },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-white/[0.07] bg-ink-700/50 px-4 py-3.5 text-center"
              >
                <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-brand-300/60">
                  {item.label}
                </p>
                <p className="numeric mt-1.5 text-[15px] font-extrabold text-brand-100">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Details + purchase ------------------------------------------ */}
        <div className="space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="chip">
                <Sparkles size={12} />
                {nft.category}
              </span>
              <span className="chip">{nft.series}</span>
              {holding && (
                <span
                  className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${statusTone(
                    holding.status,
                  )}`}
                >
                  {holding.status === "pending"
                    ? "Order awaiting approval"
                    : holding.status === "approved"
                      ? "You own this piece"
                      : holding.status}
                </span>
              )}
            </div>

            <h1 className="mt-4 font-display text-[28px] font-extrabold leading-tight tracking-[-0.02em] text-brand-100 sm:text-[34px]">
              {nft.name}
            </h1>

            <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-2">
              <span className="numeric font-display text-[30px] font-black leading-none text-brand-100">
                {formatUsd(nft.priceUsd)}
              </span>
              <span className="numeric text-[15px] font-semibold text-brand-400">
                ≈ {nft.priceEth.toFixed(4)} ETH
              </span>
            </div>

            <p className="mt-5 text-[14px] leading-[1.8] text-brand-300/80">{nft.description}</p>
          </div>

          <section className="rounded-2xl border border-white/[0.07] bg-ink-700/50 p-5">
            <h2 className="font-display text-[15px] font-bold text-brand-100">
              What the owner receives
            </h2>
            <ul className="mt-3.5 space-y-2.5">
              {nft.highlights.map((item) => (
                <li key={item} className="flex gap-2.5 text-[13px] leading-relaxed text-brand-300/80">
                  <Check size={15} className="mt-0.5 shrink-0 text-brand-400" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-white/[0.07] bg-ink-700/50 p-5">
            <h2 className="font-display text-[15px] font-bold text-brand-100">Properties</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {nft.traits.map((trait) => (
                <div
                  key={trait.label}
                  className="rounded-xl border border-brand-400/15 bg-brand-400/[0.05] px-4 py-3"
                >
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-brand-400/80">
                    {trait.label}
                  </p>
                  <p className="mt-1.5 text-[13.5px] font-bold text-brand-100">{trait.value}</p>
                  <p className="mt-0.5 text-[11px] text-brand-300/60">{trait.rarity}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-white/[0.07] pt-5">
              {specs.map((spec) => {
                const Icon = spec.icon;
                return (
                  <div key={spec.label} className="flex items-start gap-2.5">
                    <Icon size={14} className="mt-0.5 shrink-0 text-brand-400/80" />
                    <div className="min-w-0">
                      <p className="text-[10.5px] font-semibold uppercase tracking-wider text-brand-300/55">
                        {spec.label}
                      </p>
                      <p className="truncate text-[12.5px] font-semibold text-brand-200">
                        {spec.value}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {holding && holding.status !== "rejected" ? (
            <div className="rounded-2xl border border-brand-400/30 bg-brand-400/[0.08] p-6 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-grad text-[#04191F]">
                <Check size={24} />
              </span>
              <h2 className="mt-4 font-display text-[17px] font-bold text-brand-100">
                {holding.status === "pending"
                  ? "Order received — awaiting verification"
                  : "This collectible is yours"}
              </h2>
              <p className="mx-auto mt-2.5 max-w-md text-[13px] leading-relaxed text-brand-300/75">
                {holding.status === "pending"
                  ? "We are verifying your transfer on-chain. You will get an email the moment it clears, and the artwork unlocks in your dashboard."
                  : "Your ownership certificate is available in your dashboard, and the bonus materials listed above are being prepared for delivery."}
              </p>
              <Link href="/dashboard" className="btn-secondary mt-5 px-5 py-3 text-[13px]">
                Back to overview
              </Link>
            </div>
          ) : (
            <PaymentForm
              wallets={wallets}
              defaultPurpose="nft"
              itemSlug={nft.slug}
              itemName={nft.name}
              fixedAmount={nft.priceUsd}
              compact
            />
          )}
        </div>
      </div>

      {/* More from the collection ------------------------------------- */}
      <section>
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-[20px] font-bold text-brand-100">
            More from the collection
          </h2>
          <Link
            href="/dashboard/nft"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-400 transition hover:text-brand-300"
          >
            View all
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {other.map((item) => (
            <Link
              key={item.slug}
              href={`/dashboard/nft/${item.slug}`}
              className="group flex gap-4 rounded-2xl border border-white/[0.07] bg-ink-700/50 p-4 transition hover:border-brand-400/35 hover:bg-ink-600/60"
            >
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                <NftArtwork nft={item} animate={false} />
              </div>
              <div className="min-w-0">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-brand-400/80">
                  {item.category}
                </p>
                <p className="mt-1 truncate text-[13.5px] font-bold text-brand-100">{item.name}</p>
                <p className="numeric mt-1 text-[13px] font-bold text-brand-300">
                  {formatUsd(item.priceUsd)}
                </p>
                <p className="numeric text-[11px] text-brand-400">{item.priceEth.toFixed(4)} ETH</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
