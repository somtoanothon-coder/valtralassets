import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import {
  ensureSchema,
  isDatabaseConfigured,
  query,
  queryOne,
  type InvestmentRow,
  type NftHoldingRow,
  type TransactionRow,
  type UserRow,
} from "@/lib/db";
import {
  formatDate,
  formatDateTime,
  formatUsd,
  initials,
  statusTone,
  TX_TYPE_LABEL,
} from "@/lib/format";
import { QuickCredit } from "@/components/admin/AdminClient";
import { CustomerStatusControls } from "@/components/admin/CustomerStatusControls";
import { MessageComposer } from "@/components/admin/MessageComposer";
import { AdminDatabaseNotice } from "@/components/admin/AdminDatabaseNotice";
import { mailerConfigured } from "@/lib/mail";
import { ArrowRight, Coins, LayoutDashboard, PieChart, Users } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Customer",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-[10.5px] font-bold uppercase tracking-[0.13em] text-brand-300/55">
        {label}
      </p>
      <p className="mt-1 break-words text-[13px] font-semibold text-brand-100">
        {value && value.trim() ? value : "—"}
      </p>
    </div>
  );
}

export default async function AdminCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireAdmin();
  if (!admin) return null;

  const { id } = await params;
  const configured = isDatabaseConfigured();
  if (configured) await ensureSchema().catch(() => undefined);

  if (!configured) {
    return (
      <div className="space-y-6">
        <AdminDatabaseNotice context="customer profiles cannot be loaded." />
      </div>
    );
  }

  const user = await queryOne<UserRow>(`SELECT * FROM users WHERE id = $1 LIMIT 1`, [id]);
  if (!user) notFound();

  const [transactions, investments, holdings] = await Promise.all([
    query<TransactionRow>(
      `SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [id],
    ).catch(() => [] as TransactionRow[]),
    query<InvestmentRow>(
      `SELECT * FROM investments WHERE user_id = $1 ORDER BY created_at DESC LIMIT 25`,
      [id],
    ).catch(() => [] as InvestmentRow[]),
    query<NftHoldingRow>(
      `SELECT * FROM nft_holdings WHERE user_id = $1 ORDER BY created_at DESC LIMIT 25`,
      [id],
    ).catch(() => [] as NftHoldingRow[]),
  ]);

  const activeCapital = investments
    .filter((i) => i.status === "active")
    .reduce((sum, i) => sum + Number(i.amount), 0);
  const isSelf = user.id === admin.id;

  return (
    <div className="space-y-8">
      <nav className="flex items-center gap-2 text-[12.5px] text-brand-300/60">
        <Link href="/admin" className="transition hover:text-brand-200">
          Operations console
        </Link>
        <ArrowRight size={12} />
        <Link href="/admin/users" className="transition hover:text-brand-200">
          Customers
        </Link>
        <ArrowRight size={12} />
        <span className="font-semibold text-brand-200">{user.full_name}</span>
      </nav>

      <header className="flex flex-col gap-5 rounded-2xl border border-white/[0.07] bg-gradient-to-br from-ink-600/70 via-ink-700/60 to-ink-800/70 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-grad text-[17px] font-extrabold text-[#04191F]">
            {initials(user.full_name)}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-[24px] font-extrabold tracking-[-0.02em] text-brand-100 sm:text-[27px]">
                {user.full_name}
              </h1>
              {user.role === "admin" && (
                <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-300">
                  Administrator
                </span>
              )}
              <span
                className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                  user.status === "suspended"
                    ? "border-rose-400/30 bg-rose-400/10 text-rose-300"
                    : "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                }`}
              >
                {user.status}
              </span>
            </div>
            <p className="mt-2 text-[13px] text-brand-300/70">
              <span className="numeric font-semibold text-brand-200">{user.account_id}</span> ·{" "}
              {user.email}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-brand-400/25 bg-brand-400/[0.07] px-5 py-4">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-brand-300/65">
            Wallet balance
          </p>
          <p className="numeric mt-1.5 font-display text-[26px] font-extrabold leading-none text-brand-100">
            {formatUsd(Number(user.balance))}
          </p>
          <p className="mt-2 text-[11.5px] text-brand-300/60">
            {formatUsd(Number(user.total_deposited))} deposited all time
          </p>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Active capital",
            value: formatUsd(activeCapital),
            hint: `${investments.filter((i) => i.status === "active").length} active plan(s)`,
            icon: PieChart,
            tone: "text-amber-400",
          },
          {
            label: "Lifetime deposits",
            value: formatUsd(Number(user.total_deposited)),
            hint: `${transactions.length} recent ledger entr${transactions.length === 1 ? "y" : "ies"}`,
            icon: Coins,
            tone: "text-emerald-400",
          },
          {
            label: "Collectibles",
            value: String(holdings.filter((h) => h.status !== "rejected").length),
            hint: `${holdings.length} NFT record(s)`,
            icon: Users,
            tone: "text-brand-400",
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card p-5">
              <div className="flex items-center justify-between">
                <span className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-brand-300/60">
                  {stat.label}
                </span>
                <Icon size={17} className={stat.tone} />
              </div>
              <p className="numeric mt-3.5 font-display text-[23px] font-extrabold leading-none text-brand-100">
                {stat.value}
              </p>
              <p className="mt-2 text-[11.5px] text-brand-300/55">{stat.hint}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className="space-y-6">
          <div className="card p-6">
            <h2 className="font-display text-[15.5px] font-bold text-brand-100">
              Adjust this customer&apos;s balance
            </h2>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-brand-300/70">
              Increase the balance when you confirm a deposit, or decrease it to correct a mistaken
              credit. Every movement is written to the ledger and the audit log.
            </p>
            <div className="mt-5">
              <QuickCredit
                user={{
                  id: user.id,
                  fullName: user.full_name,
                  accountId: user.account_id,
                  balance: Number(user.balance),
                }}
              />
            </div>
          </div>

          <section className="rounded-2xl border border-white/[0.07] bg-ink-700/50 shadow-card">
            <header className="border-b border-white/[0.07] px-5 py-4">
              <h2 className="font-display text-[15.5px] font-bold text-brand-100">
                Transaction ledger
              </h2>
            </header>

            {transactions.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px]">
                  <thead>
                    <tr className="border-b border-white/[0.07] bg-white/[0.02]">
                      <th className="table-th">Type</th>
                      <th className="table-th">Reference</th>
                      <th className="table-th text-right">Amount</th>
                      <th className="table-th">Status</th>
                      <th className="table-th">When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr
                        key={tx.id}
                        className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.03]"
                      >
                        <td className="table-td text-[12.5px] font-semibold text-brand-100">
                          {TX_TYPE_LABEL[tx.type] || tx.type}
                        </td>
                        <td className="table-td numeric text-[11.5px] text-brand-300/60">
                          {tx.reference}
                        </td>
                        <td className="table-td numeric text-right font-bold text-brand-100">
                          {tx.direction === "debit" ? "−" : "+"}
                          {formatUsd(Number(tx.amount))}
                        </td>
                        <td className="table-td">
                          <span
                            className={`inline-block rounded-full border px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide ${statusTone(
                              tx.status,
                            )}`}
                          >
                            {tx.status}
                          </span>
                        </td>
                        <td className="table-td text-[11.5px] text-brand-300/60">
                          {formatDateTime(tx.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="px-5 py-10 text-center text-[13px] text-brand-300/60">
                No transactions recorded yet.
              </p>
            )}
          </section>
        </section>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-white/[0.07] bg-ink-700/50 p-6 shadow-card">
            <h2 className="font-display text-[15.5px] font-bold text-brand-100">Profile</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Email" value={user.email} />
              <Field label="Phone" value={user.phone} />
              <Field label="Country" value={user.country} />
              <Field label="Occupation" value={user.occupation} />
              <Field
                label="Account type"
                value={user.account_type === "joint" ? "Joint / Corporate" : "Individual"}
              />
              <Field label="Date of birth" value={user.date_of_birth} />
              <Field label="Address" value={user.address} />
              <Field label="Referral code" value={user.referral_code} />
              <Field label="Referred by" value={user.referred_by} />
              <Field label="Registered" value={formatDate(user.created_at)} />
              <Field
                label="Last sign-in"
                value={user.last_login_at ? formatDateTime(user.last_login_at) : "Never"}
              />
            </div>

            {user.account_type === "joint" && (
              <div className="mt-5 border-t border-white/[0.07] pt-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.13em] text-amber-400">
                  Second holder
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field label="Name" value={user.second_full_name} />
                  <Field label="Email" value={user.second_email} />
                  <Field label="Phone" value={user.second_phone} />
                  <Field label="Country" value={user.second_country} />
                </div>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-white/[0.07] bg-ink-700/50 p-6 shadow-card">
            <h2 className="font-display text-[15.5px] font-bold text-brand-100">
              Account controls
            </h2>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-brand-300/70">
              Suspend access to block sign-in, or promote this account to an administrator.
            </p>
            <div className="mt-5">
              <CustomerStatusControls
                userId={user.id}
                status={user.status}
                role={user.role}
                isSelf={isSelf}
              />
            </div>
          </section>

          <MessageComposer
            presetRecipient={{ email: user.email, name: user.full_name }}
            mailerReady={mailerConfigured()}
            compact
          />

          <section className="rounded-2xl border border-white/[0.07] bg-ink-700/50 shadow-card">
            <header className="border-b border-white/[0.07] px-5 py-4">
              <h2 className="font-display text-[15.5px] font-bold text-brand-100">
                Investments
              </h2>
            </header>
            {investments.length ? (
              <ul className="divide-y divide-white/[0.05]">
                {investments.map((inv) => (
                  <li key={inv.id} className="flex items-center justify-between gap-3 px-5 py-4">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-brand-100">
                        {inv.plan_name}
                      </p>
                      <p className="numeric mt-0.5 text-[11.5px] text-brand-300/60">
                        {Number(inv.roi_percent).toFixed(2)}% · {inv.duration_days} days
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="numeric text-[13px] font-bold text-brand-100">
                        {formatUsd(Number(inv.amount))}
                      </p>
                      <span
                        className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusTone(
                          inv.status,
                        )}`}
                      >
                        {inv.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-8 text-center text-[12.5px] text-brand-300/60">
                No investment plans yet.
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-white/[0.07] bg-ink-700/50 shadow-card">
            <header className="border-b border-white/[0.07] px-5 py-4">
              <h2 className="font-display text-[15.5px] font-bold text-brand-100">
                Collectibles
              </h2>
            </header>
            {holdings.length ? (
              <ul className="divide-y divide-white/[0.05]">
                {holdings.map((holding) => (
                  <li key={holding.id} className="flex items-center justify-between gap-3 px-5 py-4">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-brand-100">
                        {holding.name}
                      </p>
                      <p className="numeric mt-0.5 text-[11.5px] text-brand-300/60">
                        {formatUsd(Number(holding.price_usd))}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusTone(
                        holding.status,
                      )}`}
                    >
                      {holding.status}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-8 text-center text-[12.5px] text-brand-300/60">
                No collectibles owned.
              </p>
            )}
          </section>

          <Link
            href="/admin/users"
            className="btn-secondary flex w-full items-center justify-center gap-2 py-3 text-[13px]"
          >
            <LayoutDashboard size={15} />
            Back to all customers
          </Link>
        </aside>
      </div>
    </div>
  );
}
