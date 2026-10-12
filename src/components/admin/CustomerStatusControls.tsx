"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import { CircleCheck, CircleX, Loader2, ShieldCheck, Shield, Trash2 } from "@/components/ui/icons";

type Props = {
  userId: string;
  status: string;
  role: string;
  isSelf: boolean;
};

/** Suspend / reactivate an account and grant or revoke administrator rights. */
export function CustomerStatusControls({ userId, status, role, isSelf }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const suspended = status === "suspended";
  const isAdmin = role === "admin";

  async function update(patch: { status?: "active" | "suspended"; role?: "user" | "admin" }) {
    setBusy(patch.status ?? patch.role ?? "update");
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || "That change could not be saved.");
        return;
      }
      setMessage(
        patch.status
          ? patch.status === "suspended"
            ? "Account suspended."
            : "Account reactivated."
          : patch.role === "admin"
            ? "Administrator rights granted."
            : "Administrator rights removed.",
      );
      router.refresh();
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    setBusy("delete");
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      const data = (await res.json()) as { ok?: boolean; error?: string; accountId?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || "That account could not be deleted.");
        setConfirmingDelete(false);
        return;
      }
      // The profile now points at a deleted record, so leave the page.
      router.push("/admin/users");
      router.refresh();
    } catch {
      setError("Could not reach the server. Try again.");
      setConfirmingDelete(false);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-xl border border-rose-400/30 bg-rose-500/[0.12] px-4 py-3 text-[12.5px] text-rose-200">
          {error}
        </p>
      )}
      {message && (
        <p className="flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/[0.12] px-4 py-3 text-[12.5px] text-emerald-200">
          <CircleCheck size={15} className="shrink-0" />
          {message}
        </p>
      )}

      <div className="flex flex-wrap gap-2.5">
        <button
          type="button"
          disabled={busy !== null || (isSelf && !suspended)}
          onClick={() => update({ status: suspended ? "active" : "suspended" })}
          className={clsx(
            suspended ? "btn-primary" : "btn-danger",
            "px-5 py-2.5 text-[13px]",
            busy !== null && "opacity-60",
          )}
        >
          {busy === "suspended" || busy === "active" ? (
            <Loader2 size={15} className="animate-spin" />
          ) : suspended ? (
            <CircleCheck size={15} />
          ) : (
            <CircleX size={15} />
          )}
          {suspended ? "Reactivate account" : "Suspend account"}
        </button>

        <button
          type="button"
          disabled={busy !== null || isSelf}
          onClick={() => update({ role: isAdmin ? "user" : "admin" })}
          className={clsx(
            "btn-secondary px-5 py-2.5 text-[13px]",
            busy !== null && "opacity-60",
          )}
        >
          {busy === "user" || busy === "admin" ? (
            <Loader2 size={15} className="animate-spin" />
          ) : isAdmin ? (
            <Shield size={15} />
          ) : (
            <ShieldCheck size={15} />
          )}
          {isAdmin ? "Remove admin rights" : "Make administrator"}
        </button>

        {!isSelf && !isAdmin && (
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => setConfirmingDelete(true)}
            className={clsx("btn-danger px-5 py-2.5 text-[13px]", busy !== null && "opacity-60")}
          >
            <Trash2 size={15} />
            Delete account
          </button>
        )}
      </div>

      {confirmingDelete && (
        <div className="rounded-xl border border-rose-400/35 bg-rose-500/[0.1] px-4 py-3.5">
          <p className="text-[12.5px] leading-relaxed text-rose-100">
            This permanently deletes the customer together with their transactions, investments and
            collectibles. It cannot be undone.
          </p>
          <div className="mt-3 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={remove}
              disabled={busy !== null}
              className={clsx("btn-danger px-4 py-2 text-[12.5px]", busy !== null && "opacity-60")}
            >
              {busy === "delete" ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              {busy === "delete" ? "Deleting…" : "Yes, delete permanently"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              disabled={busy !== null}
              className="btn-secondary px-4 py-2 text-[12.5px]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {isSelf && (
        <p className="text-[11.5px] leading-relaxed text-brand-300/55">
          You cannot suspend, delete or change administrator rights on your own account.
        </p>
      )}
    </div>
  );
}

export default CustomerStatusControls;
