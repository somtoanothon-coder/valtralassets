import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getWallets } from "@/lib/wallets";
import { ensureSchema, isDatabaseConfigured, query, type TransactionRow } from "@/lib/db";
import { formatDateTime, formatUsd, statusTone, TX_TYPE_LABEL } from "@/lib/format";
import { CONTACT } from "@/config/site";
import { MIN_DEPOSIT } from "@/lib/plans";
import { PaymentForm } from "@/components/dashboard/PaymentForm";
import { CircleAlert, Clock, ShieldCheck } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Deposit funds",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DepositPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const wallets = await getWallets();

  let transactions: TransactionRow[] = [];
  if (isDatabaseConfigured()) {
    await ensureSchema().catch(() => undefined);
    transactions = await query<TransactionRow>(
      `SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 12`,
      [user.id],
    ).catch(() => []);
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-[27px] font-extrabold tracking-[-0.02em] text-brand-100 sm:text-[31px]">
          Fund your wallet
        </h1>
        <p className="mt-2.5 max-w-2xl text-[14px] leading-relaxed text-brand-300/75">
          Transfer crypto to one of the settlement wallets below, then submit the transaction hash.
          Our team verifies every payment on-chain before it is credited to your balance.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: Clock,
            title: "Manual review",
            body: "Approved in under 30 minutes during business hours.",
          },
          {
            icon: ShieldCheck,
            title: "Segregated wallets",
            body: "Client funds are held separately with cold storage cover.",
          },
          {
            icon: CircleAlert,
            title: "Minimum deposit",
            body: `${formatUsd(MIN_DEPOSIT)} — and always double-check the network.`,
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="card p-5">
              <Icon size={18} className="text-brand-400" />
              <p className="mt-3.5 text-[13.5px] font-bold text-brand-100">{item.title}</p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-brand-300/70">{item.body}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <PaymentForm wallets={wallets} defaultPurpose="deposit" minAmount={MIN_DEPOSIT} />

        <aside className="space-y-6">
          <section className="rounded-2xl border border-white/[0.07] bg-ink-700/50 shadow-card">
            <header className="border-b border-white/[0.07] px-5 py-4">
              <h2 className="font-display text-[15.5px] font-bold text-brand-100">
                Your payment history
              </h2>
            </header>

            {transactions.length ? (
              <ul className="divide-y divide-white/[0.05]">
                {transactions.map((tx) => (
                  <li key={tx.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-brand-100">
                          {TX_TYPE_LABEL[tx.type] || tx.type}
                        </p>
                        <p className="numeric mt-0.5 truncate text-[11px] text-brand-300/55">
                          {tx.reference}
                        </p>
                        <p className="mt-0.5 text-[11px] text-brand-300/45">
                          {formatDateTime(tx.created_at)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="numeric text-[13.5px] font-bold text-brand-100">
                          {tx.direction === "debit" ? "−" : "+"}
                          {formatUsd(tx.amount)}
                        </p>
                        <span
                          className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusTone(
                            tx.status,
                          )}`}
                        >
                          {tx.status === "pending" ? "In review" : tx.status}
                        </span>
                      </div>
                    </div>
                    {tx.admin_note && (
                      <p className="mt-2.5 rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-[11.5px] leading-relaxed text-brand-300/75">
                        <span className="font-semibold text-brand-200">Note from our team: </span>
                        {tx.admin_note}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-10 text-center text-[13px] text-brand-300/60">
                No payments submitted yet.
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.05] p-5">
            <h2 className="text-[13.5px] font-bold text-amber-200">Before you send crypto</h2>
            <ul className="mt-3 space-y-2.5 text-[12.5px] leading-relaxed text-amber-100/80">
              <li>• Confirm the network matches the wallet exactly (TRC20 ≠ ERC20).</li>
              <li>• Send only the asset shown — other tokens may be lost permanently.</li>
              <li>• Keep your transaction hash: you will need it on this page.</li>
              <li>
                • We never ask for your password, 2FA code or seed phrase. Report anything
                suspicious to{" "}
                <a href={`mailto:${CONTACT.supportEmail}`} className="font-semibold underline">
                  {CONTACT.supportEmail}
                </a>
                .
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
