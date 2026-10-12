import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { ensureSchema, isDatabaseConfigured, query } from "@/lib/db";
import { formatUsd } from "@/lib/format";
import { mapAdminTransaction } from "@/lib/admin";
import { PaymentsQueue } from "@/components/admin/AdminClient";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminDatabaseNotice } from "@/components/admin/AdminDatabaseNotice";
import { Settings, LayoutDashboard } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Payments",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type PendingTransactionRow = {
  id: string;
  reference: string;
  user_id: string;
  full_name: string;
  account_id: string;
  email: string;
  type: string;
  amount: string;
  method: string | null;
  network: string | null;
  wallet_address: string | null;
  provider_ref: string | null;
  status: string;
  plan_id: string | null;
  item_slug: string | null;
  note: string | null;
  admin_note: string | null;
  created_at: string;
};

export default async function AdminPaymentsPage() {
  const admin = await requireAdmin();
  if (!admin) return null;

  const configured = isDatabaseConfigured();
  if (configured) await ensureSchema().catch(() => undefined);

  const rows = configured
    ? await query<PendingTransactionRow>(
        `SELECT t.id, t.reference, t.user_id, u.full_name, u.account_id, u.email, t.type, t.amount,
                t.method, t.network, t.wallet_address, t.provider_ref, t.status, t.plan_id,
                t.item_slug, t.note, t.admin_note, t.created_at
         FROM transactions t JOIN users u ON u.id = t.user_id
         ORDER BY (t.status = 'pending') DESC, t.created_at DESC
         LIMIT 200`,
      ).catch(() => [] as PendingTransactionRow[])
    : [];

  const transactions = rows.map(mapAdminTransaction);
  const pending = transactions.filter((tx) => tx.status === "pending");
  const pendingValue = pending.reduce((sum, tx) => sum + tx.amount, 0);
  const approvedValue = transactions
    .filter((tx) => tx.status === "approved")
    .reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Operations console"
        title="Payment submissions"
        description={
          <>
            {pending.length
              ? `${pending.length} payment${pending.length === 1 ? "" : "s"} worth ${formatUsd(pendingValue)} waiting for review.`
              : "Nothing is waiting for review right now."}{" "}
            Verify each transfer on-chain before approving. Approving credits the customer&apos;s
            wallet instantly and emails them a receipt.
          </>
        }
        actions={
          <>
            <Link href="/admin" className="btn-secondary px-5 py-3 text-[13.5px]">
              <LayoutDashboard size={16} />
              Overview
            </Link>
            <Link href="/admin/settings" className="btn-secondary px-5 py-3 text-[13.5px]">
              <Settings size={16} />
              Wallet addresses
            </Link>
          </>
        }
      />

      {!configured && <AdminDatabaseNotice context="payments stay empty." />}

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Awaiting review", value: formatUsd(pendingValue), hint: `${pending.length} submission(s)` },
          { label: "Approved value", value: formatUsd(approvedValue), hint: "In this list" },
          {
            label: "Total submissions",
            value: String(transactions.length),
            hint: "Most recent 200",
          },
        ].map((stat) => (
          <div key={stat.label} className="card p-5">
            <p className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-brand-300/60">
              {stat.label}
            </p>
            <p className="numeric mt-3 font-display text-[22px] font-extrabold leading-none text-brand-100">
              {stat.value}
            </p>
            <p className="mt-2 text-[11.5px] text-brand-300/55">{stat.hint}</p>
          </div>
        ))}
      </div>

      <PaymentsQueue initialTransactions={transactions} showFilters />
    </div>
  );
}
