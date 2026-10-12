import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { SITE } from "@/config/site";
import { AdminNav } from "@/components/admin/AdminNav";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  // Non-admins are sent to their own dashboard rather than the login page so
  // the admin area never reveals its own existence to customers.
  if (!admin) redirect("/login");

  return (
    <div className="min-h-screen bg-ink-800">
      <AdminNav admin={admin} />
      <main className="container-x py-8 sm:py-10">{children}</main>
      <footer className="border-t border-white/[0.07] bg-ink-900/60">
        <div className="container-x flex flex-col items-center justify-between gap-3 py-6 sm:flex-row">
          <p className="text-[12px] text-brand-300/55">
            {SITE.name} operations console · © {new Date().getFullYear()}
          </p>
          <p className="text-[12px] text-brand-300/45">
            Signed in as <span className="font-semibold text-amber-300">{admin.email}</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
