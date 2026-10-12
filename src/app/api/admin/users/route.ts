import { NextResponse } from "next/server";
import { ensureSchema, isDatabaseConfigured, query, type UserRow } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

/**
 * Admin: search and list customers.
 * Matches on name, email, Account ID or phone. Parameterised throughout.
 */
export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: "Not authorised." }, { status: 403 });
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "Database not connected." }, { status: 503 });
  }

  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim();
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const offset = (page - 1) * PAGE_SIZE;

  try {
    await ensureSchema();

    const like = `%${q.replace(/[%_]/g, "")}%`;
    const filter = q
      ? `WHERE u.full_name ILIKE $1 OR u.email ILIKE $1 OR u.account_id ILIKE $1 OR coalesce(u.phone,'') ILIKE $1`
      : "";
    const params = q ? [like] : [];

    const users = await query<UserRow & { pending_count: string; tx_count: string }>(
      `SELECT u.*,
              (SELECT count(*) FROM transactions t WHERE t.user_id = u.id AND t.status = 'pending') AS pending_count,
              (SELECT count(*) FROM transactions t WHERE t.user_id = u.id) AS tx_count
       FROM users u
       ${filter}
       ORDER BY u.created_at DESC
       LIMIT ${PAGE_SIZE} OFFSET ${offset}`,
      params,
    );

    const totals = await query<{ total: string }>(
      `SELECT count(*)::text AS total FROM users u ${filter}`,
      params,
    );

    return NextResponse.json({
      ok: true,
      page,
      pageSize: PAGE_SIZE,
      total: Number(totals[0]?.total ?? 0),
      users: users.map((u) => ({
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
        pendingCount: Number(u.pending_count),
        transactionCount: Number(u.tx_count),
        createdAt: u.created_at,
        lastLoginAt: u.last_login_at,
      })),
    });
  } catch (error) {
    console.error("[admin:users]", error);
    return NextResponse.json({ ok: false, error: "Could not load customers." }, { status: 500 });
  }
}
