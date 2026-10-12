"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import type { ResolvedWallet } from "@/lib/wallets";
import { CONTACT } from "@/config/site";
import { formatUsd } from "@/lib/format";
import {
  Check,
  CheckCheck,
  CircleCheck,
  Copy,
  Info,
  Loader2,
  ShieldCheck,
  Wallet,
} from "@/components/ui/icons";

type Props = {
  wallets: ResolvedWallet[];
  defaultPurpose?: "deposit" | "investment" | "nft";
  planId?: string;
  planName?: string;
  minAmount?: number;
  maxAmount?: number;
  fixedAmount?: number;
  itemSlug?: string;
  itemName?: string;
  compact?: boolean;
};

const PURPOSES = [
  { id: "deposit", label: "Wallet deposit" },
  { id: "investment", label: "Investment plan" },
  { id: "nft", label: "NFT purchase" },
] as const;

export function PaymentForm({
  wallets,
  defaultPurpose = "deposit",
  planId,
  planName,
  minAmount,
  maxAmount,
  fixedAmount,
  itemSlug,
  itemName,
  compact = false,
}: Props) {
  const router = useRouter();
  const [purpose, setPurpose] = useState<"deposit" | "investment" | "nft">(defaultPurpose);
  const [walletId, setWalletId] = useState(wallets[0]?.id ?? "");
  const [amount, setAmount] = useState(fixedAmount ? String(fixedAmount) : "");
  const [providerRef, setProviderRef] = useState("");
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ reference: string; message: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setPurpose(defaultPurpose);
  }, [defaultPurpose]);

  const wallet = useMemo(() => wallets.find((w) => w.id === walletId) ?? wallets[0], [wallets, walletId]);

  async function copy(value: string, key: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      window.setTimeout(() => setCopied((c) => (c === key ? null : c)), 1800);
    } catch {
      setCopied(null);
    }
  }

  const numericAmount = Number(amount);
  const amountError =
    minAmount !== undefined && numericAmount > 0 && numericAmount < minAmount
      ? `Minimum for this option is ${formatUsd(minAmount)}`
      : maxAmount !== undefined && numericAmount > maxAmount
        ? `Maximum for this option is ${formatUsd(maxAmount)}`
        : null;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setErrors({});

    if (!wallet) {
      setFormError("No settlement wallet is available yet. Please contact support.");
      return;
    }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setErrors({ amount: "Enter the amount you sent" });
      return;
    }
    if (amountError) {
      setErrors({ amount: amountError });
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: numericAmount,
          purpose,
          walletId: wallet.id,
          providerRef,
          note,
          planId: purpose === "investment" ? planId : "",
          itemSlug: purpose === "nft" ? itemSlug : "",
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        fields?: Record<string, string>;
        reference?: string;
        message?: string;
      };

      if (!res.ok || !data.ok) {
        setErrors(data.fields ?? {});
        setFormError(data.error || "We could not record your payment. Please try again.");
        setBusy(false);
        return;
      }

      setSuccess({ reference: data.reference!, message: data.message! });
      setAmount(fixedAmount ? String(fixedAmount) : "");
      setProviderRef("");
      setNote("");
      router.refresh();
      window.setTimeout(() => setBusy(false), 0);
    } catch {
      setFormError("We could not reach the server. Check your connection and try again.");
      setBusy(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-400/25 bg-ink-700/60 p-6 text-center shadow-glow sm:p-8">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-grad text-[#04191F]">
          <CircleCheck size={26} />
        </span>
        <h2 className="mt-5 font-display text-[21px] font-extrabold text-brand-100">
          Payment submitted
        </h2>
        <p className="mx-auto mt-2.5 max-w-md text-[13.5px] leading-relaxed text-brand-300/75">
          {success.message}
        </p>
        <div className="mx-auto mt-5 max-w-xs rounded-xl border border-brand-400/25 bg-brand-400/[0.07] px-4 py-3">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-brand-300/70">
            Your reference
          </p>
          <p className="numeric mt-1 text-[16px] font-extrabold text-brand-100">
            {success.reference}
          </p>
        </div>
        <button type="button" onClick={() => setSuccess(null)} className="btn-secondary mt-6 px-5 py-2.5 text-[13px]">
          Submit another payment
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className={clsx(
        "rounded-2xl border border-white/[0.07] bg-ink-700/50 shadow-card",
        compact ? "p-5" : "p-6 sm:p-7",
      )}
    >
      {formError && (
        <div className="mb-5 rounded-xl border border-rose-400/30 bg-rose-500/[0.12] px-4 py-3 text-[13px] text-rose-200">
          {formError}
        </div>
      )}

      {/* Step 1 — choose network ---------------------------------------- */}
      <div>
        <h2 className="flex items-center gap-2 font-display text-[15.5px] font-bold text-brand-100">
          <span className="grid h-6 w-6 place-items-center rounded-lg bg-brand-grad text-[11px] font-black text-[#04191F]">
            1
          </span>
          Choose a settlement wallet
        </h2>

        <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
          {wallets.map((option) => {
            const active = option.id === wallet?.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setWalletId(option.id)}
                aria-pressed={active}
                className={clsx(
                  "flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition",
                  active
                    ? "border-brand-400/45 bg-brand-400/[0.1]"
                    : "border-white/[0.08] bg-white/[0.025] hover:border-white/20",
                )}
              >
                <img
                  src={option.image || "/crypto/default.svg"}
                  alt={`${option.asset} icon`}
                  className="h-8 w-8 shrink-0 rounded-full border border-white/10 object-cover"
                />
                <span className="min-w-0">
                  <span className="block text-[13px] font-bold text-brand-100">
                    {option.asset}
                    <span className="ml-2 text-[11px] font-medium text-brand-300/60">
                      {option.network}
                    </span>
                  </span>
                </span>
                {active && <Check size={15} className="ml-auto shrink-0 text-brand-400" />}
              </button>
            );
          })}
        </div>

        {wallet && (
          <div className="mt-4 rounded-xl border border-brand-400/25 bg-ink-900/60 p-4">
            <div className="flex items-center gap-3">
              <img
                src={wallet.image || "/crypto/default.svg"}
                alt={`${wallet.asset} icon`}
                className="h-8 w-8 rounded-full border border-white/10 object-cover"
              />
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-300/65">
                Send {wallet.asset} on {wallet.network} to
              </p>
            </div>
            <div className="mt-2.5 flex items-start gap-2.5">
              <code className="min-w-0 flex-1 break-all font-mono text-[12.5px] font-semibold leading-relaxed text-brand-100">
                {wallet.address}
              </code>
              <button
                type="button"
                onClick={() => copy(wallet.address, "wallet")}
                className="btn-secondary shrink-0 px-3 py-2 text-[11.5px]"
              >
                {copied === "wallet" ? <CheckCheck size={14} /> : <Copy size={14} />}
                {copied === "wallet" ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="mt-3 flex items-start gap-2 text-[11.5px] leading-relaxed text-amber-200/85">
              <Info size={13} className="mt-0.5 shrink-0" />
              {wallet.note}
            </p>
          </div>
        )}
      </div>

      <div className="divider my-6" />

      {/* Step 2 — tell us about the transfer ---------------------------- */}
      <div>
        <h2 className="flex items-center gap-2 font-display text-[15.5px] font-bold text-brand-100">
          <span className="grid h-6 w-6 place-items-center rounded-lg bg-brand-grad text-[11px] font-black text-[#04191F]">
            2
          </span>
          Confirm your transfer
        </h2>

        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          {defaultPurpose === "deposit" && (
            <div className="sm:col-span-2">
              <label className="label" htmlFor="purpose">
                What is this payment for?
              </label>
              <select
                id="purpose"
                className="input"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value as typeof purpose)}
              >
                {PURPOSES.filter((p) => !itemSlug || p.id !== "nft").map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                    {p.id === "investment" && planName ? ` — ${planName}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="sm:col-span-2">
            <label className="label" htmlFor="amount">
              Amount sent (USD) <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] font-bold text-brand-300/70">
                $
              </span>
              <input
                id="amount"
                name="amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min={minAmount ?? 1}
                max={maxAmount}
                readOnly={Boolean(fixedAmount)}
                className={clsx(
                  "input numeric pl-8",
                  fixedAmount && "cursor-not-allowed text-brand-300",
                  errors.amount && "border-rose-400/50",
                )}
                placeholder="500.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            {errors.amount ? (
              <p className="field-error">{errors.amount}</p>
            ) : (
              <p className="mt-1.5 text-[11.5px] text-brand-300/60">
                {minAmount !== undefined && maxAmount !== undefined
                  ? `Accepted range: ${formatUsd(minAmount)} – ${formatUsd(maxAmount)}. Enter the exact value you transferred.`
                  : "Enter the exact value you transferred."}
              </p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="label" htmlFor="providerRef">
              Transaction hash / sending wallet <span className="text-rose-400">*</span>
            </label>
            <input
              id="providerRef"
              name="providerRef"
              className={clsx("input", errors.providerRef && "border-rose-400/50")}
              placeholder="e.g. 0x9f3a…b2c1 or the wallet address you sent from"
              value={providerRef}
              onChange={(e) => setProviderRef(e.target.value)}
              required
            />
            {errors.providerRef ? (
              <p className="field-error">{errors.providerRef}</p>
            ) : (
              <p className="mt-1.5 text-[11.5px] text-brand-300/60">
                This is how we match your transfer on-chain — it speeds up approval dramatically.
              </p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="label" htmlFor="note">
              Note for our team (optional)
            </label>
            <textarea
              id="note"
              name="note"
              rows={3}
              className="input resize-none"
              placeholder="Anything we should know about this payment?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>
      </div>

      <button type="submit" disabled={busy} className="btn-primary mt-6 w-full py-3.5 text-[14.5px]">
        {busy ? <Loader2 size={17} className="animate-spin" /> : <Wallet size={17} />}
        {busy ? "Submitting…" : "Submit payment for verification"}
      </button>

      <p className="mt-4 flex items-start justify-center gap-2 text-center text-[11.5px] leading-relaxed text-brand-300/60">
        <ShieldCheck size={13} className="mt-0.5 shrink-0" />
        <span>
          Submissions are reviewed manually, usually within 30 minutes. If anything looks wrong, email{" "}
          <a href={`mailto:${CONTACT.paymentsEmail}`} className="font-semibold text-brand-400 hover:underline">
            {CONTACT.paymentsEmail}
          </a>
          .
        </span>
      </p>
    </form>
  );
}

export default PaymentForm;
