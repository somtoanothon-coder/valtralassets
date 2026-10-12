import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/lib/db";
import { mailerConfigured } from "@/lib/mail";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "valtra-assets",
    database: isDatabaseConfigured() ? "configured" : "missing",
    mailer: mailerConfigured() ? "configured" : "missing",
    time: new Date().toISOString(),
  });
}
