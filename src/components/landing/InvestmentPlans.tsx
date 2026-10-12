import Link from "next/link";
import clsx from "clsx";
import { PLANS } from "@/lib/plans";
import { Reveal } from "@/components/ui/Reveal";
import { ArrowRight, Check, PiggyBank, ShieldCheck, Sparkles } from "@/components/ui/icons";

export function InvestmentPlans({ signedIn = false }: { signedIn?: boolean }) {
  return (
    <section id="plans" className="relative scroll-mt-24 py-20 sm:py-24">
      <div className="container-x">
        <Reveal className="text-center">
          <span className="chip mx-auto mb-4">
            <PiggyBank size={12} />
            Fixed-Term Returns
          </span>
          <h2 className="section-title">Investment Plans</h2>
          <p className="section-sub">
            Put your capital to work with transparent, fixed-term plans and predictable returns.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {PLANS.map((plan, index) => (
            <Reveal key={plan.id} delay={index * 80}>
              <article
                className={clsx(
                  "relative flex h-full flex-col rounded-2xl border p-7 transition-all duration-300 hover:-translate-y-1.5",
                  plan.featured
                    ? "border-brand-400/45 bg-gradient-to-b from-brand-400/[0.11] to-ink-700/70 shadow-glow"
                    : "border-white/[0.07] bg-ink-700/55 shadow-card hover:border-brand-400/30",
                )}
              >
                {plan.featured && (
                  <span className="absolute -top-3 right-6 rounded-full bg-brand-grad px-3.5 py-1.5 text-[10.5px] font-extrabold uppercase tracking-[0.1em] text-[#04191F] shadow-pill">
                    Featured
                  </span>
                )}

                <div className="flex items-center gap-3">
                  <span
                    className={clsx(
                      "grid h-11 w-11 place-items-center rounded-xl border",
                      plan.featured
                        ? "border-brand-400/40 bg-brand-400/[0.16] text-brand-300"
                        : "border-white/10 bg-white/[0.05] text-brand-400",
                    )}
                  >
                    <PiggyBank size={20} />
                  </span>
                  <h3 className="font-display text-[18px] font-bold text-brand-100">{plan.name}</h3>
                </div>

                <p className="mt-3 text-[13.5px] leading-relaxed text-brand-300/70">{plan.tagline}</p>

                <div className="mt-6">
                  <p className="bg-gradient-to-r from-brand-green to-brand-400 bg-clip-text font-display text-[42px] font-black leading-none text-transparent">
                    {plan.roiPercent.toFixed(2)}%
                  </p>
                  <p className="mt-2 text-[12.5px] font-medium text-brand-300/70">
                    Total ROI over {plan.durationLabel}
                  </p>
                </div>

                <dl className="mt-6 space-y-0">
                  {[
                    { label: "Min Invest", value: `$${plan.minInvest.toLocaleString("en-US", { minimumFractionDigits: 2 })}` },
                    { label: "Max Invest", value: `$${plan.maxInvest.toLocaleString("en-US", { minimumFractionDigits: 2 })}` },
                    { label: "Payout", value: plan.payout },
                    { label: "Capital Return", value: plan.capitalReturn ? "Yes" : "No" },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between border-b border-white/[0.07] py-3 last:border-0"
                    >
                      <dt className="text-[13.5px] text-brand-300/75">{row.label}</dt>
                      <dd className="numeric text-[13.5px] font-bold text-brand-100">{row.value}</dd>
                    </div>
                  ))}
                </dl>

                <ul className="mt-6 space-y-2.5">
                  {plan.perks.map((perk) => (
                    <li key={perk} className="flex gap-2.5 text-[13px] leading-snug text-brand-300/80">
                      <Check size={15} className="mt-0.5 shrink-0 text-brand-400" />
                      {perk}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-7">
                  <Link
                    href={
                      signedIn
                        ? `/dashboard/plans?plan=${plan.id}`
                        : `/signup?plan=${plan.id}`
                    }
                    className={clsx("w-full py-3.5", plan.featured ? "btn-primary" : "btn-secondary")}
                  >
                    Get Started
                    <ArrowRight size={15} />
                  </Link>
                  <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-brand-300/55">
                    <ShieldCheck size={12} />
                    Capital returned at maturity
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120} className="mt-8">
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/[0.07] bg-ink-700/45 px-6 py-5 text-center sm:flex-row sm:justify-center sm:text-left">
            <Sparkles size={16} className="shrink-0 text-brand-400" />
            <p className="text-[13.5px] text-brand-300/80">
              Every plan is funded by crypto transfer and manually verified by our team before ROI
              begins to accrue. Minimum deposit{" "}
              <span className="font-semibold text-brand-100">$50.00</span>.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default InvestmentPlans;
