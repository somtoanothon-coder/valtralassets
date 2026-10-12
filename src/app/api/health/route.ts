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

  return NextResponse.json({
    ok: database !== "unavailable",
    service: "valtra-assets",
    database,
    mailer: mailerConfigured() ? "configured" : "missing",
    time: new Date().toISOString(),
  }, { status: database === "unavailable" ? 503 : 200 });
}
