import { NextResponse } from "next/server";
import { ensureSchema, isDatabaseConfigured, query, writeAudit, type TransactionRow } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { userPaymentEmail, sendMail, mailerConfigured } from "@/lib/mail";

export const dynamic = "force-dynamic";

/** Admin: list payment submissions, optionally filtered by status. */
export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: "Not authorised." }, { status: 403 });
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "Database not connected." }, { status: 503 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status") || "";
  const allowed = new Set(["pending", "approved", "rejected"]);
  const filter = allowed.has(status) ? status : null;

  try {
    await ensureSchema();
    const rows = await query<TransactionRow & { full_name: string; account_id: string; email: string }>(
      `SELECT t.*, u.full_name, u.account_id, u.email
       FROM transactions t
       JOIN users u ON u.id = t.user_id
       ${filter ? "WHERE t.status = $1" : ""}
       ORDER BY (t.status = 'pending') DESC, t.created_at DESC
       LIMIT 200`,
      filter ? [filter] : [],
    );

    return NextResponse.json({
      ok: true,
      transactions: rows.map((t) => ({
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
        walletId: t.wallet_id,
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
    });
  } catch (error) {
    console.error("[admin:transactions:list]", error);
    return NextResponse.json({ ok: false, error: "Could not load payments." }, { status: 500 });
  }
}

type Body = {
  transactionId?: string;
  decision?: "approve" | "reject";
  adminNote?: string;
  credit?: boolean;
};

/**
 * Admin: approve or reject a submitted payment.
 * Approving credits the customer's wallet in the same request.
 */
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: "Not authorised." }, { status: 403 });
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "Database not connected." }, { status: 503 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  const transactionId = String(body.transactionId || "").trim();
  const decision = body.decision;
  const adminNote = typeof body.adminNote === "string" ? body.adminNote.trim().slice(0, 400) : "";
  const shouldCredit = body.credit !== false;

  if (!transactionId || (decision !== "approve" && decision !== "reject")) {
    return NextResponse.json({ ok: false, error: "Invalid review request." }, { status: 422 });
  }

  try {
    await ensureSchema();

    const tx = await query<TransactionRow & { full_name: string; email: string }>(
      `SELECT t.*, u.full_name, u.email
       FROM transactions t JOIN users u ON u.id = t.user_id
       WHERE t.id = $1 LIMIT 1`,
      [transactionId],
    );
    const row = tx[0];
    if (!row) {
      return NextResponse.json({ ok: false, error: "That payment no longer exists." }, { status: 404 });
    }
    if (row.status !== "pending") {
      return NextResponse.json(
        { ok: false, error: `That payment was already ${row.status}.` },
        { status: 409 },
      );
    }

    const status = decision === "approve" ? "approved" : "rejected";
    const amount = Number(row.amount);

    await query(
      `UPDATE transactions
       SET status = $2, admin_note = $3, reviewed_by = $4, reviewed_at = now()
       WHERE id = $1`,
      [transactionId, status, adminNote || null, admin.id],
    );

    let newBalance: number | null = null;

    if (decision === "approve" && shouldCredit && amount > 0) {
      const updated = await query<{ balance: string }>(
        `UPDATE users
         SET balance = balance + $2,
             total_deposited = total_deposited + $2,
             updated_at = now()
         WHERE id = $1
         RETURNING balance`,
        [row.user_id, amount],
      );
      newBalance = updated[0] ? Number(updated[0].balance) : null;

      if (row.item_slug) {
        await query(`UPDATE nft_holdings SET status = 'approved' WHERE user_id = $1 AND slug = $2`, [
          row.user_id,
          row.item_slug,
        ]);
      }

      if (row.plan_id) {
        const { getPlan } = await import("@/lib/plans");
        const plan = getPlan(row.plan_id);
        const existing = await query<{ id: string }>(
          `SELECT id FROM investments WHERE transaction_id = $1 LIMIT 1`,
          [transactionId],
        );
        if (plan && !existing.length) {
          await query(
            `INSERT INTO investments
               (user_id, transaction_id, plan_id, plan_name, amount, roi_percent, duration_days, status, matures_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,'active', now() + ($7 || ' days')::interval)`,
            [row.user_id, transactionId, plan.id, plan.name, amount, plan.roiPercent, plan.durationDays],
          );
        }
      }
    }

    if (decision === "reject" && row.item_slug) {
      await query(`UPDATE nft_holdings SET status = 'rejected' WHERE user_id = $1 AND slug = $2`, [
        row.user_id,
        row.item_slug,
      ]);
    }

    await writeAudit(admin.id, `admin.payment.${decision}`, "transaction", transactionId, {
      amount,
      adminNote,
    });

    if (mailerConfigured()) {
      const notice = userPaymentEmail({
        fullName: row.full_name,
        reference: row.reference,
        amount,
        purpose:
          row.type === "investment"
            ? "Investment plan"
            : row.type === "nft"
              ? "NFT purchase"
              : "Wallet deposit",
        status: decision === "approve" ? "approved" : "rejected",
        adminNote: adminNote || null,
        newBalance,
      });
      void sendMail({ to: row.email, ...notice });
    }

    return NextResponse.json({
      ok: true,
      status,
      newBalance,
      message:
        decision === "approve"
          ? `Payment approved${newBalance !== null ? ` — new balance $${newBalance.toFixed(2)}` : ""}.`
          : "Payment rejected and the customer has been notified.",
    });
  } catch (error) {
    console.error("[admin:transactions:review]", error);
    return NextResponse.json({ ok: false, error: "The review could not be saved." }, { status: 500 });
  }
}
