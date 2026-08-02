import { NextResponse } from "next/server";
import { getStoresNearby, type WinRank } from "@/lib/db";
import { validateNearbyQuery } from "@/lib/query-validation";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const validation = validateNearbyQuery(
    searchParams.get("lat"),
    searchParams.get("lng"),
    searchParams.get("radius") || "5",
  );
  if (!validation.ok) return NextResponse.json({ error: validation.message }, { status: 400 });

  const rankValue = searchParams.get("rank") || "all";
  let rankFilter: "all" | WinRank = "all";
  if (rankValue !== "all") {
    if (!["1", "2", "3", "4", "5"].includes(rankValue)) {
      return NextResponse.json({ error: "유효한 등수 필터가 아닙니다." }, { status: 400 });
    }
    rankFilter = Number(rankValue) as WinRank;
  }
  const { lat, lng, radius } = validation.data;
  const stores = getStoresNearby(lat, lng, radius, rankFilter).map((store) => ({
    id: store.id,
    name: store.name,
    address: store.address,
    latitude: store.latitude,
    longitude: store.longitude,
    distanceKm: store.distanceKm,
    distanceFormatted: store.distanceFormatted,
    totalWins: store.totalWins,
    rankCounts: store.rankCounts,
    status: store.status,
  }));
  return NextResponse.json(
    { stores, count: stores.length },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
  );
}
