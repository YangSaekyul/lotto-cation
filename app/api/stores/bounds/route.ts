import { NextResponse } from "next/server";
import { getStoresInBounds } from "@/lib/db";
import { validateBoundsQuery } from "@/lib/query-validation";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const validation = validateBoundsQuery(
    searchParams.get("south"),
    searchParams.get("west"),
    searchParams.get("north"),
    searchParams.get("east"),
  );
  if (!validation.ok) return NextResponse.json({ error: validation.message }, { status: 400 });

  const { south, west, north, east } = validation.data;
  const stores = getStoresInBounds(south, west, north, east);
  return NextResponse.json(
    { stores, count: stores.length },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
  );
}
