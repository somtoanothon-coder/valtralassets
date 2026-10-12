import "server-only";
import { WALLETS, type WalletOption } from "@/config/site";
import { ensureSchema, isDatabaseConfigured, query } from "./db";

export type ResolvedWallet = {
  id: string;
  asset: string;
  network: string;
  address: string;
  note: string;
  color: string;
  image?: string;
  overridden: boolean;
};

/**
 * Settlement wallets as customers should see them: deploy-time defaults from
 * the configuration file, with any address the owner has saved in the admin
 * dashboard taking precedence.
 */
export async function getWallets(): Promise<ResolvedWallet[]> {
  const base: ResolvedWallet[] = WALLETS.map((w: WalletOption) => ({
    id: w.id,
    asset: w.asset,
    network: w.network,
    address: w.address,
    note: w.note,
    color: w.color,
    image: w.image,
    overridden: false,
  }));

  if (!isDatabaseConfigured()) return base;

  try {
    await ensureSchema();
    const rows = await query<{ key: string; value: string }>(
      `SELECT key, value FROM settings WHERE key LIKE 'wallet.%'`,
    );
    const overrides = new Map(rows.map((r) => [r.key.replace("wallet.", ""), r.value]));
    return base.map((w) => {
      const value = overrides.get(w.id);
      return value ? { ...w, address: value, overridden: true } : w;
    });
  } catch {
    return base;
  }
}
