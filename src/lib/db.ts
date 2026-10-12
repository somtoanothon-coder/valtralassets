import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

/**
 * Database access layer.
 *
 * Deployed environments use Neon serverless Postgres, configured through
 * DATABASE_URL. Outside production, when no connection string is present, the
 * app falls back to an embedded Postgres (PGlite) persisted under `.data/` so
 * sign-up, sign-in and the admin console work with no external setup. The
 * fallback is never used in production.
 */

let _sql: NeonQueryFunction<false, false> | null = null;
let _schemaReady: Promise<void> | null = null;

type Param = string | number | boolean | null | Date;

function configuredUrl(): string | null {
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.NETLIFY_DATABASE_URL ||
    "";
  return url.trim() ? url.trim() : null;
}

/**
 * True when queries should run against the embedded local Postgres: either an
 * explicit `pglite://` / `file://` URL, or no connection string at all outside
 * production.
 */
export function usesLocalDatabase(): boolean {
  const url = configuredUrl();
  if (!url) return process.env.NODE_ENV !== "production";
  return /^(pglite|file):/i.test(url);
}

export function databaseUrl(): string | null {
  return configuredUrl();
}

export function isDatabaseConfigured(): boolean {
  return configuredUrl() !== null || usesLocalDatabase();
}

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super(
      "Database is not configured. Add DATABASE_URL (Neon connection string) to your environment variables.",
    );
    this.name = "DatabaseNotConfiguredError";
  }
}

/** Minimal surface shared by the Neon client and the embedded Postgres. */
type EmbeddedClient = {
  query: (text: string, params?: unknown[]) => Promise<{ rows: unknown[] }>;
};

let _embedded: Promise<EmbeddedClient> | null = null;

async function embeddedClient(): Promise<EmbeddedClient> {
  if (!_embedded) {
    _embedded = (async () => {
      const [{ PGlite }, { mkdir }, path] = await Promise.all([
        import("@electric-sql/pglite"),
        import("node:fs/promises"),
        import("node:path"),
      ]);
      const dataDir = path.resolve(process.env.LOCAL_DATABASE_DIR || ".data/pglite");
      // PGlite creates its cluster inside an existing directory.
      await mkdir(dataDir, { recursive: true });
      const db = new PGlite(dataDir);
      await db.waitReady;
      return db as unknown as EmbeddedClient;
    })().catch((error) => {
      // Allow a later request to retry instead of caching a permanent failure.
      _embedded = null;
      throw error;
    });
  }
  return _embedded;
}

/**
 * Returns a tagged-template SQL function bound to Neon. Prefer `query()` for
 * anything that needs parameters from untrusted input.
 */
export function sql() {
  const url = configuredUrl();
  if (!url || usesLocalDatabase()) throw new DatabaseNotConfiguredError();
  if (!_sql) _sql = neon(url);
  return _sql;
}

/**
 * Schema DDL is written as a tagged template for readability. The migration
 * never interpolates values, so this simply forwards the statement text.
 */
async function ddlTag(strings: TemplateStringsArray, ...values: unknown[]): Promise<unknown> {
  if (values.length) throw new Error("Schema DDL must not interpolate values.");
  await query(strings.join(""), []);
  return [];
}

/**
 * Runs a parameterised query with `$1, $2, …` placeholders.
 * Every value is bound by the driver — never string-interpolated.
 */
export async function query<T = Record<string, unknown>>(
  text: string,
  params: Param[] = [],
): Promise<T[]> {
  if (usesLocalDatabase()) {
    const db = await embeddedClient();
    const result = await db.query(text, params);
    return result.rows as T[];
  }
  const client = sql();
  const rows = (await client(text, params)) as unknown as T[];
  return rows;
}

export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params: Param[] = [],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows.length ? rows[0] : null;
}

/** Cached, idempotent schema bootstrap. Runs at most once per server instance. */
export async function ensureSchema(): Promise<void> {
  if (!_schemaReady) {
    _schemaReady = migrate().catch((error) => {
      // Allow a later request to retry instead of caching a permanent failure.
      _schemaReady = null;
      throw error;
    });
  }
  return _schemaReady;
}

async function migrate(): Promise<void> {
  const client = ddlTag;

  await client`
    CREATE TABLE IF NOT EXISTS users (
      id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      account_id        TEXT UNIQUE NOT NULL,
      full_name         TEXT NOT NULL,
      email             TEXT UNIQUE NOT NULL,
      phone             TEXT,
      date_of_birth     TEXT,
      address           TEXT,
      country           TEXT,
      occupation        TEXT,
      account_type      TEXT NOT NULL DEFAULT 'individual',
      second_full_name  TEXT,
      second_email      TEXT,
      second_phone      TEXT,
      second_date_of_birth TEXT,
      second_address    TEXT,
      second_country    TEXT,
      second_occupation TEXT,
      password_hash     TEXT NOT NULL,
      referral_code     TEXT UNIQUE NOT NULL,
      referred_by       TEXT,
      role              TEXT NOT NULL DEFAULT 'user',
      status            TEXT NOT NULL DEFAULT 'active',
      balance           NUMERIC(18,2) NOT NULL DEFAULT 0,
      total_deposited   NUMERIC(18,2) NOT NULL DEFAULT 0,
      total_withdrawn   NUMERIC(18,2) NOT NULL DEFAULT 0,
      last_login_at     TIMESTAMPTZ,
      created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await client`CREATE INDEX IF NOT EXISTS users_email_idx ON users (lower(email))`;
  await client`CREATE INDEX IF NOT EXISTS users_created_idx ON users (created_at DESC)`;

  await client`
    CREATE TABLE IF NOT EXISTS sessions (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash  TEXT UNIQUE NOT NULL,
      user_agent  TEXT,
      ip          TEXT,
      expires_at  TIMESTAMPTZ NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await client`CREATE INDEX IF NOT EXISTS sessions_token_idx ON sessions (token_hash)`;
  await client`CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions (user_id)`;

  await client`
    CREATE TABLE IF NOT EXISTS login_rate_limits (
      key_hash          TEXT PRIMARY KEY,
      attempts          INTEGER NOT NULL DEFAULT 0,
      window_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await client`CREATE INDEX IF NOT EXISTS login_rate_limits_updated_idx ON login_rate_limits (updated_at)`;

  await client`
    CREATE TABLE IF NOT EXISTS transactions (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type          TEXT NOT NULL,
      direction     TEXT NOT NULL DEFAULT 'credit',
      amount        NUMERIC(18,2) NOT NULL DEFAULT 0,
      currency      TEXT NOT NULL DEFAULT 'USD',
      method        TEXT,
      network       TEXT,
      wallet_id     TEXT,
      wallet_address TEXT,
      provider_ref  TEXT,
      status        TEXT NOT NULL DEFAULT 'pending',
      reference     TEXT UNIQUE NOT NULL,
      plan_id       TEXT,
      item_slug     TEXT,
      note          TEXT,
      admin_note    TEXT,
      reviewed_by   UUID REFERENCES users(id) ON DELETE SET NULL,
      reviewed_at   TIMESTAMPTZ,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await client`CREATE INDEX IF NOT EXISTS tx_user_idx ON transactions (user_id, created_at DESC)`;
  await client`CREATE INDEX IF NOT EXISTS tx_status_idx ON transactions (status, created_at DESC)`;
  await client`CREATE INDEX IF NOT EXISTS tx_type_idx ON transactions (type, created_at DESC)`;

  await client`
    CREATE TABLE IF NOT EXISTS investments (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
      plan_id       TEXT NOT NULL,
      plan_name     TEXT NOT NULL,
      amount        NUMERIC(18,2) NOT NULL,
      roi_percent   NUMERIC(8,2) NOT NULL,
      duration_days INTEGER NOT NULL,
      status        TEXT NOT NULL DEFAULT 'active',
      started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
      matures_at    TIMESTAMPTZ,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await client`CREATE INDEX IF NOT EXISTS inv_user_idx ON investments (user_id, created_at DESC)`;

  await client`
    CREATE TABLE IF NOT EXISTS nft_holdings (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      slug        TEXT NOT NULL,
      name        TEXT NOT NULL,
      price_usd   NUMERIC(18,2) NOT NULL,
      price_eth   NUMERIC(18,6) NOT NULL,
      status      TEXT NOT NULL DEFAULT 'pending',
      tx_hash     TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (user_id, slug)
    )
  `;

  await client`
    CREATE TABLE IF NOT EXISTS settings (
      key         TEXT PRIMARY KEY,
      value       TEXT NOT NULL,
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await client`
    CREATE TABLE IF NOT EXISTS audit_log (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      actor_id    UUID REFERENCES users(id) ON DELETE SET NULL,
      action      TEXT NOT NULL,
      target_type TEXT,
      target_id   TEXT,
      detail      JSONB,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await client`CREATE INDEX IF NOT EXISTS audit_created_idx ON audit_log (created_at DESC)`;
}

/** Shape of a row from `users` as returned by the driver. */
export type UserRow = {
  id: string;
  account_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  date_of_birth: string | null;
  address: string | null;
  country: string | null;
  occupation: string | null;
  account_type: string;
  second_full_name: string | null;
  second_email: string | null;
  second_phone: string | null;
  second_date_of_birth: string | null;
  second_address: string | null;
  second_country: string | null;
  second_occupation: string | null;
  referral_code: string;
  referred_by: string | null;
  role: string;
  status: string;
  balance: string;
  total_deposited: string;
  total_withdrawn: string;
  last_login_at: string | null;
  created_at: string;
};

export type TransactionRow = {
  id: string;
  user_id: string;
  type: string;
  direction: string;
  amount: string;
  currency: string;
  method: string | null;
  network: string | null;
  wallet_id: string | null;
  wallet_address: string | null;
  provider_ref: string | null;
  status: string;
  reference: string;
  plan_id: string | null;
  item_slug: string | null;
  note: string | null;
  admin_note: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export type InvestmentRow = {
  id: string;
  user_id: string;
  plan_id: string;
  plan_name: string;
  amount: string;
  roi_percent: string;
  duration_days: number;
  status: string;
  started_at: string;
  matures_at: string | null;
  created_at: string;
};

export type NftHoldingRow = {
  id: string;
  user_id: string;
  slug: string;
  name: string;
  price_usd: string;
  price_eth: string;
  status: string;
  created_at: string;
};

export async function writeAudit(
  actorId: string | null,
  action: string,
  targetType?: string,
  targetId?: string,
  detail?: Record<string, unknown>,
): Promise<void> {
  try {
    await query(
      `INSERT INTO audit_log (actor_id, action, target_type, target_id, detail)
       VALUES ($1,$2,$3,$4,$5)`,
      [actorId, action, targetType ?? null, targetId ?? null, detail ? JSON.stringify(detail) : null],
    );
  } catch {
    // Auditing must never break the primary operation.
  }
}
