import { NextResponse } from "next/server";
import { getDistricts } from "@/lib/db";

/**
 * GET /api/stores/districts?city=서울
 * Returns the list of valid districts (구/읍/면) for a selected city/province.
 * When `city` is omitted (or "전체"), returns the full set across the country.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city") || "전체";

  const districts = getDistricts(city);
  return NextResponse.json({
    city,
    districts,
    count: districts.length,
  });
}
