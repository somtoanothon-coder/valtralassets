"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import type { ResolvedWallet } from "@/lib/wallets";
import { getPlan, PLANS, planProgress } from "@/lib/plans";
import { formatUsd } from "@/lib/format";
import { PaymentForm } from "./PaymentForm";
import { ArrowRight, Check, TrendingUp } from "@/components/ui/icons";

/**
 * Lets the customer pick the amount they want to invest in a plan and shows
 * the projected payout before they commit, then hands off to <PaymentForm />
 * with the amount and plan pre-filled.
 */
export function PlanInvestor({
  wallets,
  planId,
}: {
  wallets: ResolvedWallet[];
  planId: string;
}) {
  const plan = getPlan(planId) ?? PLANS[0];
  const [amount, setAmount] = useState(String(plan.minInvest));
  const [confirmed, setConfirmed] = useState(false);

  const numeric = Number(amount) || 0;

  const { payout, progress, inRange } = useMemo(() => {
    const profit = (numeric * plan.roiPercent) / 100;
    return {
      payout: numeric + profit,
      progress: planProgress(plan, numeric) ?? 0,
      inRange: numeric >= plan.minInvest && numeric <= plan.maxInvest,
    };
  }, [numeric, plan]);

  const quickAmounts = [plan.minInvest, plan.minInvest * 2, plan.maxInvest / 2, plan.maxInvest]
    .map((v) => Math.min(plan.maxInvest, Math.round(v)))
    .filter((v, i, arr) => v >= plan.minInvest && arr.indexOf(v) === i);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
      {/* Projection ----------------------------------------------------- */}
      <section className="rounded-2xl border border-brand-400/30 bg-gradient-to-b from-brand-400/[0.09] to-ink-700/60 p-6 shadow-glow">
        <span className="chip">
          <TrendingUp size={12} />
          {plan.name}
        </span>

        <h2 className="mt-4 font-display text-[19px] font-bold text-brand-100">
          Plan your investment
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-brand-300/70">
          Enter how much you want to put to work. The projection updates instantly.
        </p>

        <div className="mt-5">
          <label className="label" htmlFor="invest-amount">
            Investment amount (USD)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] font-bold text-brand-300/70">
              $
            </span>
            <input
              id="invest-amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min={plan.minInvest}
              max={plan.maxInvest}
              className="input numeric pl-8 text-[15px] font-bold"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setConfirmed(false);
              }}
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {quickAmounts.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setAmount(String(value));
                  setConfirmed(false);
                }}
                className={clsx(
                  "rounded-full border px-3 py-1.5 text-[11.5px] font-semibold transition",
                  Number(amount) === value
                    ? "border-brand-400/45 bg-brand-400/[0.14] text-brand-100"
                    : "border-white/10 bg-white/[0.03] text-brand-300/75 hover:border-white/25",
                )}
              >
                {formatUsd(value)}
              </button>
            ))}
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-[11px] text-brand-300/60">
              <span>{formatUsd(plan.minInvest)}</span>
              <span>{formatUsd(plan.maxInvest)}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className={clsx(
                  "h-full rounded-full transition-all duration-500",
                  inRange ? "bg-brand-grad" : "bg-rose-400/70",
                )}
                style={{ width: `${Math.min(100, Math.max(progress, 2))}%` }}
              />
            </div>
            {!inRange && numeric > 0 && (
              <p className="field-error">
                {numeric < plan.minInvest
                  ? `Minimum for ${plan.name} is ${formatUsd(plan.minInvest)}`
                  : `Maximum for ${plan.name} is ${formatUsd(plan.maxInvest)}`}
              </p>
            )}
          </div>
        </div>

        <dl className="mt-6 space-y-0">
          {[
            { label: "Plan ROI", value: `${plan.roiPercent.toFixed(2)}% total` },
            { label: "Duration", value: plan.durationLabel },
            { label: "Payout schedule", value: plan.payout },
            { label: "Capital return", value: plan.capitalReturn ? "Yes, at maturity" : "No" },
          ].map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between border-b border-white/[0.07] py-3 last:border-0"
            >
              <dt className="text-[13px] text-brand-300/75">{row.label}</dt>
              <dd className="text-[13px] font-bold text-brand-100">{row.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-5 rounded-xl border border-white/[0.1] bg-ink-900/60 px-5 py-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-300/60">
            Projected payout at maturity
          </p>
          <p className="numeric mt-2 font-display text-[27px] font-extrabold leading-none text-brand-100">
            {formatUsd(payout)}
          </p>
          <p className="mt-1.5 text-[12px] text-brand-400">
            +{formatUsd(payout - numeric)} profit included
          </p>
        </div>

        <button
          type="button"
          disabled={!inRange}
          onClick={() => setConfirmed(true)}
          className="btn-primary mt-5 w-full py-3.5 text-[14px]"
        >
          {confirmed ? (
            <>
              <Check size={16} />
              Amount locked in below
            </>
          ) : (
            <>
              Continue to payment
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </section>

      {/* Payment -------------------------------------------------------- */}
      <div className="scroll-mt-24" id="plan-payment">
        {confirmed && inRange ? (
          <PaymentForm
            wallets={wallets}
            defaultPurpose="investment"
            planId={plan.id}
            planName={plan.name}
            minAmount={plan.minInvest}
            maxAmount={plan.maxInvest}
            fixedAmount={numeric}
          />
        ) : (
          <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.12] bg-ink-700/35 p-8 text-center">
            <h3 className="font-display text-[16.5px] font-bold text-brand-100">
              Confirm your amount to continue
            </h3>
            <p className="mx-auto mt-2.5 max-w-sm text-[13px] leading-relaxed text-brand-300/65">
              Set an amount within the plan limits, then press{" "}
              <span className="font-semibold text-brand-200">Continue to payment</span>. We&apos;ll
              show the settlement wallet and the form to submit your transaction hash.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PlanInvestor;
