"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { formatDateTime, formatUsd, initials, timeAgo } from "@/lib/format";
import {
  ArrowRight,
  CheckCheck,
  CircleAlert,
  CircleCheck,
  CircleX,
  Clock,
  Loader2,
  Plus,
  Search,
  Users,
  Wallet,
  X,
} from "@/components/ui/icons";

export type AdminUser = {
  id: string;
  accountId: string;
  fullName: string;
  email: string;
  phone: string | null;
  country: string | null;
  occupation: string | null;
  accountType: string;
  role: string;
  status: string;
  balance: number;
  totalDeposited: number;
  pendingCount: number;
  transactionCount: number;
  createdAt: string;
  lastLoginAt: string | null;
};

export type AdminTransaction = {
  id: string;
  reference: string;
  userId: string;
  userName: string;
  accountId: string;
  userEmail: string;
  type: string;
  amount: number;
  method: string | null;
  network: string | null;
  walletAddress: string | null;
  providerRef: string | null;
  status: string;
  planId: string | null;
  itemSlug: string | null;
  note: string | null;
  adminNote: string | null;
  createdAt: string;
};

/* ------------------------------------------------------------------ toasts */

type Toast = { id: number; tone: "success" | "error"; message: string };

function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((tone: Toast["tone"], message: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, tone, message }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 6500);
  }, []);
  return { toasts, push, dismiss: (id: number) => setToasts((p) => p.filter((t) => t.id !== id)) };
}

function ToastStack({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: number) => void }) {
  if (!toasts.length) return null;
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-50 flex w-[min(92vw,380px)] flex-col gap-2.5">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={clsx(
            "pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3.5 text-[13px] leading-snug shadow-card backdrop-blur-xl",
            toast.tone === "success"
              ? "border-emerald-400/30 bg-emerald-500/[0.13] text-emerald-100"
              : "border-rose-400/30 bg-rose-500/[0.13] text-rose-100",
          )}
        >
          {toast.tone === "success" ? (
            <CircleCheck size={16} className="mt-0.5 shrink-0" />
          ) : (
            <CircleAlert size={16} className="mt-0.5 shrink-0" />
          )}
          <span className="flex-1">{toast.message}</span>
          <button type="button" onClick={() => dismiss(toast.id)} aria-label="Dismiss">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------ quick credit */

export function QuickCredit({
  user,
  onDone,
  defaultAmount,
  defaultTransactionId,
  defaultPlanId,
  defaultCreateInvestment,
  defaultOpen,
}: {
  user: Pick<AdminUser, "id" | "fullName" | "accountId" | "balance">;
  onDone?: (message: string) => void;
  defaultAmount?: number | string;
  defaultTransactionId?: string;
  defaultPlanId?: string;
  defaultCreateInvestment?: boolean;
  defaultOpen?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(Boolean(defaultTransactionId || defaultOpen));
  const [amount, setAmount] = useState(defaultAmount ? String(defaultAmount) : "");
  const [direction, setDirection] = useState<"credit" | "debit">("credit");
  const [note, setNote] = useState("");
  const [makeInvestment, setMakeInvestment] = useState(Boolean(defaultCreateInvestment));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (defaultAmount !== undefined) setAmount(String(defaultAmount));
  }, [defaultAmount]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Enter an amount greater than zero");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/admin/credit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          amount: value,
          direction,
          note,
          transactionId: defaultTransactionId || undefined,
          planId: defaultPlanId || undefined,
          createInvestment: makeInvestment || Boolean(defaultCreateInvestment),
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; message?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || "The credit could not be applied.");
        setBusy(false);
        return;
      }
      setAmount("");
      setNote("");
      setBusy(false);
      setOpen(false);
      onDone?.(data.message || "Balance updated.");
      router.refresh();
    } catch {
      setError("Could not reach the server. Try again.");
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-primary px-4 py-2.5 text-[12.5px]"
      >
        <Plus size={14} />
        Adjust balance
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-brand-400/30 bg-brand-400/[0.06] p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-[15px] font-bold text-brand-100">
            {direction === "debit" ? "Decrease" : "Increase"} balance for {user.fullName}
          </h3>
          <p className="mt-1 text-[12px] text-brand-300/70">
            Account <span className="numeric font-semibold">{user.accountId}</span> · current balance{" "}
            <span className="numeric font-semibold">{formatUsd(user.balance)}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="shrink-0 rounded-lg p-1.5 text-brand-300/60 transition hover:bg-white/[0.07]"
          aria-label="Close"
        >
          <X size={16} />
        </button>
      </div>

      {error && (
        <p className="mt-3.5 rounded-xl border border-rose-400/30 bg-rose-500/[0.12] px-3.5 py-2.5 text-[12.5px] text-rose-200">
          {error}
        </p>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {!defaultTransactionId && (
          <div>
            <label className="label" htmlFor={`credit-direction-${user.id}`}>
              Adjustment
            </label>
            <select
              id={`credit-direction-${user.id}`}
              className="input"
              value={direction}
              onChange={(event) =>
                setDirection(event.target.value === "debit" ? "debit" : "credit")
              }
            >
              <option value="credit">Increase balance</option>
              <option value="debit">Decrease balance</option>
            </select>
          </div>
        )}
        <div>
          <label className="label" htmlFor={`credit-amount-${user.id}`}>
            Amount to {direction === "debit" ? "deduct" : "add"} (USD){" "}
            <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] font-bold text-brand-300/70">
              $
            </span>
            <input
              id={`credit-amount-${user.id}`}
              type="number"
              step="0.01"
              min="0.01"
              className="input numeric pl-8 text-[15px] font-bold"
              placeholder="500.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
              required
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor={`credit-note-${user.id}`}>
            Internal note (optional)
          </label>
          <input
            id={`credit-note-${user.id}`}
            className="input"
            placeholder="e.g. USDT-TRC20 TX 8f2a… confirmed"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </div>

      {defaultPlanId && (
        <label className="mt-4 flex cursor-pointer items-center gap-2.5 text-[12.5px] text-brand-200">
          <input
            type="checkbox"
            checked={makeInvestment}
            onChange={(e) => setMakeInvestment(e.target.checked)}
            className="h-4 w-4 rounded accent-[#27B58D]"
          />
          Also open the <span className="font-semibold">{defaultPlanId}</span> investment for this
          amount
        </label>
      )}

      <div className="mt-5 flex flex-wrap gap-2.5">
        <button type="submit" disabled={busy} className="btn-primary px-5 py-2.5 text-[13px]">
          {busy ? <Loader2 size={15} className="animate-spin" /> : <CheckCheck size={15} />}
          {busy
            ? "Applying…"
            : defaultTransactionId
              ? "Approve & credit"
              : direction === "debit"
                ? "Decrease balance"
                : "Increase balance"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          className="btn-secondary px-5 py-2.5 text-[13px]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------- users list */

export function UsersTable({
  initialUsers,
  initialTotal,
}: {
  initialUsers: AdminUser[];
  initialTotal: number;
}) {
  const [users, setUsers] = useState(initialUsers);
  const [total, setTotal] = useState(initialTotal);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [adjustingUser, setAdjustingUser] = useState<string | null>(null);
  const { toasts, push, dismiss } = useToasts();
  const firstRender = useRef(true);

  // Balances change as soon as an adjustment is applied; re-sync from the
  // server render so the table never shows a stale figure. Skipped while a
  // search is active because that list comes from the search endpoint.
  useEffect(() => {
    if (query) return;
    setUsers(initialUsers);
    setTotal(initialTotal);
  }, [initialUsers, initialTotal, query]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/users?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        const data = (await res.json()) as { ok?: boolean; users?: AdminUser[]; total?: number };
        if (data.ok) {
          setUsers(data.users ?? []);
          setTotal(data.total ?? 0);
        }
      } catch {
        /* aborted or offline — keep the previous list */
      } finally {
        setLoading(false);
      }
    }, 320);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  return (
    <section className="rounded-2xl border border-white/[0.07] bg-ink-700/50 shadow-card">
      <header className="flex flex-col gap-4 border-b border-white/[0.07] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-display text-[15.5px] font-bold text-brand-100">
            <Users size={16} className="text-brand-400" />
            Customers
          </h2>
          <p className="mt-1 text-[12px] text-brand-300/60">
            {total} registered account{total === 1 ? "" : "s"}
          </p>
        </div>

        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-300/50" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, Account ID or phone"
            className="input w-full pl-10 sm:w-[330px]"
            aria-label="Search customers"
          />
          {loading && (
            <Loader2
              size={14}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-brand-400"
            />
          )}
        </div>
      </header>

      {users.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px]">
            <thead>
              <tr className="border-b border-white/[0.07] bg-white/[0.02]">
                <th className="table-th">Customer</th>
                <th className="table-th">Account ID</th>
                <th className="table-th">Country</th>
                <th className="table-th text-right">Balance</th>
                <th className="table-th text-right">Deposited</th>
                <th className="table-th">Pending</th>
                <th className="table-th">Joined</th>
                <th className="table-th text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <Fragment key={user.id}>
                <tr className="border-b border-white/[0.05] transition-colors hover:bg-white/[0.03]">
                  <td className="table-td">
                    <Link href={`/admin/users/${user.id}`} className="flex items-center gap-3 group">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-grad-soft text-[12px] font-extrabold text-brand-300 ring-1 ring-brand-400/20">
                        {initials(user.fullName)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[13.5px] font-bold text-brand-100 group-hover:text-brand-300">
                          {user.fullName}
                          {user.role === "admin" && (
                            <span className="ml-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-amber-300">
                              Admin
                            </span>
                          )}
                          {user.status === "suspended" && (
                            <span className="ml-2 rounded-full border border-rose-400/30 bg-rose-400/10 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-rose-300">
                              Suspended
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 block truncate text-[11.5px] text-brand-300/60">
                          {user.email}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="table-td numeric text-[12.5px] font-semibold text-brand-300">
                    {user.accountId}
                  </td>
                  <td className="table-td text-[12.5px] text-brand-300/75">{user.country || "—"}</td>
                  <td className="table-td numeric text-right font-bold text-brand-100">
                    {formatUsd(user.balance)}
                  </td>
                  <td className="table-td numeric text-right text-emerald-300/85">
                    {formatUsd(user.totalDeposited)}
                  </td>
                  <td className="table-td">
                    {user.pendingCount > 0 ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[11px] font-bold text-amber-300">
                        <Clock size={11} />
                        {user.pendingCount}
                      </span>
                    ) : (
                      <span className="text-[12px] text-brand-300/40">—</span>
                    )}
                  </td>
                  <td className="table-td text-[12px] text-brand-300/60">{timeAgo(user.createdAt)}</td>
                  <td className="table-td text-right">
                    <button
                      type="button"
                      aria-expanded={adjustingUser === user.id}
                      onClick={() =>
                        setAdjustingUser((current) => (current === user.id ? null : user.id))
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-[12px] font-semibold text-brand-200 transition hover:border-brand-400/40 hover:text-brand-100"
                    >
                      Adjust balance
                      <ArrowRight size={13} />
                    </button>
                  </td>
                </tr>
                {adjustingUser === user.id && (
                  <tr className="border-b border-white/[0.05]">
                    <td colSpan={8} className="p-4 sm:p-5">
                      <QuickCredit
                        user={user}
                        defaultOpen
                        onDone={(message) => {
                          push("success", message);
                          setAdjustingUser(null);
                        }}
                      />
                    </td>
                  </tr>
                )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="px-5 py-14 text-center">
          <CircleAlert size={22} className="mx-auto text-brand-300/40" />
          <p className="mt-3.5 text-[13.5px] font-semibold text-brand-200">
            {query ? "No customers match that search" : "No customers yet"}
          </p>
          <p className="mx-auto mt-2 max-w-sm text-[12.5px] text-brand-300/60">
            {query
              ? "Try a different name, email address, Account ID or phone number."
              : "Accounts will appear here the moment someone registers."}
          </p>
        </div>
      )}

      <ToastStack toasts={toasts} dismiss={dismiss} />
    </section>
  );
}

/* ---------------------------------------------------------- payments queue */

export function PaymentsQueue({
  initialTransactions,
  limit,
  showFilters = false,
}: {
  initialTransactions: AdminTransaction[];
  limit?: number;
  showFilters?: boolean;
}) {
  const router = useRouter();
  const [transactions, setTransactions] = useState(initialTransactions);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const { toasts, push, dismiss } = useToasts();

  const load = useCallback(
    async (status: string) => {
      try {
        const res = await fetch(
          `/api/admin/transactions${status && status !== "all" ? `?status=${status}` : ""}`,
        );
        const data = (await res.json()) as { ok?: boolean; transactions?: AdminTransaction[] };
        if (data.ok) setTransactions(data.transactions ?? []);
      } catch {
        push("error", "Could not refresh the payments list.");
      }
    },
    [push],
  );

  useEffect(() => {
    if (showFilters) void load(filter);
  }, [filter, load, showFilters]);

  const rows = useMemo(() => {
    const base = showFilters
      ? transactions
      : transactions.filter((t) => t.status === "pending");
    return limit ? base.slice(0, limit) : base;
  }, [transactions, showFilters, limit]);

  async function review(id: string, decision: "approve" | "reject") {
    setBusyId(id);
    try {
      const res = await fetch("/api/admin/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: id,
          decision,
          adminNote: notes[id] || "",
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; message?: string };
      if (!res.ok || !data.ok) {
        push("error", data.error || "The review could not be saved.");
        setBusyId(null);
        return;
      }
      push("success", data.message || "Saved.");
      setTransactions((prev) =>
        showFilters
          ? prev.map((t) => (t.id === id ? { ...t, status: decision === "approve" ? "approved" : "rejected" } : t))
          : prev.filter((t) => t.id !== id),
      );
      router.refresh();
    } catch {
      push("error", "Could not reach the server.");
    } finally {
      setBusyId(null);
    }
  }

  const pendingCount = transactions.filter((t) => t.status === "pending").length;

  return (
    <section className="rounded-2xl border border-white/[0.07] bg-ink-700/50 shadow-card">
      <header className="flex flex-col gap-4 border-b border-white/[0.07] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-display text-[15.5px] font-bold text-brand-100">
            <Wallet size={16} className="text-amber-400" />
            Payment submissions
            {pendingCount > 0 && (
              <span className="rounded-full border border-amber-400/35 bg-amber-400/12 px-2.5 py-0.5 text-[11px] font-bold text-amber-300">
                {pendingCount} pending
              </span>
            )}
          </h2>
          <p className="mt-1 text-[12px] text-brand-300/60">
            Verify the transfer on-chain, then approve to credit the customer instantly.
          </p>
        </div>

        {showFilters && (
          <div className="flex gap-1.5 rounded-xl border border-white/[0.07] bg-ink-900/45 p-1.5">
            {(["pending", "approved", "rejected", "all"] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFilter(status)}
                className={clsx(
                  "rounded-lg px-3.5 py-2 text-[12px] font-semibold capitalize transition",
                  filter === status
                    ? "bg-brand-grad text-[#04191F]"
                    : "text-brand-300/75 hover:bg-white/[0.06]",
                )}
              >
                {status}
              </button>
            ))}
          </div>
        )}
      </header>

      {rows.length ? (
        <ul className="divide-y divide-white/[0.05]">
          {rows.map((tx) => {
            const isOpen = expanded === tx.id;
            const pending = tx.status === "pending";
            return (
              <li key={tx.id} className="px-5 py-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span
                        className={clsx(
                          "rounded-full border px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide",
                          pending
                            ? "border-amber-400/35 bg-amber-400/12 text-amber-300"
                            : tx.status === "approved"
                              ? "border-emerald-400/35 bg-emerald-400/12 text-emerald-300"
                              : "border-rose-400/35 bg-rose-400/12 text-rose-300",
                        )}
                      >
                        {tx.status}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide text-brand-300">
                        {tx.type}
                      </span>
                      <span className="numeric text-[11.5px] text-brand-300/55">
                        {formatDateTime(tx.createdAt)}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1.5">
                      <Link
                        href={`/admin/users/${tx.userId}`}
                        className="text-[15px] font-bold text-brand-100 transition hover:text-brand-300"
                      >
                        {tx.userName}
                      </Link>
                      <span className="numeric text-[18px] font-extrabold text-brand-100">
                        {formatUsd(tx.amount)}
                      </span>
                      <span className="numeric text-[12px] text-brand-300/60">{tx.accountId}</span>
                    </div>

                    <p className="mt-1.5 text-[12px] text-brand-300/65">{tx.userEmail}</p>

                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[11.5px] text-brand-300/65">
                      {tx.method && (
                        <span>
                          Method: <span className="font-semibold text-brand-200">{tx.method}</span>
                        </span>
                      )}
                      {tx.providerRef && (
                        <span className="break-all">
                          TX: <span className="font-mono text-brand-200">{tx.providerRef}</span>
                        </span>
                      )}
                      <span>
                        Ref: <span className="font-mono text-brand-200">{tx.reference}</span>
                      </span>
                    </div>

                    {tx.note && (
                      <p className="mt-3 rounded-lg border border-white/[0.07] bg-white/[0.03] px-3.5 py-2.5 text-[12px] leading-relaxed text-brand-300/80">
                        <span className="font-semibold text-brand-200">Customer note: </span>
                        {tx.note}
                      </p>
                    )}
                    {tx.adminNote && (
                      <p className="mt-2 rounded-lg border border-amber-400/15 bg-amber-400/[0.05] px-3.5 py-2.5 text-[12px] leading-relaxed text-amber-100/80">
                        <span className="font-semibold">Your note: </span>
                        {tx.adminNote}
                      </p>
                    )}

                    {pending && (
                      <div className="mt-4">
                        {isOpen ? (
                          <input
                            className="input max-w-md"
                            placeholder="Optional note the customer will see in the email"
                            value={notes[tx.id] ?? ""}
                            onChange={(e) =>
                              setNotes((prev) => ({ ...prev, [tx.id]: e.target.value }))
                            }
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => setExpanded(tx.id)}
                            className="text-[12px] font-semibold text-brand-400 transition hover:text-brand-300"
                          >
                            + Add a note before deciding
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {pending && (
                    <div className="flex shrink-0 flex-wrap gap-2.5 lg:flex-col">
                      <button
                        type="button"
                        disabled={busyId === tx.id}
                        onClick={() => review(tx.id, "approve")}
                        className="btn-primary px-5 py-2.5 text-[12.5px]"
                      >
                        {busyId === tx.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <CheckCheck size={14} />
                        )}
                        Approve &amp; credit
                      </button>
                      <button
                        type="button"
                        disabled={busyId === tx.id}
                        onClick={() => review(tx.id, "reject")}
                        className="btn-danger px-5 py-2.5 text-[12.5px]"
                      >
                        <CircleX size={14} />
                        Reject
                      </button>
                    </div>
                  )}

                  {!pending && (
                    <Link
                      href={`/admin/users/${tx.userId}`}
                      className="btn-secondary shrink-0 px-4 py-2.5 text-[12.5px]"
                    >
                      Open customer
                      <ArrowRight size={13} />
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="px-5 py-14 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-emerald-400/[0.1] text-emerald-400">
            <CircleCheck size={22} />
          </span>
          <p className="mt-4 text-[13.5px] font-semibold text-brand-200">
            {showFilters && filter !== "pending"
              ? `No ${filter} payments`
              : "Nothing waiting for review"}
          </p>
          <p className="mx-auto mt-2 max-w-sm text-[12.5px] text-brand-300/60">
            {showFilters && filter !== "pending"
              ? "Try another status filter."
              : "Every submitted payment has been reviewed. New submissions appear here instantly and land in your inbox."}
          </p>
        </div>
      )}

      <ToastStack toasts={toasts} dismiss={dismiss} />
    </section>
  );
}
