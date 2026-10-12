import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { ensureSchema, isDatabaseConfigured, query, queryOne, type UserRow } from "@/lib/db";
import { createSession, ensureAdminAccount, touchLastLogin } from "@/lib/auth";
import { fieldErrors, loginSchema } from "@/lib/validate";

export const dynamic = "force-dynamic";

const MAX_IP_ATTEMPTS = 60;
const MAX_IDENTIFIER_ATTEMPTS = 12;

function clientIp(request: Request): string | null {
  const netlifyIp = request.headers.get("x-nf-client-connection-ip");
  if (netlifyIp) return netlifyIp.trim();
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  const realIp = request.headers.get("x-real-ip");
  return realIp?.trim() || null;
}

async function incrementRateLimit(key: string): Promise<number> {
  const keyHash = createHash("sha256").update(key).digest("hex");
  const rows = await query<{ attempts: number }>(
    `INSERT INTO login_rate_limits (key_hash, attempts, window_started_at, updated_at)
     VALUES ($1, 1, now(), now())
     ON CONFLICT (key_hash) DO UPDATE SET
       attempts = CASE
         WHEN login_rate_limits.window_started_at < now() - interval '10 minutes'
           THEN 1
         ELSE login_rate_limits.attempts + 1
       END,
       window_started_at = CASE
         WHEN login_rate_limits.window_started_at < now() - interval '10 minutes'
           THEN now()
         ELSE login_rate_limits.window_started_at
       END,
       updated_at = now()
     RETURNING attempts`,
    [keyHash],
  );
  return Number(rows[0]?.attempts ?? 0);
}

async function clearIdentifierRateLimit(identifier: string): Promise<void> {
  const keyHash = createHash("sha256")
    .update(`identifier:${identifier.toLowerCase()}`)
    .digest("hex");
  await query(`DELETE FROM login_rate_limits WHERE key_hash = $1`, [keyHash]);
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Sign-in is temporarily unavailable because the platform database is not connected.",
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

  const parsed = loginSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Please check your details.", fields: fieldErrors(parsed.error) },
      { status: 422 },
    );
  }

  const { identifier, password, remember } = parsed.data;
  const ip = clientIp(request);

  try {
    await ensureSchema();
    const [ipAttempts, identifierAttempts] = await Promise.all([
      ip ? incrementRateLimit(`ip:${ip}`) : Promise.resolve(0),
      incrementRateLimit(`identifier:${identifier.toLowerCase()}`),
    ]);
    await query(`DELETE FROM login_rate_limits WHERE updated_at < now() - interval '1 day'`);

    if (ipAttempts > MAX_IP_ATTEMPTS || identifierAttempts > MAX_IDENTIFIER_ATTEMPTS) {
      return NextResponse.json(
        {
          ok: false,
          error: "Too many sign-in attempts. Please wait a few minutes and try again.",
        },
        { status: 429, headers: { "Retry-After": "600" } },
      );
    }

    // Promote / create the administrator account on login attempts so the
    // owner can always get into the dashboard on a fresh deployment.
    await ensureAdminAccount().catch(() => undefined);

    // Accept either the Account ID or the email address — users forget which
    // one they registered with.
    const user = await queryOne<UserRow & { password_hash: string }>(
      `SELECT * FROM users
       WHERE upper(account_id) = $1 OR lower(email) = $2
       LIMIT 1`,
      [identifier.trim().toUpperCase(), identifier.trim().toLowerCase()],
    );

    // Constant-ish response shape to avoid account enumeration.
    const genericError = {
      ok: false,
      error: "User not found or wrong ID. Check your Account ID and password, or contact support.",
    };

    if (!user) {
      // Still burn a hash comparison so timing does not leak account existence.
      await bcrypt.compare(password, "$2a$11$0000000000000000000000000000000000000000000000000000");
      return NextResponse.json(genericError, { status: 401 });
    }

    if (user.status === "suspended") {
      return NextResponse.json(
        {
          ok: false,
          error:
            "This account is currently suspended. Please contact support to restore access.",
        },
        { status: 403 },
      );
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json(genericError, { status: 401 });
    }

    await createSession(user.id, Boolean(remember), {
      userAgent: request.headers.get("user-agent"),
      ip,
    });
    await clearIdentifierRateLimit(identifier);
    await touchLastLogin(user.id);

    return NextResponse.json({
      ok: true,
      role: user.role,
      accountId: user.account_id,
      redirectTo: user.role === "admin" ? "/admin" : "/dashboard",
    });
  } catch (error) {
    console.error("[login] failed:", error);
    return NextResponse.json(
      { ok: false, error: "Sign-in failed due to a server error. Please try again." },
      { status: 500 },
    );
  }
}
