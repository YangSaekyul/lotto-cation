import { NextResponse } from "next/server";
import { getTopStores, type WinRank } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rankStr = searchParams.get("rank") || "all";
  const region = searchParams.get("region") || "전체";

  let rankFilter: "all" | WinRank = "all";
  if (["1", "2", "3", "4", "5"].includes(rankStr)) {
    rankFilter = parseInt(rankStr) as WinRank;
  }

  const stores = getTopStores(rankFilter, region);
  return NextResponse.json({ stores, count: stores.length });
}
