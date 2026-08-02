"use client";

import { useState, useEffect } from "react";
import { BarChart3 } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { PageFooter, ProbabilityNotice } from "@/components/page-footer";
import type { NumberFrequency } from "@/lib/db";

const PERIODS = [
  { label: "1개월", months: 1 },
  { label: "3개월", months: 3 },
  { label: "6개월", months: 6 },
  { label: "1년", months: 12 },
  { label: "5년", months: 60 },
];

const LEVEL_STYLE = {
  low: "border-[#E1E5E2] bg-white text-[#17211C]",
  mid: "border-[#CBE3D7] bg-[#EEF7F2] text-[#17211C]",
  high: "border-[#84BDA4] bg-[#DCEFE6] text-[#0F8A5F]",
};

export default function StatsPage() {
  const [selectedMonths, setSelectedMonths] = useState<number>(6);
  const [frequencies, setFrequencies] = useState<NumberFrequency[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        const res = await fetch(`/api/stats?months=${selectedMonths}`);
        if (res.ok) {
          const data = await res.json();
          setFrequencies(data.frequencies || []);
        }
      } catch (err) {
        console.error("Failed to fetch number statistics:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [selectedMonths]);

  const activePeriodLabel = PERIODS.find((p) => p.months === selectedMonths)?.label || "6개월";

  return (
    <>
      <AppHeader title="번호 통계" eyebrow="1–45 출현 기록" />
      <main className="px-4 pb-3 pt-5 sm:px-6">
        <section>
          <div className="flex items-start gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8F4EF] text-[#0F8A5F]">
              <BarChart3 aria-hidden="true" size={24} />
            </span>
            <div>
              <h1 className="text-[24px] font-black tracking-[-0.04em]">번호별 출현 횟수</h1>
              <p className="mt-1 text-[15px] text-[#68736D]">
                선택한 기간의 공식 당첨 번호 출현 횟수 단순 집계입니다.
              </p>
            </div>
          </div>

          <div
            className="mt-5 grid grid-cols-5 gap-1 rounded-2xl border border-[#DFE4DF] bg-white p-1"
            role="tablist"
            aria-label="통계 기간"
          >
            {PERIODS.map((period) => (
              <button
                key={period.label}
                type="button"
                role="tab"
                aria-selected={selectedMonths === period.months}
                onClick={() => setSelectedMonths(period.months)}
                className={`pressable min-h-12 rounded-xl text-[14px] font-extrabold transition-colors ${
                  selectedMonths === period.months
                    ? "bg-[#0F8A5F] text-white"
                    : "text-[#59655E] hover:bg-[#F2F5F3]"
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </section>

        <section
          className="mt-5 rounded-2xl border border-[#DFE4DF] bg-white p-3 sm:p-5"
          aria-labelledby="frequency-title"
        >
          <div className="mb-4 flex items-center justify-between gap-3 px-1">
            <h2 id="frequency-title" className="text-[18px] font-extrabold text-[#17211C]">
              최근 {activePeriodLabel} 출현 기록
            </h2>
            <div className="flex gap-2 text-[12px] font-bold text-[#68736D]">
              <span>적음</span>
              <span className="text-[#0F8A5F]">많음</span>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-[#68736D] font-bold">
              통계를 계산하는 중입니다...
            </div>
          ) : (
            <div
              className="grid grid-cols-5 gap-1.5 sm:grid-cols-9"
              aria-label="1번부터 45번까지 출현 빈도"
            >
              {frequencies.map((item) => (
                <div
                  key={item.number}
                  className={`flex aspect-square min-w-0 flex-col items-center justify-center rounded-xl border ${
                    LEVEL_STYLE[item.level]
                  }`}
                >
                  <span className="text-[18px] font-black leading-none">{item.number}</span>
                  <span className="mt-1 text-[11px] font-bold text-[#68736D]">{item.count}회</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="mt-4">
          <ProbabilityNotice />
        </div>
      </main>
      <PageFooter />
    </>
  );
}
