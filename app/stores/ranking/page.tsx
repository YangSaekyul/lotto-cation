"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Medal } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { PageFooter } from "@/components/page-footer";
import { StoreCard } from "@/components/store-card";
import type { StoreRecord, WinRank } from "@/lib/db";

const RANK_OPTIONS: Array<{ label: string; value: "all" | WinRank }> = [
  { label: "전체", value: "all" },
  { label: "1등 이력", value: 1 },
  { label: "2등 이력", value: 2 },
  { label: "3등 이력", value: 3 },
];

const REGION_OPTIONS = [
  "전체",
  "서울",
  "경기",
  "부산",
  "대구",
  "인천",
  "광주",
  "대전",
  "울산",
  "세종",
  "강원",
  "충북",
  "충남",
  "전북",
  "전남",
  "경북",
  "경남",
  "제주",
];

export default function StoreRankingPage() {
  const [selectedRank, setSelectedRank] = useState<"all" | WinRank>("all");
  const [selectedRegion, setSelectedRegion] = useState<string>("전체");
  const [stores, setStores] = useState<StoreRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchRanking() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/stores/ranking?rank=${selectedRank}&region=${encodeURIComponent(selectedRegion)}`
        );
        if (res.ok) {
          const data = await res.json();
          setStores(data.stores || []);
        }
      } catch (err) {
        console.error("Failed to fetch top stores:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRanking();
  }, [selectedRank, selectedRegion]);

  return (
    <>
      <AppHeader title="최다 판매점" eyebrow="과거 당첨 이력 순" />
      <main className="px-4 pb-3 pt-5 sm:px-6">
        <div className="flex items-start gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8F4EF] text-[#0F8A5F]">
            <Medal aria-hidden="true" size={25} />
          </span>
          <div>
            <h1 className="text-[24px] font-black tracking-[-0.04em]">당첨 이력 많은 판매점</h1>
            <p className="mt-1 text-[15px] text-[#68736D]">
              공개된 과거 공식 이력을 합산한 당첨 횟수순 목록입니다.
            </p>
          </div>
        </div>

        {/* RANK FILTER TABS */}
        <div className="mt-5 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="당첨 등수">
          {RANK_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              type="button"
              role="tab"
              aria-selected={selectedRank === opt.value}
              onClick={() => setSelectedRank(opt.value)}
              className={`pressable min-h-12 shrink-0 rounded-full px-4 text-[15px] font-extrabold transition-colors ${
                selectedRank === opt.value
                  ? "bg-[#17211C] text-white"
                  : "border border-[#D7DED8] bg-white text-[#17211C]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* REGION SELECTOR */}
        <label className="relative mt-4 block">
          <span className="sr-only">지역 선택</span>
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="min-h-14 w-full appearance-none rounded-2xl border border-[#D5DDD6] bg-white px-4 pr-12 text-[16px] font-extrabold text-[#17211C]"
          >
            {REGION_OPTIONS.map((region) => (
              <option key={region} value={region}>
                {region === "전체" ? "전국 전체" : region}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#637068]"
            size={22}
          />
        </label>

        {/* STORE LIST */}
        <section className="mt-5 space-y-3" aria-label="판매점 순위 목록">
          {loading ? (
            <div className="py-12 text-center text-[#68736D] font-bold">
              최다 당첨 판매점 데이터를 불러오는 중...
            </div>
          ) : stores.length === 0 ? (
            <div className="py-12 text-center text-[#68736D] font-bold border border-dashed border-[#D8DED9] rounded-2xl bg-white p-6">
              선택한 조건의 판매점이 없습니다.
            </div>
          ) : (
            stores.map((store, index) => (
              <StoreCard key={store.id} store={store} rank={index + 1} />
            ))
          )}
        </section>
      </main>
      <PageFooter />
    </>
  );
}
