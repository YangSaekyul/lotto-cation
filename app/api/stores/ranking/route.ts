import { NextResponse } from "next/server";
import { getTopStores, type WinRank } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rankStr = searchParams.get("rank") || "all";
  // `region` is the legacy param name; `city` is accepted as an alias
  // for the same 시/도 selector (e.g. city=서울).
  const region = searchParams.get("region") || searchParams.get("city") || "전체";
  // Optional district (구/읍/면) filter, e.g. district=강남구.
  const district = searchParams.get("district") || "";

  let rankFilter: "all" | WinRank = "all";
  if (["1", "2", "3", "4", "5"].includes(rankStr)) {
    rankFilter = parseInt(rankStr) as WinRank;
  }

  const stores = getTopStores(rankFilter, region, 50, district);
  return NextResponse.json({
    stores,
    count: stores.length,
    region,
    district: district || null,
  });
}
