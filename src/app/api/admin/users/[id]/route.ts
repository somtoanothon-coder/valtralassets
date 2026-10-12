import { NextResponse } from "next/server";
import {
  ensureSchema,
  isDatabaseConfigured,
  query,
  queryOne,
  writeAudit,
  type InvestmentRow,
  type NftHoldingRow,
  type TransactionRow,
  type UserRow,
} from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Admin: full customer profile with ledger, investments and collectibles. */
export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: "Not authorised." }, { status: 403 });
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "Database not connected." }, { status: 503 });
  }

  const { id } = await ctx.params;

  try {
    await ensureSchema();

    const user = await queryOne<UserRow>(`SELECT * FROM users WHERE id = $1 LIMIT 1`, [id]);
    if (!user) {
      return NextResponse.json({ ok: false, error: "Customer not found." }, { status: 404 });
    }

    const [transactions, investments, holdings] = await Promise.all([
      query<TransactionRow>(
        `SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100`,
        [id],
      ),
      query<InvestmentRow>(
        `SELECT * FROM investments WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
        [id],
      ),
      query<NftHoldingRow>(
        `SELECT * FROM nft_holdings WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
        [id],
      ),
    ]);

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        accountId: user.account_id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        dateOfBirth: user.date_of_birth,
        address: user.address,
        country: user.country,
        occupation: user.occupation,
        accountType: user.account_type,
        secondFullName: user.second_full_name,
        secondEmail: user.second_email,
        secondPhone: user.second_phone,
        secondCountry: user.second_country,
        secondOccupation: user.second_occupation,
        referralCode: user.referral_code,
        referredBy: user.referred_by,
        role: user.role,
        status: user.status,
        balance: Number(user.balance),
        totalDeposited: Number(user.total_deposited),
        totalWithdrawn: Number(user.total_withdrawn),
        createdAt: user.created_at,
        lastLoginAt: user.last_login_at,
      },
      transactions: transactions.map((t) => ({
        id: t.id,
        reference: t.reference,
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
        reviewedAt: t.reviewed_at,
      })),
      investments: investments.map((i) => ({
        id: i.id,
        planId: i.plan_id,
        planName: i.plan_name,
        amount: Number(i.amount),
        roiPercent: Number(i.roi_percent),
        durationDays: i.duration_days,
        status: i.status,
        startedAt: i.started_at,
        maturesAt: i.matures_at,
      })),
      holdings: holdings.map((h) => ({
        id: h.id,
        slug: h.slug,
        name: h.name,
        priceUsd: Number(h.price_usd),
        priceEth: Number(h.price_eth),
        status: h.status,
        createdAt: h.created_at,
      })),
    });
  } catch (error) {
    console.error("[admin:user:detail]", error);
    return NextResponse.json({ ok: false, error: "Could not load that customer." }, { status: 500 });
  }
}

type PatchBody = { status?: "active" | "suspended"; role?: "user" | "admin" };

/** Admin: suspend / reactivate a customer, or toggle admin rights. */
export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: "Not authorised." }, { status: 403 });
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "Database not connected." }, { status: 503 });
  }

  const { id } = await ctx.params;

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  if (id === admin.id && body.status === "suspended") {
    return NextResponse.json({ ok: false, error: "You cannot suspend your own account." }, { status: 422 });
  }
  if (id === admin.id && body.role === "user") {
    return NextResponse.json({ ok: false, error: "You cannot remove your own admin rights." }, { status: 422 });
  }

  try {
    await ensureSchema();

    const user = await queryOne<UserRow>(
      `UPDATE users
       SET status = coalesce($2, status),
           role = coalesce($3, role),
           updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [id, body.status ?? null, body.role ?? null],
    );

    if (!user) {
      return NextResponse.json({ ok: false, error: "Customer not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, status: user.status, role: user.role });
  } catch (error) {
    console.error("[admin:user:patch]", error);
    return NextResponse.json({ ok: false, error: "Could not update that customer." }, { status: 500 });
  }
}

/**
 * Admin: permanently remove a customer and everything that belongs to them.
 * Sessions, transactions, investments, holdings and rate-limit rows are
 * removed by the table-level cascade; audit entries are retained with the
 * actor cleared so the platform keeps a record of the action.
 */
export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: "Not authorised." }, { status: 403 });
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "Database not connected." }, { status: 503 });
  }

  const { id } = await ctx.params;

  if (id === admin.id) {
    return NextResponse.json(
      { ok: false, error: "You cannot delete your own account." },
      { status: 422 },
    );
  }

  try {
    await ensureSchema();

    const existing = await queryOne<UserRow>(`SELECT * FROM users WHERE id = $1 LIMIT 1`, [id]);
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Customer not found." }, { status: 404 });
    }
    if (existing.role === "admin") {
      return NextResponse.json(
        { ok: false, error: "Remove administrator rights before deleting this account." },
        { status: 422 },
      );
    }

    await query(`DELETE FROM users WHERE id = $1`, [id]);
    await writeAudit(admin.id, "admin.user.delete", "user", id, {
      accountId: existing.account_id,
      email: existing.email,
    });

    return NextResponse.json({ ok: true, accountId: existing.account_id });
  } catch (error) {
    console.error("[admin:user:delete]", error);
    return NextResponse.json({ ok: false, error: "Could not delete that customer." }, { status: 500 });
  }
}
