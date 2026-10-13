"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import type { SessionUser } from "@/lib/auth";
import { LogoMark } from "@/components/ui/Logo";
import { initials } from "@/lib/format";
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Mail,
  Settings,
  ShieldCheck,
  Users,
  Wallet,
} from "@/components/ui/icons";

const LINKS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/payments", label: "Payments", icon: Wallet },
  { href: "/admin/users", label: "Customers", icon: Users },
  { href: "/admin/messages", label: "Messages", icon: Mail },
  { href: "/admin/settings", label: "Wallet addresses", icon: Settings },
];

export function AdminNav({ admin }: { admin: SessionUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-amber-400/20 bg-ink-900/90 backdrop-blur-xl">
      <div className="container-x">
        <div className="flex h-[64px] items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex items-center gap-2.5">
              <LogoMark size={28} />
              <span className="flex flex-col leading-none">
                <span className="font-display text-[13.5px] font-extrabold tracking-[0.1em] text-brand-100">
                  VALTRA ASSETS
                </span>
                <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-amber-400">
                  Operations Console
                </span>
              </span>
            </Link>

            <nav className="hidden items-center gap-1 lg:flex" aria-label="Admin">
              {LINKS.map((link) => {
                const active = link.exact
                  ? pathname === link.href
                  : pathname.startsWith(link.href);
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={clsx(
                      "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-[13px] font-semibold transition",
                      active
                        ? "bg-amber-400/[0.14] text-amber-100"
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
            <Link
              href="/dashboard"
              className="hidden rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-[12.5px] font-semibold text-brand-300 transition hover:border-brand-400/40 hover:text-brand-100 sm:block"
            >
              Customer view
            </Link>

            <div className="relative">
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                className="flex items-center gap-2.5 rounded-xl border border-amber-400/25 bg-amber-400/[0.07] py-1.5 pl-1.5 pr-3 transition hover:border-amber-400/45"
              >
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-amber-400 text-[11px] font-black text-[#04191F]">
                  {initials(admin.fullName)}
                </span>
                <span className="hidden max-w-[110px] truncate text-[12.5px] font-semibold text-amber-100 sm:block">
                  {admin.fullName.split(" ")[0]}
                </span>
                <ChevronDown
                  size={14}
                  className={clsx("text-amber-300/70 transition-transform", open && "rotate-180")}
                />
              </button>

              {open && (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-10 cursor-default"
                    aria-label="Close menu"
                    onClick={() => setOpen(false)}
                  />
                  <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-[240px] overflow-hidden rounded-2xl border border-white/[0.1] bg-ink-700/98 p-2 shadow-card backdrop-blur-xl">
                    <div className="px-3 py-2.5">
                      <p className="flex items-center gap-1.5 text-[13.5px] font-bold text-brand-100">
                        <ShieldCheck size={13} className="text-amber-400" />
                        Administrator
                      </p>
                      <p className="mt-1 truncate text-[11.5px] text-brand-300/60">{admin.email}</p>
                    </div>
                    <div className="divider my-1.5" />
                    <Link
                      href="/dashboard"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-brand-200 transition hover:bg-white/[0.06]"
                    >
                      <LayoutDashboard size={15} />
                      My customer dashboard
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

        <nav className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto pb-3 lg:hidden" aria-label="Admin mobile">
          {LINKS.map((link) => {
            const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "inline-flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-[12.5px] font-semibold transition",
                  active
                    ? "border-amber-400/40 bg-amber-400/[0.14] text-amber-100"
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

export default AdminNav;
