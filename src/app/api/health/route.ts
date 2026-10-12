import { NextResponse } from "next/server";
import { isDatabaseConfigured, query } from "@/lib/db";
import { mailerConfigured } from "@/lib/mail";

export const dynamic = "force-dynamic";

export async function GET() {
  let database: "connected" | "missing" | "unavailable" = "missing";
  if (isDatabaseConfigured()) {
    try {
      await query("SELECT 1");
      database = "connected";
    } catch (error) {
      console.error("[health:database]", error);
      database = "unavailable";
    }
  }

  const adminConfigured = Boolean(
    process.env.ADMIN_EMAIL?.trim() && (process.env.ADMIN_PASSWORD || "").length >= 8,
  );

  return NextResponse.json({
    ok: database !== "unavailable",
    service: "valtra-assets",
    database,
    // ADMIN_EMAIL + ADMIN_PASSWORD (min 8 chars) are what create/promote the
    // administrator account. Without both, /admin is unreachable.
    admin: adminConfigured ? "configured" : "missing",
    mailer: mailerConfigured() ? "configured" : "missing",
    time: new Date().toISOString(),
  }, { status: database === "unavailable" ? 503 : 200 });
}
