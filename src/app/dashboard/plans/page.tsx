import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getWallets } from "@/lib/wallets";
import { PLANS } from "@/lib/plans";
import { ensureSchema, isDatabaseConfigured, query, type InvestmentRow } from "@/lib/db";
import { formatDate, formatUsd, statusTone } from "@/lib/format";
import { PlanInvestor } from "@/components/dashboard/PlanInvestor";
import { Check, PieChart, ShieldCheck } from "@/components/ui/icons";
import clsx from "clsx";

export const metadata: Metadata = {
  title: "Investment Plans",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function PlansPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [wallets, params] = await Promise.all([getWallets(), searchParams]);

  let investments: InvestmentRow[] = [];
  if (isDatabaseConfigured()) {
    await ensureSchema().catch(() => undefined);
    investments = await query<InvestmentRow>(
      `SELECT * FROM investments WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [user.id],
    ).catch(() => []);
  }

  const selected = PLANS.find((p) => p.id === params.plan) ?? null;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-5 rounded-2xl border border-white/[0.07] bg-gradient-to-br from-ink-600/70 via-ink-700/60 to-ink-800/70 p-6 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11.5px] font-bold uppercase tracking-[0.16em] text-brand-400">
            Fixed-term returns
          </p>
          <h1 className="mt-2 font-display text-[26px] font-extrabold tracking-[-0.02em] text-brand-100 sm:text-[30px]">
            Investment Plans
          </h1>
          <p className="mt-2.5 max-w-xl text-[13.5px] leading-relaxed text-brand-300/70">
            Choose a plan and fund it from your wallet. ROI starts accruing the moment our team
            verifies your transfer, and capital is returned at maturity.
          </p>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-4">
          <PieChart size={22} className="text-brand-400" />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-300/60">
              Wallet balance
            </p>
            <p className="numeric text-[18px] font-extrabold text-brand-100">
              {formatUsd(user.balance)}
            </p>
          </div>
        </div>
      </header>

      {investments.length > 0 && (
        <section className="rounded-2xl border border-white/[0.07] bg-ink-700/50 shadow-card">
          <header className="border-b border-white/[0.07] px-5 py-4">
            <h2 className="font-display text-[15.5px] font-bold text-brand-100">Your plans</h2>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-white/[0.07] bg-white/[0.02]">
                  <th className="table-th">Plan</th>
                  <th className="table-th text-right">Amount</th>
                  <th className="table-th text-right">ROI</th>
                  <th className="table-th">Started</th>
                  <th className="table-th">Matures</th>
                  <th className="table-th">Status</th>
                </tr>
              </thead>
              <tbody>
                {investments.map((inv) => (
                  <tr key={inv.id} className="border-b border-white/[0.05] last:border-0">
                    <td className="table-td font-semibold text-brand-100">{inv.plan_name}</td>
                    <td className="table-td numeric text-right font-semibold text-brand-100">
                      {formatUsd(inv.amount)}
                    </td>
                    <td className="table-td numeric text-right text-brand-400">
                      {Number(inv.roi_percent).toFixed(2)}%
                    </td>
                    <td className="table-td text-[13px] text-brand-300/75">
                      {formatDate(inv.started_at)}
                    </td>
                    <td className="table-td text-[13px] text-brand-300/75">
                      {formatDate(inv.matures_at)}
                    </td>
                    <td className="table-td">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide ${statusTone(
                          inv.status,
                        )}`}
                      >
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {PLANS.map((plan) => {
          const isSelected = selected?.id === plan.id;
          return (
            <article
              key={plan.id}
              id={plan.id}
              className={clsx(
                "relative flex flex-col rounded-2xl border p-6 transition-all duration-300",
                isSelected
                  ? "border-brand-400/50 bg-brand-400/[0.08] shadow-glow"
                  : plan.featured
                    ? "border-brand-400/30 bg-gradient-to-b from-brand-400/[0.07] to-ink-700/60"
                    : "border-white/[0.07] bg-ink-700/50",
              )}
            >
              {plan.featured && !isSelected && (
                <span className="absolute -top-3 right-5 rounded-full bg-brand-grad px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#04191F]">
                  Featured
                </span>
              )}
              {isSelected && (
                <span className="absolute -top-3 right-5 rounded-full bg-brand-grad px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#04191F]">
                  Selected
                </span>
              )}

              <h2 className="font-display text-[17px] font-bold text-brand-100">{plan.name}</h2>
              <p className="mt-2 text-[13px] leading-relaxed text-brand-300/70">{plan.tagline}</p>

              <p className="mt-5 bg-gradient-to-r from-brand-green to-brand-400 bg-clip-text font-display text-[38px] font-black leading-none text-transparent">
                {plan.roiPercent.toFixed(2)}%
              </p>
              <p className="mt-1.5 text-[12px] font-medium text-brand-300/70">
                Total ROI over {plan.durationLabel}
              </p>

              <dl className="mt-5 space-y-0">
                {[
                  { label: "Min Invest", value: formatUsd(plan.minInvest) },
                  { label: "Max Invest", value: formatUsd(plan.maxInvest) },
                  { label: "Payout", value: plan.payout },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between border-b border-white/[0.07] py-2.5 last:border-0"
                  >
                    <dt className="text-[13px] text-brand-300/75">{row.label}</dt>
                    <dd className="numeric text-[13px] font-bold text-brand-100">{row.value}</dd>
                  </div>
                ))}
              </dl>

              <ul className="mt-5 space-y-2">
                {plan.perks.slice(0, 3).map((perk) => (
                  <li key={perk} className="flex gap-2.5 text-[12.5px] leading-snug text-brand-300/80">
                    <Check size={14} className="mt-0.5 shrink-0 text-brand-400" />
                    {perk}
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-6">
                <Link
                  href={`/dashboard/plans?plan=${plan.id}#invest`}
                  className={clsx("w-full py-3", isSelected ? "btn-primary" : "btn-secondary")}
                >
                  {isSelected ? "Fund this plan below" : `Select ${plan.name}`}
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      <section id="invest" className="scroll-mt-24">
        {selected ? (
          <PlanInvestor wallets={wallets} planId={selected.id} />
        ) : (
          <div className="rounded-2xl border border-white/[0.07] bg-ink-700/45 p-8 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-400/[0.1] text-brand-400">
              <PieChart size={22} />
            </span>
            <h2 className="mt-4 font-display text-[18px] font-bold text-brand-100">
              Pick a plan to get started
            </h2>
            <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-brand-300/70">
              Select one of the plans above and the funding form will appear here with the correct
              limits and settlement wallet.
            </p>
          </div>
        )}
      </section>

      <p className="flex items-center justify-center gap-2 text-center text-[11.5px] text-brand-300/55">
        <ShieldCheck size={13} />
        Investment returns are fixed per plan. Capital is returned with your final payout.
      </p>
    </div>
  );
}
