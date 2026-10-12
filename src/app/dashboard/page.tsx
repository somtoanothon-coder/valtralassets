import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  ensureSchema,
  isDatabaseConfigured,
  query,
  type InvestmentRow,
  type NftHoldingRow,
  type TransactionRow,
} from "@/lib/db";
import { formatDate, formatDateTime, formatUsd, statusTone, TX_TYPE_LABEL } from "@/lib/format";
import { CONTACT, WALLETS } from "@/config/site";
import { NFTS } from "@/lib/nft";
import {
  ArrowRight,
  Coins,
  LogIn,
  PieChart,
  Plus,
  TrendingUp,
  Wallet,
} from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Overview",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const configured = isDatabaseConfigured();
  if (configured) await ensureSchema().catch(() => undefined);

  const [transactions, investments, holdings] = configured
    ? await Promise.all([
        query<TransactionRow>(
          `SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 8`,
          [user.id],
        ).catch(() => []),
        query<InvestmentRow>(
          `SELECT * FROM investments WHERE user_id = $1 ORDER BY created_at DESC LIMIT 6`,
          [user.id],
        ).catch(() => []),
        query<NftHoldingRow>(
          `SELECT * FROM nft_holdings WHERE user_id = $1 ORDER BY created_at DESC LIMIT 6`,
          [user.id],
        ).catch(() => []),
      ])
    : [[], [], []];

  const activeInvested = investments
    .filter((i) => i.status === "active")
    .reduce((sum, i) => sum + Number(i.amount), 0);
  const projectedRoi = investments
    .filter((i) => i.status === "active")
    .reduce((sum, i) => sum + (Number(i.amount) * Number(i.roi_percent)) / 100, 0);

  const stats = [
    {
      label: "Wallet Balance",
      value: formatUsd(user.balance),
      icon: Wallet,
      tone: "text-brand-400",
      hint: "Available to trade or invest",
    },
    {
      label: "Total Deposited",
      value: formatUsd(user.totalDeposited),
      icon: Coins,
      tone: "text-emerald-400",
      hint: "Lifetime verified deposits",
    },
    {
      label: "Active Capital",
      value: formatUsd(activeInvested),
      icon: PieChart,
      tone: "text-amber-400",
      hint: `${investments.filter((i) => i.status === "active").length} active plan(s)`,
    },
    {
      label: "Projected ROI",
      value: formatUsd(projectedRoi),
      icon: TrendingUp,
      tone: "text-brand-300",
      hint: "At plan maturity",
    },
  ];

  const ownedNfts = holdings.filter((h) => h.status !== "rejected");
  const spotlight = NFTS.slice(0, 2);

  return (
    <div className="space-y-8">
      {/* Greeting --------------------------------------------------------- */}
      <div className="flex flex-col gap-5 rounded-2xl border border-white/[0.07] bg-gradient-to-br from-ink-600/70 via-ink-700/60 to-ink-800/70 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div>
          <p className="text-[11.5px] font-bold uppercase tracking-[0.16em] text-brand-400">
            Account overview
          </p>
          <h1 className="mt-2 font-display text-[26px] font-extrabold tracking-[-0.02em] text-brand-100 sm:text-[30px]">
            Welcome back, {user.fullName.split(" ")[0]}
          </h1>
          <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-brand-300/70">
            Your Account ID is{" "}
            <span className="numeric font-semibold text-brand-200">{user.accountId}</span> — keep it
            safe, you need it to sign in.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link href="/dashboard/deposit" className="btn-primary px-5 py-3 text-[13.5px]">
            <Plus size={16} />
            Add funds
          </Link>
          <Link href="/dashboard/plans" className="btn-secondary px-5 py-3 text-[13.5px]">
            <PieChart size={16} />
            Invest
          </Link>
        </div>
      </div>

      {!configured && (
        <div className="rounded-2xl border border-amber-400/25 bg-amber-400/[0.07] px-5 py-4 text-[13px] leading-relaxed text-amber-200">
          <strong className="font-semibold">Database not connected.</strong> Connect Netlify
          Database to this site, or set a PostgreSQL connection string in the{" "}
          <code className="rounded bg-black/30 px-1.5 py-0.5 text-[12px]">DATABASE_URL</code>{" "}
          environment variable, then redeploy to activate balances, payments and the admin dashboard.
        </div>
      )}

      {/* Stats ------------------------------------------------------------ */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card p-5">
              <div className="flex items-center justify-between">
                <span className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-brand-300/60">
                  {stat.label}
                </span>
                <Icon size={17} className={stat.tone} />
              </div>
              <p className="numeric mt-3.5 font-display text-[24px] font-extrabold leading-none text-brand-100">
                {stat.value}
              </p>
              <p className="mt-2 text-[11.5px] text-brand-300/55">{stat.hint}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        {/* Recent activity ------------------------------------------------ */}
        <section className="rounded-2xl border border-white/[0.07] bg-ink-700/50 shadow-card">
          <header className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
            <h2 className="font-display text-[15.5px] font-bold text-brand-100">Recent activity</h2>
            <Link
              href="/dashboard/deposit"
              className="text-[12.5px] font-semibold text-brand-400 transition hover:text-brand-300"
            >
              Submit a payment
            </Link>
          </header>

          {transactions.length ? (
            <ul className="divide-y divide-white/[0.05]">
              {transactions.map((tx) => (
                <li key={tx.id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-semibold text-brand-100">
                      {TX_TYPE_LABEL[tx.type] || tx.type}
                    </p>
                    <p className="numeric mt-0.5 truncate text-[11.5px] text-brand-300/55">
                      {tx.reference} · {formatDateTime(tx.created_at)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="numeric text-[14px] font-bold text-brand-100">
                      {tx.direction === "debit" ? "−" : "+"}
                      {formatUsd(tx.amount)}
                    </p>
                    <span
                      className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide ${statusTone(
                        tx.status,
                      )}`}
                    >
                      {tx.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-5 py-12 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-400/[0.1] text-brand-400">
                <Wallet size={22} />
              </span>
              <p className="mt-4 text-[14px] font-semibold text-brand-200">No payments yet</p>
              <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-brand-300/65">
                Fund your wallet with crypto to start trading or investing. Every deposit is
                verified by our team before it is credited.
              </p>
              <Link href="/dashboard/deposit" className="btn-primary mt-5 px-5 py-3 text-[13.5px]">
                Make your first deposit
                <ArrowRight size={15} />
              </Link>
            </div>
          )}
        </section>

        <div className="space-y-6">
          {/* Investments -------------------------------------------------- */}
          <section className="rounded-2xl border border-white/[0.07] bg-ink-700/50 shadow-card">
            <header className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
              <h2 className="font-display text-[15.5px] font-bold text-brand-100">Investments</h2>
              <Link
                href="/dashboard/plans"
                className="text-[12.5px] font-semibold text-brand-400 transition hover:text-brand-300"
              >
                Browse plans
              </Link>
            </header>

            {investments.length ? (
              <ul className="divide-y divide-white/[0.05]">
                {investments.map((inv) => (
                  <li key={inv.id} className="px-5 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[13.5px] font-semibold text-brand-100">{inv.plan_name}</p>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide ${statusTone(
                          inv.status,
                        )}`}
                      >
                        {inv.status}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[12px] text-brand-300/65">
                      <span className="numeric">
                        {formatUsd(inv.amount)} · {Number(inv.roi_percent).toFixed(2)}%
                      </span>
                      <span>Matures {formatDate(inv.matures_at)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-5 py-9 text-center">
                <p className="text-[13.5px] font-semibold text-brand-200">No active plans</p>
                <p className="mt-2 text-[12.5px] text-brand-300/65">
                  Earn fixed ROI from 5% to 18% over 30–90 days.
                </p>
                <Link href="/dashboard/plans" className="btn-secondary mt-4 px-4 py-2.5 text-[12.5px]">
                  View investment plans
                </Link>
              </div>
            )}
          </section>

          {/* Collectibles ------------------------------------------------- */}
          <section className="rounded-2xl border border-white/[0.07] bg-ink-700/50 shadow-card">
            <header className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
              <h2 className="font-display text-[15.5px] font-bold text-brand-100">My collectibles</h2>
              <Link
                href="/dashboard/nft"
                className="text-[12.5px] font-semibold text-brand-400 transition hover:text-brand-300"
              >
                Marketplace
              </Link>
            </header>

            {ownedNfts.length ? (
              <ul className="divide-y divide-white/[0.05]">
                {ownedNfts.map((h) => (
                  <li key={h.id} className="flex items-center justify-between gap-3 px-5 py-4">
                    <div>
                      <p className="text-[13.5px] font-semibold text-brand-100">{h.name}</p>
                      <p className="numeric mt-0.5 text-[11.5px] text-brand-300/55">
                        {formatUsd(h.price_usd)} · {Number(h.price_eth).toFixed(4)} ETH
                      </p>
                    </div>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide ${statusTone(
                        h.status,
                      )}`}
                    >
                      {h.status === "pending" ? "Awaiting" : h.status}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-5 py-9 text-center">
                <p className="text-[13.5px] font-semibold text-brand-200">You don&apos;t own any NFTs yet</p>
                <p className="mt-2 text-[12.5px] text-brand-300/65">
                  Browse limited-edition digital collectibles from the marketplace.
                </p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {spotlight.map((nft) => (
                    <Link
                      key={nft.slug}
                      href={`/dashboard/nft/${nft.slug}`}
                      className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-3 text-left transition hover:border-brand-400/35"
                    >
                      <p className="truncate text-[12px] font-bold text-brand-100">{nft.name}</p>
                      <p className="numeric mt-1 text-[11px] text-brand-400">
                        {formatUsd(nft.priceUsd)}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Funding help ------------------------------------------------------ */}
      <section className="rounded-2xl border border-white/[0.07] bg-ink-700/45 p-6">
        <h2 className="font-display text-[15.5px] font-bold text-brand-100">Funding your wallet</h2>
        <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-brand-300/70">
          Transfer crypto to one of our settlement wallets, then submit the transaction hash on the
          deposit page. Our team confirms it on-chain — usually in under 30 minutes — and credits
          your balance. Questions? Email{" "}
          <a href={`mailto:${CONTACT.supportEmail}`} className="font-semibold text-brand-400 hover:underline">
            {CONTACT.supportEmail}
          </a>
          .
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {WALLETS.map((wallet) => (
            <span
              key={wallet.id}
              className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[11.5px] font-semibold text-brand-300/85"
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: wallet.color }} />
              {wallet.asset} · {wallet.network}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
