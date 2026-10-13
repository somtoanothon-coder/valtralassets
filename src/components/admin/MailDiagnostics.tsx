"use client";

import { useState } from "react";
import clsx from "clsx";
import { CircleAlert, CircleCheck, Loader2, RefreshCw } from "@/components/ui/icons";

export type MailTransport = {
  configured: boolean;
  transport: "resend" | "smtp" | "none";
  from: string;
  fromName: string;
  smtpHost: string | null;
  smtpPort: number | null;
  smtpSecure: boolean | null;
  smtpAuthenticated: boolean;
};

/**
 * Shows how this deployment sends mail and lets an administrator prove it with
 * a real test message. Netlify cannot reach recipients directly — AWS blocks
 * outbound port 25 for every Lambda — so a relay must be configured.
 */
export function MailDiagnostics({ initial }: { initial: MailTransport }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  async function test() {
    setBusy(true);
    setError(null);
    setSent(null);
    try {
      const res = await fetch("/api/admin/messages", { method: "PUT" });
      const data = (await res.json()) as { ok?: boolean; error?: string; message?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || "The test message could not be sent.");
        return;
      }
      setSent(data.message || "Test message sent.");
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const ready = initial.configured;

  return (
    <section className="rounded-2xl border border-white/[0.07] bg-ink-700/50 p-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-[15px] font-bold text-brand-100">
          <RefreshCw size={16} className={ready ? "text-emerald-400" : "text-amber-400"} />
          Mail delivery
        </h2>
        <span
          className={clsx(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide",
            ready
              ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
              : "border-amber-400/30 bg-amber-400/10 text-amber-300",
          )}
        >
          {ready ? <CircleCheck size={11} /> : <CircleAlert size={11} />}
          {ready ? "configured" : "not configured"}
        </span>
      </div>

      <dl className="mt-4 space-y-2 text-[12.5px]">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-brand-300/65">Transport</dt>
          <dd className="font-semibold text-brand-100">
            {initial.transport === "resend"
              ? "Resend API"
              : initial.transport === "smtp"
                ? "SMTP server"
                : "None"}
          </dd>
        </div>
        {initial.smtpHost && (
          <div className="flex items-center justify-between gap-3">
            <dt className="text-brand-300/65">Server</dt>
            <dd className="truncate font-semibold text-brand-100">
              {initial.smtpHost}:{initial.smtpPort}
              {initial.smtpSecure ? " (TLS)" : ""}
            </dd>
          </div>
        )}
        <div className="flex items-center justify-between gap-3">
          <dt className="text-brand-300/65">Sends as</dt>
          <dd className="truncate font-semibold text-brand-100">{initial.from}</dd>
        </div>
      </dl>

      {!ready && (
        <p className="mt-4 rounded-xl border border-amber-400/25 bg-amber-400/[0.07] px-4 py-3 text-[12px] leading-relaxed text-amber-100">
          Messages cannot be delivered until a mail server is connected. Set{" "}
          <code className="rounded bg-black/30 px-1.5 py-0.5 text-[11.5px]">SMTP_HOST</code>,{" "}
          <code className="rounded bg-black/30 px-1.5 py-0.5 text-[11.5px]">SMTP_PORT</code>,{" "}
          <code className="rounded bg-black/30 px-1.5 py-0.5 text-[11.5px]">SMTP_USER</code> and{" "}
          <code className="rounded bg-black/30 px-1.5 py-0.5 text-[11.5px]">SMTP_PASS</code> — or
          add <code className="rounded bg-black/30 px-1.5 py-0.5 text-[11.5px]">RESEND_API_KEY</code>{" "}
          — then redeploy.
        </p>
      )}

      {error && (
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-rose-400/30 bg-rose-500/[0.12] px-4 py-3 text-[12px] leading-relaxed text-rose-200">
          <CircleAlert size={14} className="mt-0.5 shrink-0" />
          <span className="break-words">{error}</span>
        </p>
      )}
      {sent && (
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/[0.12] px-4 py-3 text-[12px] leading-relaxed text-emerald-200">
          <CircleCheck size={14} className="mt-0.5 shrink-0" />
          {sent}
        </p>
      )}

      <button
        type="button"
        onClick={test}
        disabled={busy || !ready}
        className={clsx(
          "btn-secondary mt-4 w-full px-4 py-2.5 text-[12.5px]",
          (busy || !ready) && "opacity-60",
        )}
      >
        {busy ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
        {busy ? "Sending test…" : "Send test email to me"}
      </button>
    </section>
  );
}

export default MailDiagnostics;
