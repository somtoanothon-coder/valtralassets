import { STEPS, SECURITY_POINTS, SECURITY_PILLARS, TESTIMONIALS } from "@/lib/content";
import { FeatureIcon } from "@/components/ui/icons";
import { Reveal } from "@/components/ui/Reveal";
import { Check, Star } from "@/components/ui/icons";

export function HowItWorks() {
  return (
    <section id="how" className="relative scroll-mt-24 border-y border-white/[0.06] bg-ink-900/45 py-20 sm:py-24">
      <div className="container-x">
        <Reveal className="text-center">
          <h2 className="section-title">How It Works</h2>
          <p className="section-sub">From signup to your first profit in four simple steps.</p>
        </Reveal>

        <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <Reveal key={step.number} delay={index * 70}>
              <li className="card card-hover group relative h-full text-center">
                <span className="pointer-events-none absolute inset-x-0 top-4 font-display text-[46px] font-black leading-none text-brand-400/[0.13]">
                  {step.number}
                </span>
                <div className="relative pt-8">
                  <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl border border-brand-400/20 bg-brand-400/[0.09] text-brand-400 transition-colors duration-300 group-hover:border-brand-400/45 group-hover:bg-brand-400/[0.16]">
                    <FeatureIcon name={step.icon} />
                  </span>
                  <h3 className="mt-5 font-display text-[16.5px] font-bold text-brand-100">
                    {step.title}
                  </h3>
                  <p className="mx-auto mt-2.5 max-w-[260px] text-[13.5px] leading-[1.7] text-brand-300/75">
                    {step.body}
                  </p>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Security() {
  return (
    <section id="security" className="relative scroll-mt-24 py-20 sm:py-24">
      <div className="container-x">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16">
          <Reveal>
            <h2 className="section-title text-left">Your Security Is Our Priority</h2>
            <p className="mt-4 max-w-xl text-[15px] leading-[1.75] text-brand-300/80">
              We combine bank-grade protections with transparent record keeping so you can focus on
              growing your wealth.
            </p>

            <ul className="mt-8 grid gap-3.5 sm:grid-cols-2">
              {SECURITY_POINTS.map((point) => (
                <li key={point} className="flex gap-3 text-[13.5px] leading-snug text-brand-200/90">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-400/15 text-brand-400">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 lg:gap-5">
            {SECURITY_PILLARS.map((pillar, index) => (
              <Reveal key={pillar.label} delay={index * 70}>
                <div className="card card-hover flex h-full items-center justify-center gap-3 py-8 sm:flex-col sm:gap-4 lg:flex-row lg:gap-5 lg:py-9">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-brand-400/20 bg-brand-400/[0.09] text-brand-400">
                    <FeatureIcon name={pillar.icon} />
                  </span>
                  <span className="font-display text-[17px] font-bold text-brand-100">
                    {pillar.label}
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function Testimonials() {
  return (
    <section className="relative border-y border-white/[0.06] bg-ink-900/45 py-20 sm:py-24">
      <div className="container-x">
        <Reveal className="text-center">
          <h2 className="section-title">Trusted by Traders Worldwide</h2>
          <p className="section-sub">
            Join a growing community of investors building wealth with confidence.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {TESTIMONIALS.map((item, index) => (
            <Reveal key={item.name} delay={index * 70}>
              <figure className="card card-hover flex h-full flex-col">
                <div className="flex gap-1" aria-label={`${item.rating} out of 5 stars`}>
                  {Array.from({ length: item.rating }, (_, i) => (
                    <Star key={i} size={15} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <blockquote className="mt-5 flex-1 text-[14px] leading-[1.75] text-brand-200/90">
                  “{item.quote}”
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-white/[0.07] pt-5">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-grad-soft text-[13px] font-extrabold text-brand-300 ring-1 ring-brand-400/25">
                    {item.name.charAt(0)}
                  </span>
                  <span className="leading-tight">
                    <span className="block text-[14px] font-bold text-brand-100">{item.name}</span>
                    <span className="block text-[12px] text-brand-300/60">{item.role}</span>
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
