import type { UserRow } from "./db";
import type { AdminUser } from "@/components/admin/AdminClient";

export type UserWithCounts = UserRow & { pending_count?: string; tx_count?: string };

/** Maps a database user row onto the shape the admin UI consumes. */
export function mapAdminUser(u: UserWithCounts): AdminUser {
  return {
    id: u.id,
    accountId: u.account_id,
    fullName: u.full_name,
    email: u.email,
    phone: u.phone,
    country: u.country,
    occupation: u.occupation,
    accountType: u.account_type,
    role: u.role,
    status: u.status,
    balance: Number(u.balance),
    totalDeposited: Number(u.total_deposited),
    pendingCount: Number(u.pending_count ?? 0),
    transactionCount: Number(u.tx_count ?? 0),
    createdAt: u.created_at,
    lastLoginAt: u.last_login_at,
  };
}

export type RawAdminTransaction = {
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
};

export function mapAdminTransaction(t: RawAdminTransaction) {
  return {
    id: t.id,
    reference: t.reference,
    userId: t.user_id,
    userName: t.full_name,
    accountId: t.account_id,
    userEmail: t.email,
    type: t.type,
    amount: Number(t.amount),
    method: t.method,
    network: t.network,
    walletAddress: t.wallet_address,
    providerRef: t.provider_ref,
    status: t.status,
    planId: t.plan_id,
    itemSlug: t.item_slug,
    note: t.note,
    adminNote: t.admin_note,
    createdAt: t.created_at,
  };
}
