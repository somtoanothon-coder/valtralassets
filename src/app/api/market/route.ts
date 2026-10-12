import { NextResponse } from "next/server";
import { getMarketSnapshot } from "@/lib/market";

export const dynamic = "force-dynamic";

export async function GET() {
  const assets = await getMarketSnapshot();
  return NextResponse.json(
    { assets, at: new Date().toISOString() },
    {
      headers: {
        "Cache-Control": "public, max-age=0, s-maxage=10, stale-while-revalidate=30",
      },
    },
  );
}
