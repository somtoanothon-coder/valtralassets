import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getWallets } from "@/lib/wallets";
import { isDatabaseConfigured } from "@/lib/db";
import { WalletSettings } from "@/components/admin/WalletSettings";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminDatabaseNotice } from "@/components/admin/AdminDatabaseNotice";
import { LayoutDashboard, Wallet } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Wallet addresses",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const admin = await requireAdmin();
  if (!admin) return null;

  const wallets = await getWallets();
  const configured = isDatabaseConfigured();

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Operations console"
        title="Settlement wallet addresses"
        description="These are the addresses customers copy on the deposit page. Any address you change here overrides the deploy-time default immediately — clearing a field restores the default."
        actions={
          <>
            <Link href="/admin" className="btn-secondary px-5 py-3 text-[13.5px]">
              <LayoutDashboard size={16} />
              Overview
            </Link>
            <Link href="/admin/payments" className="btn-secondary px-5 py-3 text-[13.5px]">
              <Wallet size={16} />
              Payments
            </Link>
          </>
        }
      />

      {!configured && (
        <AdminDatabaseNotice context="address changes cannot be saved." />
      )}

      <WalletSettings initialWallets={wallets} />
    </div>
  );
}
