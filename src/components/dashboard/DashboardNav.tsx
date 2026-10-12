"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import type { SessionUser } from "@/lib/auth";
import { Logo } from "@/components/ui/Logo";
import { formatUsd, initials } from "@/lib/format";
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  PieChart,
  Wallet,
  Gem,
  Settings,
  ShieldCheck,
} from "@/components/ui/icons";

const LINKS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/deposit", label: "Deposit", icon: Wallet },
  { href: "/dashboard/plans", label: "Investment Plans", icon: PieChart },
  { href: "/dashboard/nft", label: "My NFTs", icon: Gem },
];

export function DashboardNav({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-ink-900/85 backdrop-blur-xl">
      <div className="container-x">
        <div className="flex h-[64px] items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Logo markSize={28} href="/dashboard" />
            <nav className="hidden items-center gap-1 lg:flex" aria-label="Dashboard">
              {LINKS.map((link) => {
                const active =
                  link.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(link.href);
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={clsx(
                      "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-[13px] font-semibold transition",
                      active
                        ? "bg-brand-400/[0.13] text-brand-100"
                        : "text-brand-300/75 hover:bg-white/[0.05] hover:text-brand-100",
                    )}
                  >
                    <Icon size={15} />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 sm:flex">
              <Wallet size={14} className="text-brand-400" />
              <span className="numeric text-[13px] font-bold text-brand-100">
                {formatUsd(user.balance)}
              </span>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-expanded={menuOpen}
                className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] py-1.5 pl-1.5 pr-3 transition hover:border-white/20"
              >
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-grad text-[11px] font-black text-[#04191F]">
                  {initials(user.fullName)}
                </span>
                <span className="hidden max-w-[110px] truncate text-[12.5px] font-semibold text-brand-200 sm:block">
                  {user.fullName.split(" ")[0]}
                </span>
                <ChevronDown
                  size={14}
                  className={clsx("text-brand-300/60 transition-transform", menuOpen && "rotate-180")}
                />
              </button>

              {menuOpen && (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-10 cursor-default"
                    aria-label="Close menu"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-[248px] overflow-hidden rounded-2xl border border-white/[0.1] bg-ink-700/98 p-2 shadow-card backdrop-blur-xl">
                    <div className="px-3 py-2.5">
                      <p className="truncate text-[13.5px] font-bold text-brand-100">
                        {user.fullName}
                      </p>
                      <p className="mt-0.5 truncate text-[11.5px] text-brand-300/60">{user.email}</p>
                      <p className="numeric mt-1.5 text-[11.5px] font-semibold text-brand-400">
                        {user.accountId}
                      </p>
                    </div>
                    <div className="divider my-1.5" />
                    {user.role === "admin" && (
                      <Link
                        href="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-amber-200 transition hover:bg-amber-400/10"
                      >
                        <ShieldCheck size={15} />
                        Admin dashboard
                      </Link>
                    )}
                    <Link
                      href="/dashboard/settings"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-brand-200 transition hover:bg-white/[0.06]"
                    >
                      <Settings size={15} />
                      Account details
                    </Link>
                    <button
                      type="button"
                      onClick={signOut}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold text-rose-300 transition hover:bg-rose-500/10"
                    >
                      <LogOut size={15} />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto pb-3 lg:hidden" aria-label="Dashboard mobile">
          {LINKS.map((link) => {
            const active =
              link.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "inline-flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-[12.5px] font-semibold transition",
                  active
                    ? "border-brand-400/35 bg-brand-400/[0.13] text-brand-100"
                    : "border-white/[0.08] bg-white/[0.03] text-brand-300/75",
                )}
              >
                <Icon size={14} />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

export default DashboardNav;
