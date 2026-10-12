import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { ensureSchema, isDatabaseConfigured, query, queryOne, type UserRow } from "@/lib/db";
import { formatUsd } from "@/lib/format";
import { mapAdminUser } from "@/lib/admin";
import { UsersTable } from "@/components/admin/AdminClient";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminDatabaseNotice } from "@/components/admin/AdminDatabaseNotice";
import { LayoutDashboard, Wallet, Users } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Customers",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const admin = await requireAdmin();
  if (!admin) return null;

  const configured = isDatabaseConfigured();
  if (configured) await ensureSchema().catch(() => undefined);

  const [users, totals] = configured
    ? await Promise.all([
        query<UserRow & { pending_count: string; tx_count: string }>(
          `SELECT u.*,
                  (SELECT count(*) FROM transactions t WHERE t.user_id = u.id AND t.status = 'pending') AS pending_count,
                  (SELECT count(*) FROM transactions t WHERE t.user_id = u.id) AS tx_count
           FROM users u
           ORDER BY u.created_at DESC
           LIMIT 50`,
        ).catch(() => [] as (UserRow & { pending_count: string; tx_count: string })[]),
        queryOne<{
          user_count: string;
          total_balance: string;
          total_deposited: string;
          suspended_count: string;
        }>(
          `SELECT
             (SELECT count(*) FROM users) AS user_count,
             (SELECT coalesce(sum(balance),0) FROM users) AS total_balance,
             (SELECT coalesce(sum(total_deposited),0) FROM users) AS total_deposited,
             (SELECT count(*) FROM users WHERE status = 'suspended') AS suspended_count`,
        ).catch(() => null),
      ])
    : [[], null];

  const total = Number(totals?.user_count ?? users.length);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Operations console"
        title="Customers"
        description="Search every registered account, open a full profile, and increase or decrease the balance held in a customer wallet."
        actions={
          <>
            <Link href="/admin" className="btn-secondary px-5 py-3 text-[13.5px]">
              <LayoutDashboard size={16} />
              Overview
            </Link>
            <Link href="/admin/payments" className="btn-primary px-5 py-3 text-[13.5px]">
              <Wallet size={16} />
              Review payments
            </Link>
          </>
        }
      />

      {!configured && <AdminDatabaseNotice context="customer records stay empty." />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Registered accounts", value: String(total), hint: "All time" },
          {
            label: "Client balances",
            value: formatUsd(Number(totals?.total_balance ?? 0)),
            hint: "Total wallet liabilities",
          },
          {
            label: "Verified deposits",
            value: formatUsd(Number(totals?.total_deposited ?? 0)),
            hint: "Lifetime credited",
          },
          {
            label: "Suspended",
            value: String(Number(totals?.suspended_count ?? 0)),
            hint: "Blocked from signing in",
          },
        ].map((stat) => (
          <div key={stat.label} className="card p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-brand-300/60">
                {stat.label}
              </span>
              <Users size={16} className="text-brand-400" />
            </div>
            <p className="numeric mt-3.5 font-display text-[24px] font-extrabold leading-none text-brand-100">
              {stat.value}
            </p>
            <p className="mt-2 text-[11.5px] text-brand-300/55">{stat.hint}</p>
          </div>
        ))}
      </div>

      <UsersTable initialUsers={users.map(mapAdminUser)} initialTotal={total} />
    </div>
  );
}
