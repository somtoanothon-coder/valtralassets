import { NextResponse } from "next/server";
import { ensureSchema, isDatabaseConfigured, query, queryOne, writeAudit } from "@/lib/db";
import { getCurrentUser, generateReference } from "@/lib/auth";
import { fieldErrors, paymentSchema } from "@/lib/validate";
import { WALLETS, CONTACT, SITE } from "@/config/site";
import { getPlan } from "@/lib/plans";
import { getNft } from "@/lib/nft";
import { sendMail, adminPaymentEmail, userPaymentEmail, mailerConfigured } from "@/lib/mail";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });

  try {
    await ensureSchema();
    const rows = await query(
      `SELECT id, type, direction, amount, currency, method, network, provider_ref,
              status, reference, plan_id, item_slug, note, admin_note, created_at, reviewed_at
       FROM transactions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 60`,
      [user.id],
    );
    return NextResponse.json({ ok: true, transactions: rows });
  } catch (error) {
    console.error("[payments:list]", error);
    return NextResponse.json({ ok: false, error: "Could not load your payments." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Please sign in to submit a payment." }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "Payments are temporarily unavailable." }, { status: 503 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  const parsed = paymentSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Please correct the highlighted fields.", fields: fieldErrors(parsed.error) },
      { status: 422 },
    );
  }

  const data = parsed.data;
  const wallet = WALLETS.find((w) => w.id === data.walletId);
  if (!wallet) {
    return NextResponse.json(
      { ok: false, error: "Choose a valid settlement wallet.", fields: { walletId: "Unknown wallet" } },
      { status: 422 },
    );
  }

  const plan = data.purpose === "investment" ? getPlan(data.planId) : undefined;
  const nft = data.purpose === "nft" ? getNft(data.itemSlug) : undefined;

  if (data.purpose === "investment") {
    if (!plan) {
      return NextResponse.json(
        { ok: false, error: "Select the investment plan you are funding.", fields: { planId: "Choose a plan" } },
        { status: 422 },
      );
    }
    if (data.amount < plan.minInvest) {
      return NextResponse.json(
        {
          ok: false,
          error: `The ${plan.name} minimum is $${plan.minInvest.toFixed(2)}.`,
          fields: { amount: `Minimum investment is $${plan.minInvest.toFixed(2)}` },
        },
        { status: 422 },
      );
    }
    if (data.amount > plan.maxInvest) {
      return NextResponse.json(
        {
          ok: false,
          error: `The ${plan.name} maximum is $${plan.maxInvest.toFixed(2)}.`,
          fields: { amount: `Maximum investment is $${plan.maxInvest.toFixed(2)}` },
        },
        { status: 422 },
      );
    }
  }

  if (data.purpose === "nft") {
    if (!nft) {
      return NextResponse.json(
        { ok: false, error: "That collectible could not be found.", fields: { itemSlug: "Unknown item" } },
        { status: 422 },
      );
    }
    if (Math.abs(data.amount - nft.priceUsd) > 0.01) {
      return NextResponse.json(
        {
          ok: false,
          error: `${nft.name} is priced at $${nft.priceUsd.toFixed(2)}.`,
          fields: { amount: `Amount must be $${nft.priceUsd.toFixed(2)}` },
        },
        { status: 422 },
      );
    }
  }

  const purposeLabel =
    data.purpose === "investment"
      ? `Investment — ${plan!.name}`
      : data.purpose === "nft"
        ? `NFT purchase — ${nft!.name}`
        : "Wallet deposit";

  try {
    await ensureSchema();

    if (data.purpose === "nft") {
      const owned = await queryOne<{ id: string }>(
        `SELECT id FROM nft_holdings WHERE user_id = $1 AND slug = $2 AND status <> 'rejected' LIMIT 1`,
        [user.id, nft!.slug],
      );
      if (owned) {
        return NextResponse.json(
          { ok: false, error: `You already have a pending or completed order for ${nft!.name}.` },
          { status: 409 },
        );
      }
    }

    const reference = generateReference(data.purpose === "nft" ? "NFT" : "TXN");

    const tx = await queryOne<{ id: string; reference: string }>(
      `INSERT INTO transactions
         (user_id, type, direction, amount, currency, method, network, wallet_id,
          wallet_address, provider_ref, status, reference, plan_id, item_slug, note)
       VALUES ($1,$2,'credit',$3,'USD',$4,$5,$6,$7,$8,'pending',$9,$10,$11,$12)
       RETURNING id, reference`,
      [
        user.id,
        data.purpose,
        data.amount,
        `${wallet.asset} · ${wallet.network}`,
        wallet.network,
        wallet.id,
        wallet.address,
        data.providerRef,
        reference,
        plan?.id ?? null,
        nft?.slug ?? null,
        data.note || null,
      ],
    );

    if (!tx) throw new Error("Insert returned no row");

    if (data.purpose === "nft") {
      await query(
        `INSERT INTO nft_holdings (user_id, slug, name, price_usd, price_eth, status)
         VALUES ($1,$2,$3,$4,$5,'pending')
         ON CONFLICT (user_id, slug) DO UPDATE SET status = 'pending', created_at = now()`,
        [user.id, nft!.slug, nft!.name, nft!.priceUsd, nft!.priceEth],
      );
    }

    await writeAudit(user.id, "payment.submitted", "transaction", tx.id, {
      amount: data.amount,
      purpose: data.purpose,
      reference,
    });

    if (mailerConfigured()) {
      const adminNotice = adminPaymentEmail({
        reference,
        userName: user.fullName,
        userEmail: user.email,
        accountId: user.accountId,
        amount: data.amount,
        purpose: purposeLabel,
        method: `${wallet.asset} (${wallet.network})`,
        network: wallet.network,
        walletAddress: wallet.address,
        providerRef: data.providerRef,
        note: data.note || null,
        createdAt: new Date().toLocaleString("en-GB", { timeZone: "UTC", hour12: false }) + " UTC",
      });
      void sendMail({ to: CONTACT.adminEmail, ...adminNotice, replyTo: user.email });

      const receipt = userPaymentEmail({
        fullName: user.fullName,
        reference,
        amount: data.amount,
        purpose: purposeLabel,
        status: "received",
      });
      void sendMail({ to: user.email, ...receipt });
    }

    return NextResponse.json({
      ok: true,
      reference,
      message:
        "Payment submitted. Our team will verify the transfer on-chain and credit your account — usually within 30 minutes.",
    });
  } catch (error) {
    console.error("[payments:create]", error);
    return NextResponse.json(
      {
        ok: false,
        error: `We could not record your payment. Please email ${CONTACT.supportEmail} with your reference and we will sort it out.`,
      },
      { status: 500 },
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: { Allow: "GET, POST", "X-Service": SITE.domain },
  });
}
