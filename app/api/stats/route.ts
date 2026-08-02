import { NextResponse } from "next/server";
import { getNumberStatistics } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const monthsStr = searchParams.get("months") || "6";
  const months = parseInt(monthsStr, 10);

  const validMonths = isNaN(months) || months <= 0 ? 6 : months;
  const frequencies = getNumberStatistics(validMonths);

  return NextResponse.json({
    months: validMonths,
    frequencies,
    notice: "과거 당첨 이력과 번호 통계는 향후 당첨 확률을 높이지 않습니다.",
  });
}
