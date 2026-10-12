import { NextResponse } from "next/server";
import { ensureSchema, isDatabaseConfigured, query, writeAudit } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { WALLETS } from "@/config/site";

export const dynamic = "force-dynamic";

/** Wallet ids that may be overridden from the dashboard. */
const EDITABLE = new Set<string>(WALLETS.map((w) => w.id));

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: "Not authorised." }, { status: 403 });

  const defaults = WALLETS.map((w) => ({
    id: w.id,
    asset: w.asset,
    network: w.network,
    address: w.address,
    note: w.note,
  }));

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: true, wallets: defaults, overridden: [] });
  }

  try {
    await ensureSchema();
    const rows = await query<{ key: string; value: string }>(
      `SELECT key, value FROM settings WHERE key LIKE 'wallet.%'`,
    );
    const overrides = new Map(rows.map((r) => [r.key.replace("wallet.", ""), r.value]));

    return NextResponse.json({
      ok: true,
      wallets: defaults.map((w) => ({
        ...w,
        address: overrides.get(w.id) || w.address,
        overridden: overrides.has(w.id),
      })),
      overridden: [...overrides.keys()],
    });
  } catch (error) {
    console.error("[admin:settings:get]", error);
    return NextResponse.json({ ok: true, wallets: defaults, overridden: [] });
  }
}

/**
 * Admin: override the settlement wallet addresses shown to customers.
 * Pass an empty string to reset an address back to the deploy-time default.
 */
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: "Not authorised." }, { status: 403 });
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "Database not connected." }, { status: 503 });
  }

  let body: { addresses?: Record<string, string> };
  try {
    body = (await request.json()) as { addresses?: Record<string, string> };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  const entries = Object.entries(body.addresses ?? {}).filter(([key]) => EDITABLE.has(key));
  if (!entries.length) {
    return NextResponse.json({ ok: false, error: "Nothing to update." }, { status: 422 });
  }

  try {
    await ensureSchema();

    for (const [key, rawValue] of entries) {
      const value = String(rawValue ?? "").trim().slice(0, 160);

      if (!value) {
        await query(`DELETE FROM settings WHERE key = $1`, [`wallet.${key}`]);
        continue;
      }

      // Reject obvious typos before customers can copy a broken address.
      if (!/^[A-Za-z0-9:_-]{16,160}$/.test(value)) {
        return NextResponse.json(
          {
            ok: false,
            error: `"${value.slice(0, 24)}" does not look like a wallet address. Check for spaces or missing characters.`,
          },
          { status: 422 },
        );
      }

      await query(
        `INSERT INTO settings (key, value, updated_at)
         VALUES ($1,$2, now())
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
        [`wallet.${key}`, value],
      );
    }

    await writeAudit(admin.id, "admin.settings.wallets", "settings", "wallets", {
      keys: entries.map(([k]) => k),
    });

    return NextResponse.json({
      ok: true,
      message:
        "Wallet addresses updated. Customers will see the new addresses immediately on the deposit page.",
    });
  } catch (error) {
    console.error("[admin:settings:post]", error);
    return NextResponse.json({ ok: false, error: "The addresses could not be saved." }, { status: 500 });
  }
}
