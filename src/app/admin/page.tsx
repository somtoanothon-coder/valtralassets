import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { ensureSchema, isDatabaseConfigured, query, queryOne, type UserRow } from "@/lib/db";
import { formatUsd } from "@/lib/format";
import { mailerConfigured } from "@/lib/mail";
import { mapAdminTransaction, mapAdminUser } from "@/lib/admin";
import {
  PaymentsQueue,
  QuickCredit,
  UsersTable,
  type AdminUser,
} from "@/components/admin/AdminClient";
import { ArrowRight, CircleAlert, Coins, Settings, TrendingUp, Users, Wallet } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Operations console",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const admin = await requireAdmin();
  if (!admin) return null;

  const configured = isDatabaseConfigured();
  if (configured) await ensureSchema().catch(() => undefined);

  const [users, totals, pending] = configured
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
          pending_amount: string;
          pending_count: string;
        }>(
          `SELECT
             (SELECT count(*) FROM users) AS user_count,
             (SELECT coalesce(sum(balance),0) FROM users) AS total_balance,
             (SELECT coalesce(sum(total_deposited),0) FROM users) AS total_deposited,
             (SELECT coalesce(sum(amount),0) FROM transactions WHERE status = 'pending') AS pending_amount,
             (SELECT count(*) FROM transactions WHERE status = 'pending') AS pending_count`,
        ).catch(() => null),
        query<{
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
        }>(
          `SELECT t.id, t.reference, t.user_id, u.full_name, u.account_id, u.email, t.type, t.amount,
                  t.method, t.network, t.wallet_address, t.provider_ref, t.status, t.plan_id,
                  t.item_slug, t.note, t.admin_note, t.created_at
           FROM transactions t JOIN users u ON u.id = t.user_id
           WHERE t.status = 'pending'
           ORDER BY t.created_at DESC
           LIMIT 25`,
        ).catch(() => []),
      ])
    : [[], null, []];

  const transactions = pending.map(mapAdminTransaction);

  const stats = [
    {
      label: "Customers",
      value: String(Number(totals?.user_count ?? users.length)),
      icon: Users,
      tone: "text-brand-400",
      hint: "Registered accounts",
      href: "/admin/users",
    },
    {
      label: "Pending reviews",
      value: String(Number(totals?.pending_count ?? transactions.length)),
      icon: Wallet,
      tone: "text-amber-400",
      hint: `${formatUsd(Number(totals?.pending_amount ?? 0))} awaiting approval`,
      href: "/admin/payments",
    },
    {
      label: "Client balances",
      value: formatUsd(Number(totals?.total_balance ?? 0)),
      icon: Coins,
      tone: "text-emerald-400",
      hint: "Total wallet liabilities",
      href: "/admin/users",
    },
    {
      label: "Verified deposits",
      value: formatUsd(Number(totals?.total_deposited ?? 0)),
      icon: TrendingUp,
      tone: "text-brand-300",
      hint: "Lifetime credited",
      href: "/admin/payments",
    },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-5 rounded-2xl border border-amber-400/20 bg-gradient-to-br from-amber-400/[0.07] via-ink-700/60 to-ink-800/70 p-6 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11.5px] font-bold uppercase tracking-[0.16em] text-amber-400">
            Operations console
          </p>
          <h1 className="mt-2 font-display text-[26px] font-extrabold tracking-[-0.02em] text-brand-100 sm:text-[30px]">
            Good to see you, {admin.fullName.split(" ")[0]}
          </h1>
          <p className="mt-2.5 max-w-xl text-[13.5px] leading-relaxed text-brand-300/70">
            Approve customer payments, credit balances and manage the wallet addresses shown on the
            deposit page. Email alerts are delivered to{" "}
            <span className="font-semibold text-brand-200">
              {process.env.ADMIN_NOTIFICATION_EMAIL || "your support inbox"}
            </span>
            .
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link href="/admin/payments" className="btn-primary px-5 py-3 text-[13.5px]">
            <Wallet size={16} />
            Review payments
          </Link>
          <Link href="/admin/settings" className="btn-secondary px-5 py-3 text-[13.5px]">
            <Settings size={16} />
            Wallet addresses
          </Link>
        </div>
      </header>

      {!configured && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-400/30 bg-rose-500/[0.1] px-5 py-4 text-[13px] leading-relaxed text-rose-100">
          <CircleAlert size={17} className="mt-0.5 shrink-0" />
          <span>
            <strong className="font-semibold">No database connected.</strong> Set{" "}
            <code className="rounded bg-black/30 px-1.5 py-0.5 text-[12px]">DATABASE_URL</code> to your
            Neon connection string in Netlify → Site configuration → Environment variables, then
            redeploy. Until then customers, balances and payments stay empty.
          </span>
        </div>
      )}

      {configured && !mailerConfigured() && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-400/25 bg-amber-400/[0.07] px-5 py-4 text-[13px] leading-relaxed text-amber-100">
          <CircleAlert size={17} className="mt-0.5 shrink-0" />
          <span>
            <strong className="font-semibold">Email sending is not configured yet.</strong> Add{" "}
            <code className="rounded bg-black/30 px-1.5 py-0.5 text-[12px]">RESEND_API_KEY</code> (or
            SMTP_HOST / SMTP_USER / SMTP_PASS) so welcome emails and payment alerts are delivered.
            Customers are still being registered normally.
          </span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="card card-hover group flex flex-col"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-brand-300/60">
                  {stat.label}
                </span>
                <Icon size={17} className={stat.tone} />
              </div>
              <p className="numeric mt-3.5 font-display text-[24px] font-extrabold leading-none text-brand-100">
                {stat.value}
              </p>
              <p className="mt-2 flex items-center gap-1.5 text-[11.5px] text-brand-300/55">
                {stat.hint}
                <ArrowRight
                  size={11}
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                />
              </p>
            </Link>
          );
        })}
      </div>

      <section className="card flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-300/60">
            Administrator account
          </p>
          <h2 className="mt-1.5 text-[15px] font-bold text-brand-100">{admin.fullName}</h2>
          <p className="mt-1 text-[12px] text-brand-300/65">
            Account <span className="numeric">{admin.accountId}</span> · balance{" "}
            <span className="numeric font-semibold text-brand-100">{formatUsd(admin.balance)}</span>
          </p>
        </div>
        <QuickCredit
          user={{
            id: admin.id,
            fullName: admin.fullName,
            accountId: admin.accountId,
            balance: admin.balance,
          }}
        />
      </section>

      <PaymentsQueue initialTransactions={transactions} limit={8} />

      <UsersTable
        initialUsers={users.map((u) => mapAdminUser(u))}
        initialTotal={Number(totals?.user_count ?? users.length)}
      />
    </div>
  );
}
