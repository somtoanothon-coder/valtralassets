import Link from "next/link";
import { NFTS } from "@/lib/nft";
import { NftArtwork } from "@/components/ui/NftArtwork";
import { Reveal } from "@/components/ui/Reveal";
import { ArrowRight, Layers, Sparkles } from "@/components/ui/icons";

export function NftMarketplace() {
  return (
    <section id="nft" className="relative scroll-mt-24 py-20 sm:py-24">
      <div className="container-x">
        <Reveal className="text-center">
          <span className="chip mx-auto mb-4">
            <Sparkles size={12} />
            Digital Collectibles
          </span>
          <h2 className="section-title">NFT Marketplace</h2>
          <p className="section-sub">Discover, collect, and trade unique digital assets.</p>
        </Reveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {NFTS.map((nft, index) => (
            <Reveal key={nft.slug} delay={index * 70}>
              <article className="group h-full overflow-hidden rounded-2xl border border-white/[0.07] bg-ink-700/55 shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-400/35 hover:shadow-glow">
                <div className="relative aspect-square overflow-hidden">
                  <div className="h-full w-full transition-transform duration-700 group-hover:scale-[1.06]">
                    <NftArtwork nft={nft} animate={false} />
                  </div>
                  <span className="absolute left-3 top-3 rounded-full border border-white/15 bg-ink-900/75 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-200 backdrop-blur">
                    {nft.rarity}
                  </span>
                  <span className="absolute right-3 top-3 rounded-full border border-white/15 bg-ink-900/75 px-2.5 py-1 text-[10px] font-bold text-brand-300 backdrop-blur">
                    {nft.edition}
                  </span>
                </div>

                <div className="p-5">
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-brand-400/85">
                    {nft.category}
                  </p>
                  <h3 className="mt-2 truncate font-display text-[15.5px] font-bold text-brand-100">
                    {nft.name}
                  </h3>

                  <div className="mt-3.5 flex items-end justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-300/55">
                        Price
                      </p>
                      <p className="numeric text-[18px] font-extrabold leading-tight text-brand-100">
                        ${nft.priceUsd.toFixed(2)}
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
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export default NftMarketplace;
