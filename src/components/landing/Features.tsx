import { FEATURES } from "@/lib/content";
import { FeatureIcon } from "@/components/ui/icons";
import { Reveal } from "@/components/ui/Reveal";

export function Features() {
  return (
    <section id="features" className="relative scroll-mt-24 py-20 sm:py-24">
      <div className="container-x">
        <Reveal className="text-center">
          <h2 className="section-title">Everything You Need to Win</h2>
          <p className="section-sub">
            A complete ecosystem designed for both active traders and passive investors.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <Reveal key={feature.title} delay={index * 60}>
              <article className="card card-hover group h-full">
                <span className="grid h-12 w-12 place-items-center rounded-xl border border-brand-400/20 bg-brand-400/[0.09] text-brand-400 transition-colors duration-300 group-hover:border-brand-400/45 group-hover:bg-brand-400/[0.16]">
                  <FeatureIcon name={feature.icon} />
                </span>
                <h3 className="mt-5 font-display text-[17.5px] font-bold text-brand-100">
                  {feature.title}
                </h3>
                <p className="mt-2.5 text-[14px] leading-[1.7] text-brand-300/75">{feature.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Features;
