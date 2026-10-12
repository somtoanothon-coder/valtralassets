import { NextResponse } from "next/server";
import {
  ensureSchema,
  isDatabaseConfigured,
  query,
  queryOne,
  writeAudit,
  type TransactionRow,
  type UserRow,
} from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { getPlan } from "@/lib/plans";
import { userPaymentEmail, sendMail, mailerConfigured } from "@/lib/mail";

export const dynamic = "force-dynamic";

type Body = {
  userId?: string;
  amount?: number | string;
  direction?: "credit" | "debit";
  note?: string;
  transactionId?: string;
  planId?: string;
  createInvestment?: boolean;
};

/**
 * Admin: approve a payment or adjust a customer's wallet balance.
 *
 * This is the operation the owner performs after confirming a crypto transfer.
 * It is idempotent against an already-reviewed transaction and records an
 * audit entry for every balance movement.
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

  const userId = String(body.userId || "").trim();
  const amount = Number(body.amount);
  const direction = body.direction === "debit" ? "debit" : "credit";
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 400) : "";
  const transactionId = typeof body.transactionId === "string" ? body.transactionId.trim() : "";
  const planId = typeof body.planId === "string" ? body.planId.trim() : "";
  const createInvestment = Boolean(body.createInvestment);

  if (!userId) {
    return NextResponse.json({ ok: false, error: "Select a customer first." }, { status: 422 });
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ ok: false, error: "Enter an amount greater than zero." }, { status: 422 });
  }
  if (amount > 50_000_000) {
    return NextResponse.json({ ok: false, error: "That amount is too large." }, { status: 422 });
  }
  if (direction === "debit" && (transactionId || createInvestment || planId)) {
    return NextResponse.json(
      { ok: false, error: "Payment approvals and investments can only credit an account." },
      { status: 422 },
    );
  }

  try {
    await ensureSchema();

    const target = await queryOne<UserRow>(`SELECT * FROM users WHERE id = $1 LIMIT 1`, [userId]);
    if (!target) {
      return NextResponse.json({ ok: false, error: "That customer no longer exists." }, { status: 404 });
    }

    let linkedTx: TransactionRow | null = null;
    if (transactionId) {
      linkedTx = await queryOne<TransactionRow>(
        `SELECT * FROM transactions WHERE id = $1 AND user_id = $2 LIMIT 1`,
        [transactionId, userId],
      );
      if (linkedTx?.status === "approved") {
        return NextResponse.json(
          { ok: false, error: "That payment has already been approved and credited." },
          { status: 409 },
        );
      }
    }

    // 1. Move the money. A debit is conditional so concurrent adjustments
    // cannot take an account below zero.
    const updated =
      direction === "debit"
        ? await queryOne<UserRow>(
            `UPDATE users
             SET balance = balance - $2, updated_at = now()
             WHERE id = $1 AND balance >= $2
             RETURNING *`,
            [userId, amount],
          )
        : await queryOne<UserRow>(
            `UPDATE users
             SET balance = balance + $2,
                 total_deposited = total_deposited + $2,
                 updated_at = now()
             WHERE id = $1
             RETURNING *`,
            [userId, amount],
          );
    if (!updated && direction === "debit") {
      return NextResponse.json(
        { ok: false, error: "The account balance is lower than the amount to deduct." },
        { status: 422 },
      );
    }
    if (!updated) throw new Error("Balance update returned no row");

    // 2. Record the ledger entry.
    const reference = linkedTx?.reference ?? `ADM-${Date.now().toString(36).toUpperCase()}`;
    const type =
      createInvestment && planId
        ? "investment"
        : linkedTx?.type || (direction === "debit" ? "adjustment" : "deposit");

    const tx = linkedTx
      ? await queryOne<TransactionRow>(
          `UPDATE transactions
           SET status = 'approved',
               admin_note = $2,
               reviewed_by = $3,
               reviewed_at = now(),
               amount = $4,
               type = $5,
               plan_id = coalesce($6, plan_id)
           WHERE id = $1
           RETURNING *`,
          [linkedTx.id, note || null, admin.id, amount, type, planId || null],
        )
      : await queryOne<TransactionRow>(
          `INSERT INTO transactions
             (user_id, type, direction, amount, currency, method, status, reference,
              plan_id, note, admin_note, reviewed_by, reviewed_at)
           VALUES ($1,$2,$3,$4,'USD',$5,'approved',$6,$7,$8,$9,$10, now())
           RETURNING *`,
          [
            userId,
            type,
            direction,
            amount,
            direction === "debit" ? "Manual debit" : "Manual credit",
            reference,
            planId || null,
            "Balance adjusted from the admin dashboard",
            note || null,
            admin.id,
          ],
        );

    // 3. Optionally open the investment the customer was paying for.
    let investment: { id: string; planName: string } | null = null;
    if (createInvestment && planId) {
      const plan = getPlan(planId);
      if (plan) {
        const row = await queryOne<{ id: string }>(
          `INSERT INTO investments
             (user_id, transaction_id, plan_id, plan_name, amount, roi_percent, duration_days, status, matures_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,'active', now() + ($7 || ' days')::interval)
           RETURNING id`,
          [userId, tx?.id ?? null, plan.id, plan.name, amount, plan.roiPercent, plan.durationDays],
        );
        investment = row ? { id: row.id, planName: plan.name } : null;
      }
    }

    // 4. If the credit settles an NFT order, mark the collectible as owned.
    if (linkedTx?.item_slug) {
      await query(
        `UPDATE nft_holdings SET status = 'approved' WHERE user_id = $1 AND slug = $2`,
        [userId, linkedTx.item_slug],
      );
    }

    await writeAudit(admin.id, direction === "debit" ? "admin.debit" : "admin.credit", "user", userId, {
      direction,
      amount,
      transactionId: linkedTx?.id ?? tx?.id ?? null,
      note,
      reference,
      createInvestment,
      planId: planId || null,
    });

    if (mailerConfigured() && direction === "credit") {
      const receipt = userPaymentEmail({
        fullName: target.full_name,
        reference,
        amount,
        purpose: investment
          ? `Investment — ${investment.planName}`
          : linkedTx?.item_slug
            ? "NFT purchase"
            : "Wallet deposit",
        status: "approved",
        adminNote: note || null,
        newBalance: Number(updated.balance),
      });
      const { CONTACT } = await import("@/config/site");
      void sendMail({ to: target.email, ...receipt, replyTo: CONTACT.supportEmail });
    }

    return NextResponse.json({
      ok: true,
      message: `${target.full_name} ${direction === "debit" ? "debited" : "credited"} $${amount.toFixed(2)}. New balance: $${Number(updated.balance).toFixed(2)}.`,
      balance: Number(updated.balance),
      totalDeposited: Number(updated.total_deposited),
      reference,
      investment,
    });
  } catch (error) {
    console.error("[admin:credit]", error);
    return NextResponse.json({ ok: false, error: "The credit could not be applied." }, { status: 500 });
  }
}
