import { NextResponse } from "next/server";
import { getTopNumbersByPeriod, type PeriodTopNumbers } from "@/lib/db";

/**
 * 개월수 구간별 상위 번호 집계 API.
 *
 * GET /api/stats/top?periods=1,3,6,12&limit=6
 *   - periods: 콤마로 구분된 개월수 목록 (기본 "1,3,6,12")
 *   - limit:   구간당 최대 반환 번호 개수 (기본 6, 1 이상 정수로 정규화)
 *
 * 응답:
 * {
 *   "periods": [{ "periodMonths": 1, "numbers": [45, 23, 12, 7, 34, 1] }, ...],
 *   "notice": "과거 당첨 이력과 번호 통계는 향후 당첨 확률을 높이지 않습니다."
 * }
 *
 * 각 구간의 번호는 출현 횟수 내림차순, 동률이면 번호 오름차순으로 정렬해 최대 limit개.
 * 구간 데이터가 부족하면 실제 출현한 번호만 정렬해 반환한다(6개 미만 가능).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const periodsParam = searchParams.get("periods") || "1,3,6,12";
  const periodsMonths = periodsParam
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n > 0);

  const limitParam = parseInt(searchParams.get("limit") || "6", 10);

  const periods: PeriodTopNumbers[] = getTopNumbersByPeriod(periodsMonths, limitParam);

  return NextResponse.json({
    periods,
    notice: "과거 당첨 이력과 번호 통계는 향후 당첨 확률을 높이지 않습니다.",
  });
}
