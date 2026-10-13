"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import clsx from "clsx";
import { CircleAlert, CircleCheck, Loader2, Mail } from "@/components/ui/icons";

export type MessageCustomer = {
  id: string;
  accountId: string;
  fullName: string;
  email: string;
};

type Props = {
  /** Registered customers offered in the recipient picker. */
  customers?: MessageCustomer[];
  /** When set, the recipient is fixed (used on a customer's profile). */
  presetRecipient?: { email: string; name?: string | null } | null;
  /** False when no mail transport is configured. */
  mailerReady: boolean;
  compact?: boolean;
};

const CUSTOM = "__custom__";

/** Admin composer for sending an email to a customer or any address. */
export function MessageComposer({
  customers = [],
  presetRecipient = null,
  mailerReady,
  compact = false,
}: Props) {
  const router = useRouter();

  const [choice, setChoice] = useState(presetRecipient ? presetRecipient.email : customers[0]?.email ?? CUSTOM);
  const [customEmail, setCustomEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [sent, setSent] = useState<string | null>(null);

  const recipientEmail = presetRecipient
    ? presetRecipient.email
    : choice === CUSTOM
      ? customEmail.trim()
      : choice;

  const selected = useMemo(
    () => customers.find((c) => c.email === recipientEmail) ?? null,
    [customers, recipientEmail],
  );

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFields({});
    setSent(null);
    setBusy(true);

    try {
      const res = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail,
          recipientUserId: presetRecipient ? "" : selected?.id ?? "",
          subject,
          body,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        fields?: Record<string, string>;
        deliveredTo?: string;
        note?: string;
      };

      if (!res.ok || !data.ok) {
        setError(data.error || "That message could not be sent.");
        setFields(data.fields ?? {});
        return;
      }

      setSent(data.note || `Message sent to ${data.deliveredTo}.`);
      setSubject("");
      setBody("");
      if (!presetRecipient) setCustomEmail("");
      router.refresh();
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className={clsx(
        "rounded-2xl border border-white/[0.07] bg-ink-700/50 shadow-card",
        compact ? "p-5" : "p-6",
      )}
    >
      <h2 className="flex items-center gap-2 font-display text-[15.5px] font-bold text-brand-100">
        <Mail size={17} className="text-brand-400" />
        Send a message
      </h2>
      <p className="mt-2 text-[12.5px] leading-relaxed text-brand-300/65">
        {presetRecipient
          ? "Write to this customer. The message is sent from the platform address and their reply comes to support."
          : "Write to a registered customer, or enter any email address."}
      </p>

      {!mailerReady && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-400/30 bg-amber-400/[0.08] px-4 py-3 text-[12.5px] leading-relaxed text-amber-100">
          <CircleAlert size={16} className="mt-0.5 shrink-0" />
          <span>
            Email sending is not configured, so messages cannot be delivered yet. Add{" "}
            <code className="rounded bg-black/30 px-1.5 py-0.5 text-[11.5px]">RESEND_API_KEY</code>{" "}
            (or SMTP settings) in Netlify and redeploy.
          </span>
        </div>
      )}

      {error && (
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-rose-400/30 bg-rose-500/[0.12] px-4 py-3 text-[12.5px] leading-relaxed text-rose-200">
          <CircleAlert size={15} className="mt-0.5 shrink-0" />
          {error}
        </p>
      )}

      {sent && (
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/[0.12] px-4 py-3 text-[12.5px] leading-relaxed text-emerald-200">
          <CircleCheck size={15} className="mt-0.5 shrink-0" />
          {sent}
        </p>
      )}

      <div className="mt-5 space-y-4">
        {presetRecipient ? (
          <div>
            <span className="label">Recipient</span>
            <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
              <Mail size={15} className="shrink-0 text-brand-400" />
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-semibold text-brand-100">
                  {presetRecipient.name || presetRecipient.email}
                </span>
                {presetRecipient.name && (
                  <span className="block truncate text-[11.5px] text-brand-300/60">
                    {presetRecipient.email}
                  </span>
                )}
              </span>
            </div>
          </div>
        ) : (
          <div>
            <label className="label" htmlFor="message-recipient">
              Recipient
            </label>
            <select
              id="message-recipient"
              className="input"
              value={choice}
              onChange={(event) => setChoice(event.target.value)}
            >
              {customers.length > 0 && (
                <optgroup label="Customers">
                  {customers.map((c) => (
                    <option key={c.id} value={c.email}>
                      {c.fullName} — {c.email}
                    </option>
                  ))}
                </optgroup>
              )}
              <option value={CUSTOM}>Another email address…</option>
            </select>

            {choice === CUSTOM && (
              <input
                className="input mt-2.5"
                type="email"
                inputMode="email"
                autoComplete="off"
                placeholder="name@example.com"
                value={customEmail}
                onChange={(event) => setCustomEmail(event.target.value)}
              />
            )}
            {fields.recipientEmail && (
              <p className="mt-1.5 text-[11.5px] text-rose-300">{fields.recipientEmail}</p>
            )}
          </div>
        )}

        <div>
          <label className="label" htmlFor="message-subject">
            Subject
          </label>
          <input
            id="message-subject"
            className="input"
            value={subject}
            maxLength={160}
            placeholder="Your account update"
            onChange={(event) => setSubject(event.target.value)}
          />
          {fields.subject && <p className="mt-1.5 text-[11.5px] text-rose-300">{fields.subject}</p>}
        </div>

        <div>
          <label className="label" htmlFor="message-body">
            Message
          </label>
          <textarea
            id="message-body"
            className="input min-h-[150px] resize-y leading-relaxed"
            value={body}
            maxLength={8000}
            placeholder="Write your message. Leave a blank line between paragraphs."
            onChange={(event) => setBody(event.target.value)}
          />
          <div className="mt-1.5 flex items-center justify-between gap-3">
            {fields.body ? (
              <p className="text-[11.5px] text-rose-300">{fields.body}</p>
            ) : (
              <span />
            )}
            <span className="numeric text-[11px] text-brand-300/45">{body.length}/8000</span>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className={clsx("btn-primary px-5 py-3 text-[13.5px]", busy && "opacity-60")}
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
          {busy ? "Sending…" : "Send message"}
        </button>
        {recipientEmail && (
          <span className="text-[12px] text-brand-300/60">
            To: <span className="font-semibold text-brand-200">{recipientEmail}</span>
          </span>
        )}
      </div>
    </form>
  );
}

export default MessageComposer;
