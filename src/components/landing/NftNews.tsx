import { NFT_NEWS, NFT_STATS } from "@/lib/nft";
import { Reveal } from "@/components/ui/Reveal";
import { BarChart3 } from "@/components/ui/icons";

export function NftNews() {
  return (
    <section className="relative border-y border-white/[0.06] bg-ink-900/45 py-20 sm:py-24">
      <div className="container-x">
        <Reveal className="text-center">
          <h2 className="section-title">NFT News &amp; Trends</h2>
          <p className="section-sub">
            Stay ahead with the latest updates from the digital collectibles world.
          </p>
        </Reveal>

        <Reveal delay={60} className="mt-10">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {NFT_STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/[0.07] bg-ink-700/55 px-6 py-7 text-center shadow-card"
              >
                <p className="bg-gradient-to-r from-brand-green to-brand-400 bg-clip-text font-display text-[28px] font-extrabold leading-none text-transparent sm:text-[31px]">
                  {stat.value}
                </p>
                <p className="mt-2.5 text-[12.5px] font-medium text-brand-300/70">{stat.label}</p>
              </div>
            ))}
          </div>
        </Reveal>

        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {NFT_NEWS.map((item, index) => (
            <Reveal key={item.title} delay={index * 55}>
              <article className="card card-hover flex h-full flex-col">
                <div className="flex items-center gap-2.5">
                  <span
                    className="rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide"
                    style={{
                      backgroundColor: `${item.tone}22`,
                      color: item.tone,
                      border: `1px solid ${item.tone}44`,
                    }}
                  >
                    {item.tag}
                  </span>
                  <span className="text-[11.5px] font-medium text-brand-300/55">{item.time}</span>
                </div>

                <h3 className="mt-4 font-display text-[16.5px] font-bold leading-snug text-brand-100">
                  {item.title}
                </h3>
                <p className="mt-2.5 flex-1 text-[13.5px] leading-[1.7] text-brand-300/75">
                  {item.body}
                </p>

                <div className="mt-5 flex items-center gap-2 border-t border-white/[0.07] pt-4">
                  <BarChart3 size={13} className="shrink-0 text-brand-400" />
                  <span className="text-[12px] font-semibold text-brand-300/85">{item.metric}</span>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export default NftNews;
