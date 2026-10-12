"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { CircleAlert, CircleCheck, Loader2, RefreshCw } from "@/components/ui/icons";

type WalletRow = {
  id: string;
  asset: string;
  network: string;
  address: string;
  note: string;
  image?: string;
  overridden?: boolean;
};

type Props = { initialWallets: WalletRow[] };

/**
 * Editor for the settlement wallet addresses customers see on the deposit
 * page. Submitting an empty value restores the deploy-time default.
 */
export function WalletSettings({ initialWallets }: Props) {
  const router = useRouter();
  const [wallets, setWallets] = useState(initialWallets);
  const [drafts, setDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialWallets.map((w) => [w.id, w.address])),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setWallets(initialWallets);
    setDrafts(Object.fromEntries(initialWallets.map((w) => [w.id, w.address])));
  }, [initialWallets]);

  const changed = wallets.filter((w) => (drafts[w.id] ?? "").trim() !== w.address.trim());

  async function save() {
    if (!changed.length) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addresses: Object.fromEntries(changed.map((w) => [w.id, (drafts[w.id] ?? "").trim()])),
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; message?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || "The addresses could not be saved.");
        return;
      }
      setMessage(data.message || "Wallet addresses updated.");
      router.refresh();
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-400/30 bg-rose-500/[0.12] px-5 py-4 text-[13px] leading-relaxed text-rose-200">
          <CircleAlert size={17} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {message && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-500/[0.12] px-5 py-4 text-[13px] leading-relaxed text-emerald-200">
          <CircleCheck size={17} className="mt-0.5 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {wallets.map((wallet) => {
          const draft = drafts[wallet.id] ?? "";
          const dirty = draft.trim() !== wallet.address.trim();
          return (
            <section
              key={wallet.id}
              className={clsx(
                "rounded-2xl border bg-ink-700/50 p-5 shadow-card",
                dirty ? "border-brand-400/40" : "border-white/[0.07]",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={wallet.image || "/crypto/default.svg"}
                    alt=""
                    className="h-9 w-9 rounded-full border border-white/10 object-cover"
                  />
                  <div>
                    <p className="text-[14px] font-bold text-brand-100">{wallet.asset}</p>
                    <p className="text-[11.5px] text-brand-300/60">{wallet.network}</p>
                  </div>
                </div>
                {wallet.overridden ? (
                  <span className="rounded-full border border-brand-400/35 bg-brand-400/12 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-300">
                    Custom
                  </span>
                ) : (
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-300/60">
                    Default
                  </span>
                )}
              </div>

              <label className="label mt-4" htmlFor={`wallet-${wallet.id}`}>
                Settlement address
              </label>
              <input
                id={`wallet-${wallet.id}`}
                className="input font-mono text-[12px]"
                value={draft}
                spellCheck={false}
                autoComplete="off"
                onChange={(event) =>
                  setDrafts((prev) => ({ ...prev, [wallet.id]: event.target.value }))
                }
              />
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-brand-300/55">{wallet.note}</p>
              {dirty && (
                <button
                  type="button"
                  onClick={() =>
                    setDrafts((prev) => ({ ...prev, [wallet.id]: wallet.address }))
                  }
                  className="mt-2.5 inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-brand-400 transition hover:text-brand-300"
                >
                  <RefreshCw size={12} />
                  Undo change
                </button>
              )}
            </section>
          );
        })}
      </div>

      <div className="sticky bottom-4 flex flex-wrap items-center gap-4 rounded-2xl border border-white/[0.09] bg-ink-800/95 px-5 py-4 shadow-card backdrop-blur-xl">
        <button
          type="button"
          onClick={save}
          disabled={busy || !changed.length}
          className={clsx("btn-primary px-5 py-3 text-[13.5px]", (busy || !changed.length) && "opacity-60")}
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <CircleCheck size={16} />}
          {busy ? "Saving…" : "Save addresses"}
        </button>
        <p className="text-[12.5px] text-brand-300/60">
          {changed.length
            ? `${changed.length} address${changed.length === 1 ? "" : "es"} changed. Customers see updates immediately.`
            : "Every address matches the saved value."}
        </p>
      </div>
    </div>
  );
}

export default WalletSettings;
