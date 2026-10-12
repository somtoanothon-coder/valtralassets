import { NextResponse } from "next/server";
import { ensureSchema, isDatabaseConfigured, queryOne, writeAudit, type UserRow } from "@/lib/db";
import {
  createSession,
  generateAccountId,
  generateReferralCode,
  hashPassword,
} from "@/lib/auth";
import { fieldErrors, signupSchema } from "@/lib/validate";
import { sendMail, welcomeEmail, adminNewUserEmail, mailerConfigured } from "@/lib/mail";

export const dynamic = "force-dynamic";

function clientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip");
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "The platform database is not connected yet. Please contact support so we can finish setting up your account.",
      },
      { status: 503 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  const parsed = signupSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Please correct the highlighted fields.", fields: fieldErrors(parsed.error) },
      { status: 422 },
    );
  }

  const data = parsed.data;
  const email = data.email.toLowerCase();
  const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  if (adminEmail && email === adminEmail) {
    return NextResponse.json(
      {
        ok: false,
        error: "This email address is reserved for the administrator. Please use another email.",
        fields: { email: "This email is reserved" },
      },
      { status: 409 },
    );
  }

  try {
    await ensureSchema();

    const clash = await queryOne<{ email: string }>(
      `SELECT email FROM users WHERE lower(email) = $1 LIMIT 1`,
      [email],
    );
    if (clash) {
      return NextResponse.json(
        {
          ok: false,
          error: "An account already exists with that email address. Try signing in instead.",
          fields: { email: "This email is already registered" },
        },
        { status: 409 },
      );
    }

    let referredBy: string | null = null;
    if (data.referralCode) {
      const referrer = await queryOne<{ referral_code: string }>(
        `SELECT referral_code FROM users WHERE upper(referral_code) = $1 LIMIT 1`,
        [data.referralCode.trim().toUpperCase()],
      );
      if (referrer) referredBy = referrer.referral_code;
    }

    const passwordHash = await hashPassword(data.password);

    // Retry once on the (vanishingly unlikely) account-ID collision.
    let created: UserRow | null = null;
    for (let attempt = 0; attempt < 3 && !created; attempt += 1) {
      try {
        created = await queryOne<UserRow>(
          `INSERT INTO users (
             account_id, full_name, email, phone, date_of_birth, address, country, occupation,
             account_type,
             second_full_name, second_email, second_phone, second_date_of_birth,
             second_address, second_country, second_occupation,
             password_hash, referral_code, referred_by
           ) VALUES (
             $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19
           )
           RETURNING *`,
          [
            generateAccountId(),
            data.fullName,
            email,
            data.phone,
            data.dateOfBirth,
            data.address,
            data.country,
            data.occupation,
            data.accountType,
            data.accountType === "joint" ? data.secondFullName || null : null,
            data.accountType === "joint" ? data.secondEmail || null : null,
            data.accountType === "joint" ? data.secondPhone || null : null,
            data.accountType === "joint" ? data.secondDateOfBirth || null : null,
            data.accountType === "joint" ? data.secondAddress || null : null,
            data.accountType === "joint" ? data.secondCountry || null : null,
            data.accountType === "joint" ? data.secondOccupation || null : null,
            passwordHash,
            generateReferralCode(),
            referredBy,
          ],
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        const isDuplicate = message.includes("duplicate key") || message.includes("unique");
        if (!isDuplicate) throw error;
        // Duplicate email means we lost a race — surface the friendly message.
        if (message.includes("email")) {
          return NextResponse.json(
            {
              ok: false,
              error: "An account already exists with that email address.",
              fields: { email: "This email is already registered" },
            },
            { status: 409 },
          );
        }
      }
    }

    if (!created) {
      return NextResponse.json(
        { ok: false, error: "We could not create your account. Please try again." },
        { status: 500 },
      );
    }

    await createSession(created.id, true, {
      userAgent: request.headers.get("user-agent"),
      ip: clientIp(request),
    });

    await writeAudit(created.id, "user.signup", "user", created.id, {
      email: created.email,
      accountType: created.account_type,
    });

    // Fire-and-forget notification mail so signup is never blocked by SMTP.
    if (mailerConfigured()) {
      const welcome = welcomeEmail({
        fullName: created.full_name,
        email: created.email,
        accountId: created.account_id,
        referralCode: created.referral_code,
        accountType: created.account_type,
        referredBy,
      });
      void sendMail({ to: created.email, ...welcome, replyTo: undefined });

      const adminNote = adminNewUserEmail({
        fullName: created.full_name,
        email: created.email,
        accountId: created.account_id,
        phone: created.phone,
        country: created.country,
        occupation: created.occupation,
        accountType: created.account_type === "joint" ? "Joint / Corporate" : "Individual",
        referralCode: created.referral_code,
      });
      const { CONTACT } = await import("@/config/site");
      void sendMail({ to: CONTACT.adminEmail, ...adminNote });
    }

    return NextResponse.json({
      ok: true,
      accountId: created.account_id,
      redirectTo: created.role === "admin" ? "/admin" : "/dashboard",
    });
  } catch (error) {
    console.error("[signup] failed:", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          "Something went wrong while creating your account. Please try again in a moment or contact support.",
      },
      { status: 500 },
    );
  }
}
