"use client";

import { useState, useEffect } from "react";
import { BarChart3, Trophy } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { PageFooter, ProbabilityNotice } from "@/components/page-footer";

type PeriodTopNumbers = {
  periodMonths: number;
  numbers: number[];
};

type TopNumbersResponse = {
  periods: PeriodTopNumbers[];
  notice: string;
};

const PERIODS = [
  { label: "1개월", months: 1 },
  { label: "3개월", months: 3 },
  { label: "6개월", months: 6 },
  { label: "1년", months: 12 },
];

const RANK_MEDALS = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣"];

export default function StatsTopPage() {
  const [periodsData, setPeriodsData] = useState<PeriodTopNumbers[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTopNumbers() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/stats/top?periods=1,3,6,12&limit=6");
        if (!res.ok) {
          throw new Error("통계 데이터를 불러오지 못했습니다.");
        }
        const data: TopNumbersResponse = await res.json();
        setPeriodsData(data.periods || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    }
    fetchTopNumbers();
  }, []);

  const getPeriodLabel = (months: number) => {
    return PERIODS.find((p) => p.months === months)?.label || `${months}개월`;
  };

  if (loading) {
    return (
      <>
        <AppHeader title="구간별 상위 번호" eyebrow="1–45 출현 상위 6개" />
        <main className="px-4 pb-3 pt-5 sm:px-6">
          <section>
            <div className="flex items-start gap-3">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8F4EF] text-[#0F8A5F]">
                <BarChart3 aria-hidden="true" size={24} />
              </span>
              <div>
                <h1 className="text-[24px] font-black tracking-[-0.04em]">구간별 상위 번호</h1>
                <p className="mt-1 text-[15px] text-[#68736D]">
                  공식 당첨 번호 중 출현 횟수가 가장 많은 상위 6개 번호를 구간별로 보여줍니다.
                </p>
              </div>
            </div>
          </section>

          <section className="mt-5 rounded-2xl border border-[#DFE4DF] bg-white p-3 sm:p-5" aria-label="구간별 상위 번호 로딩 중">
            <div className="py-12 text-center text-[#68736D] font-bold">
              통계를 계산하는 중입니다...
            </div>
          </section>

          <div className="mt-4">
            <ProbabilityNotice />
          </div>
        </main>
        <PageFooter />
      </>
    );
  }

  if (error) {
    return (
      <>
        <AppHeader title="구간별 상위 번호" eyebrow="1–45 출현 상위 6개" />
        <main className="px-4 pb-3 pt-5 sm:px-6">
          <section>
            <div className="flex items-start gap-3">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8F4EF] text-[#0F8A5F]">
                <BarChart3 aria-hidden="true" size={24} />
              </span>
              <div>
                <h1 className="text-[24px] font-black tracking-[-0.04em]">구간별 상위 번호</h1>
                <p className="mt-1 text-[15px] text-[#68736D]">
                  공식 당첨 번호 중 출현 횟수가 가장 많은 상위 6개 번호를 구간별로 보여줍니다.
                </p>
              </div>
            </div>
          </section>

          <section className="mt-5 rounded-2xl border border-[#DFE4DF] bg-white p-3 sm:p-5" aria-label="에러 발생">
            <div className="py-12 text-center text-[#C94B4B] font-bold">
              {error}
            </div>
            <div className="mt-4 text-center">
              <button
                onClick={() => window.location.reload()}
                className="pressable inline-flex items-center gap-2 rounded-xl bg-[#0F8A5F] px-5 py-2.5 text-white font-bold text-[15px]"
              >
                다시 시도
              </button>
            </div>
          </section>

          <div className="mt-4">
            <ProbabilityNotice />
          </div>
        </main>
        <PageFooter />
      </>
    );
  }

  const hasData = periodsData.some((p) => p.numbers.length > 0);

  if (!hasData) {
    return (
      <>
        <AppHeader title="구간별 상위 번호" eyebrow="1–45 출현 상위 6개" />
        <main className="px-4 pb-3 pt-5 sm:px-6">
          <section>
            <div className="flex items-start gap-3">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8F4EF] text-[#0F8A5F]">
                <BarChart3 aria-hidden="true" size={24} />
              </span>
              <div>
                <h1 className="text-[24px] font-black tracking-[-0.04em]">구간별 상위 번호</h1>
                <p className="mt-1 text-[15px] text-[#68736D]">
                  공식 당첨 번호 중 출현 횟수가 가장 많은 상위 6개 번호를 구간별로 보여줍니다.
                </p>
              </div>
            </div>
          </section>

          <section className="mt-5 rounded-2xl border border-[#DFE4DF] bg-white p-3 sm:p-5" aria-label="데이터 없음">
            <div className="py-12 text-center text-[#68736D] font-bold">
              해당 기간의 당첨 데이터가 없습니다.
            </div>
          </section>

          <div className="mt-4">
            <ProbabilityNotice />
          </div>
        </main>
        <PageFooter />
      </>
    );
  }

  return (
    <>
      <AppHeader title="구간별 상위 번호" eyebrow="1–45 출현 상위 6개" />
      <main className="px-4 pb-3 pt-5 sm:px-6">
        <section>
          <div className="flex items-start gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8F4EF] text-[#0F8A5F]">
              <BarChart3 aria-hidden="true" size={24} />
            </span>
            <div>
              <h1 className="text-[24px] font-black tracking-[-0.04em]">구간별 상위 번호</h1>
              <p className="mt-1 text-[15px] text-[#68736D]">
                공식 당첨 번호 중 출현 횟수가 가장 많은 상위 6개 번호를 구간별로 보여줍니다.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-2xl border border-[#DFE4DF] bg-white p-3 sm:p-5" aria-labelledby="top-numbers-title">
          <h2 id="top-numbers-title" className="sr-only">구간별 상위 번호</h2>

          <div className="space-y-6">
            {periodsData.map((period) => {
              const label = getPeriodLabel(period.periodMonths);
              const numbers = period.numbers;

              if (numbers.length === 0) return null;

              return (
                <div key={period.periodMonths} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Trophy className="text-[#0F8A5F]" size={20} aria-hidden="true" />
                    <span className="text-[16px] font-extrabold text-[#17211C]">{label}</span>
                    <span className="ml-auto text-[13px] font-bold text-[#68736D]">
                      상위 {numbers.length}개
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-6" role="list" aria-label={`${label} 상위 번호`}>
                    {numbers.map((num, idx) => (
                      <div
                        key={`${period.periodMonths}-${num}`}
                        className="flex aspect-square min-w-0 flex-col items-center justify-center rounded-xl border border-[#DFE4DF] bg-white"
                        role="listitem"
                      >
                        <span className="text-[13px] font-extrabold text-[#0F8A5F]">
                          {RANK_MEDALS[idx] || `${idx + 1}`}
                        </span>
                        <span className="mt-1 text-[22px] font-black leading-none text-[#17211C]">
                          {num}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="mt-4">
          <ProbabilityNotice />
        </div>
      </main>
      <PageFooter />
    </>
  );
}