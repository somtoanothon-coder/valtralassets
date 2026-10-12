import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  await destroySession();
  return NextResponse.json({ ok: true });
}

export async function GET(request: Request) {
  await destroySession();
  return NextResponse.redirect(new URL("/", request.url));
}
