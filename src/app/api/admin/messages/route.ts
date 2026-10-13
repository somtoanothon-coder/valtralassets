import { NextResponse } from "next/server";
import { ensureSchema, isDatabaseConfigured, query, queryOne, writeAudit, type UserRow } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { adminMessageEmail, mailerConfigured, sendMail } from "@/lib/mail";
import { adminMessageSchema, fieldErrors } from "@/lib/validate";

export const dynamic = "force-dynamic";

export type AdminMessageRow = {
  id: string;
  recipient_email: string;
  recipient_user_id: string | null;
  subject: string;
  body: string;
  status: string;
  error: string | null;
  created_at: string;
};

/** Admin: the most recent messages sent from the console. */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: "Not authorised." }, { status: 403 });
  if (!isDatabaseConfigured()) {
    return NextResponse.json({
      ok: true,
      messages: [],
      mailer: mailerConfigured() ? "configured" : "missing",
    });
  }

  try {
    await ensureSchema();
    const rows = await query<AdminMessageRow>(
      `SELECT id, recipient_email, recipient_user_id, subject, body, status, error, created_at
       FROM admin_messages ORDER BY created_at DESC LIMIT 50`,
    );
    return NextResponse.json({
      ok: true,
      messages: rows,
      mailer: mailerConfigured() ? "configured" : "missing",
    });
  } catch (error) {
    console.error("[admin:messages:get]", error);
    return NextResponse.json({ ok: false, error: "Could not load sent messages." }, { status: 500 });
  }
}

/**
 * Admin: send a message to a registered customer or any email address.
 * Every attempt is recorded, including failures, so the console can show what
 * was actually delivered.
 */
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: "Not authorised." }, { status: 403 });
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "Database not connected." }, { status: 503 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  const parsed = adminMessageSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Please check the highlighted fields.", fields: fieldErrors(parsed.error) },
      { status: 422 },
    );
  }

  const { recipientEmail, subject, body } = parsed.data;
  const recipientUserId = parsed.data.recipientUserId || null;

  if (!mailerConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Email sending is not configured. Add RESEND_API_KEY (or SMTP_HOST / SMTP_USER / SMTP_PASS) in Netlify, then redeploy.",
      },
      { status: 503 },
    );
  }

  try {
    await ensureSchema();

    // Link the message to the customer when the address belongs to one.
    const recipient = await queryOne<UserRow>(
      `SELECT * FROM users WHERE lower(email) = $1 LIMIT 1`,
      [recipientEmail],
    );

    const composed = adminMessageEmail({
      subject,
      body,
      recipientName: recipient?.full_name ?? null,
      accountId: recipient?.account_id ?? null,
    });

    const result = await sendMail({
      to: recipientEmail,
      subject: composed.subject,
      html: composed.html,
      text: composed.text,
    });

    const status = result.ok ? "sent" : result.skipped ? "skipped" : "failed";
    const error = result.ok ? null : result.error || "Email sending is not configured.";

    const saved = await queryOne<AdminMessageRow>(
      `INSERT INTO admin_messages
         (sender_id, recipient_user_id, recipient_email, subject, body, status, error, provider_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id, recipient_email, recipient_user_id, subject, body, status, error, created_at`,
      [
        admin.id,
        recipientUserId || recipient?.id || null,
        recipientEmail,
        subject,
        body,
        status,
        error,
        result.id ?? null,
      ],
    );

    await writeAudit(admin.id, "admin.message.send", "user", recipient?.id ?? recipientEmail, {
      recipientEmail,
      subject,
      status,
    });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: error || "That message could not be sent.", record: saved },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      record: saved,
      deliveredTo: recipientEmail,
      note: recipient
        ? `Delivered to ${recipient.full_name} (${recipient.account_id}).`
        : `Delivered to ${recipientEmail}. This address is not a registered customer.`,
    });
  } catch (error) {
    console.error("[admin:messages:post]", error);
    return NextResponse.json({ ok: false, error: "Could not send that message." }, { status: 500 });
  }
}
