import "server-only";
import { cookies } from "next/headers";
import { randomBytes, createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { ensureSchema, query, queryOne, type UserRow } from "./db";

export const SESSION_COOKIE = "va_session";
const SESSION_DAYS = 7;
const SESSION_DAYS_REMEMBERED = 30;

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 11);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

/** Public-facing user object (never contains the password hash). */
export type SessionUser = {
  id: string;
  accountId: string;
  fullName: string;
  email: string;
  phone: string | null;
  country: string | null;
  occupation: string | null;
  accountType: string;
  role: "user" | "admin";
  status: string;
  balance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  referralCode: string;
  referredBy: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  secondFullName: string | null;
  secondEmail: string | null;
  secondPhone: string | null;
  secondCountry: string | null;
  secondOccupation: string | null;
  address: string | null;
  dateOfBirth: string | null;
};

export function toSessionUser(row: UserRow): SessionUser {
  return {
    id: row.id,
    accountId: row.account_id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    country: row.country,
    occupation: row.occupation,
    accountType: row.account_type,
    role: row.role === "admin" ? "admin" : "user",
    status: row.status,
    balance: Number(row.balance ?? 0),
    totalDeposited: Number(row.total_deposited ?? 0),
    totalWithdrawn: Number(row.total_withdrawn ?? 0),
    referralCode: row.referral_code,
    referredBy: row.referred_by,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at,
    secondFullName: row.second_full_name,
    secondEmail: row.second_email,
    secondPhone: row.second_phone,
    secondCountry: row.second_country,
    secondOccupation: row.second_occupation,
    address: row.address,
    dateOfBirth: row.date_of_birth,
  };
}

/**
 * Generates a human-readable Account ID in the documented `ACCXXXXXXXX`
 * format (no ambiguous characters such as O/0/I/1).
 */
export function generateAccountId(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(8);
  let out = "";
  for (let i = 0; i < 8; i += 1) out += alphabet[bytes[i] % alphabet.length];
  return `ACC${out}`;
}

export function generateReferralCode(): string {
  return `VLA${randomBytes(4).toString("hex").toUpperCase()}`;
}

export function generateReference(prefix = "TXN"): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = randomBytes(3).toString("hex").toUpperCase();
  return `${prefix}-${stamp}-${rand}`;
}

export async function createSession(
  userId: string,
  remember: boolean,
  meta: { userAgent?: string | null; ip?: string | null } = {},
): Promise<void> {
  await ensureSchema();
  const token = randomBytes(32).toString("hex");
  const days = remember ? SESSION_DAYS_REMEMBERED : SESSION_DAYS;
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  await query(
    `INSERT INTO sessions (user_id, token_hash, user_agent, ip, expires_at)
     VALUES ($1,$2,$3,$4,$5)`,
    [userId, hashToken(token), meta.userAgent ?? null, meta.ip ?? null, expiresAt],
  );

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  // Opportunistic cleanup of stale sessions for this user.
  await query(`DELETE FROM sessions WHERE user_id = $1 AND expires_at < now()`, [userId]);
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    try {
      await query(`DELETE FROM sessions WHERE token_hash = $1`, [hashToken(token)]);
    } catch {
      /* ignore */
    }
  }
  store.delete(SESSION_COOKIE);
}

/** Reads the current session's user, or null. Never throws. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    await ensureSchema();
    const row = await queryOne<UserRow>(
      `SELECT u.* FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = $1 AND s.expires_at > now()
       LIMIT 1`,
      [hashToken(token)],
    );
    if (!row) return null;
    if (row.status === "suspended") return null;
    return toSessionUser(row);
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<SessionUser | null> {
  return getCurrentUser();
}

export async function requireAdmin(): Promise<SessionUser | null> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return null;
  return user;
}

export async function touchLastLogin(userId: string): Promise<void> {
  try {
    await query(`UPDATE users SET last_login_at = now() WHERE id = $1`, [userId]);
  } catch {
    /* ignore */
  }
}

/**
 * Administrator bootstrap. When ADMIN_EMAIL + ADMIN_PASSWORD env vars are set,
 * the matching account is promoted to `admin` (creating it if needed) so the
 * owner can reach /admin on a fresh deployment.
 */
export async function ensureAdminAccount(): Promise<void> {
  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";
  const name = (process.env.ADMIN_NAME || "Valtra Assets Admin").trim();
  if (!email || password.length < 8) return;

  const existing = await queryOne<UserRow>(`SELECT * FROM users WHERE lower(email) = $1 LIMIT 1`, [
    email,
  ]);
  const passwordHash = await hashPassword(password);

  if (existing) {
    await query(
      `UPDATE users
       SET role = 'admin', password_hash = $2, updated_at = now()
       WHERE id = $1`,
      [existing.id, passwordHash],
    );
    return;
  }

  await query(
    `INSERT INTO users (account_id, full_name, email, password_hash, referral_code, role, status, country, occupation, account_type)
     VALUES ($1,$2,$3,$4,$5,'admin','active','—','Platform Administrator','individual')`,
    [generateAccountId(), name, email, passwordHash, generateReferralCode()],
  );
}
