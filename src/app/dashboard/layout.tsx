import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SITE } from "@/config/site";
import { DashboardNav } from "@/components/dashboard/DashboardNav";

export const metadata: Metadata = {
  title: "Dashboard",
  description: `Your ${SITE.name} portfolio, wallet and investments.`,
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-ink-800">
      <DashboardNav user={user} />
      <main className="container-x py-8 sm:py-10">{children}</main>
      <footer className="border-t border-white/[0.07] bg-ink-900/60">
        <div className="container-x flex flex-col items-center justify-between gap-3 py-6 sm:flex-row">
          <p className="text-[12px] text-brand-300/55">
            © {new Date().getFullYear()} {SITE.name}. All rights reserved.
          </p>
          <p className="text-[12px] text-brand-300/45">
            Account ID <span className="numeric font-semibold text-brand-300/70">{user.accountId}</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
