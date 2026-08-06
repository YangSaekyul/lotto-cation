"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Medal, AlertCircle } from "lucide-react";
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

// 시/도 (city) selector options. "전체" means the whole country.
const CITY_OPTIONS = [
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
  const [selectedCity, setSelectedCity] = useState<string>("전체");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("전체");

  const [districtOptions, setDistrictOptions] = useState<string[]>([]);
  const [districtsLoading, setDistrictsLoading] = useState<boolean>(false);
  const [districtsError, setDistrictsError] = useState<string | null>(null);

  const [stores, setStores] = useState<StoreRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState<number>(0);

  // When the selected city changes, reset the district selector and
  // repopulate its options from the districts API.
  useEffect(() => {
    // Skip if city is "전체" - district dropdown is hidden anyway
    if (selectedCity === "전체") return;

    let cancelled = false;

    setDistrictsLoading(true);
    setDistrictsError(null);

    fetch(`/api/stores/districts?city=${encodeURIComponent(selectedCity)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("구/읍/면 목록을 불러오지 못했습니다.");
        const data = await res.json();
        if (!cancelled) setDistrictOptions(data.districts || []);
      })
      .catch((err) => {
        if (!cancelled) {
          setDistrictOptions([]);
          setDistrictsError(err instanceof Error ? err.message : "구/읍/면 목록을 불러오지 못했습니다.");
        }
      })
      .finally(() => {
        if (!cancelled) setDistrictsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCity]);

  useEffect(() => {
    async function fetchRanking() {
      setLoading(true);
      setError(null);
      try {
        // city-only => region set, district omitted => entire city.
        // city + district => filter to that district only.
        const params = new URLSearchParams({
          rank: String(selectedRank),
          region: selectedCity,
        });
        if (selectedDistrict && selectedDistrict !== "전체") {
          params.set("district", selectedDistrict);
        }
        const res = await fetch(`/api/stores/ranking?${params.toString()}`);
        if (!res.ok) throw new Error("판매점 순위를 불러오지 못했습니다.");
        const data = await res.json();
        setStores(data.stores || []);
      } catch (err) {
        console.error("Failed to fetch top stores:", err);
        setStores([]);
        setError(err instanceof Error ? err.message : "데이터를 불러오는 중 문제가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    }
    fetchRanking();
  }, [selectedRank, selectedCity, selectedDistrict, retryKey]);

  const showDistrict = selectedCity !== "전체";
  const locationLabel =
    selectedDistrict && selectedDistrict !== "전체"
      ? `${selectedCity} ${selectedDistrict}`
      : selectedCity === "전체"
        ? "전국"
        : `${selectedCity} 전체`;

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

        {/* CITY SELECTOR (시/도) */}
        <label className="relative mt-4 block">
          <span className="mb-1 block text-[13px] font-bold text-[#68736D]">시 / 도</span>
          <select
            value={selectedCity}
            onChange={(e) => {
              setSelectedCity(e.target.value);
              setSelectedDistrict("전체"); // Reset district when city changes
            }}
            className="min-h-14 w-full appearance-none rounded-2xl border border-[#D5DDD6] bg-white px-4 pr-12 text-[16px] font-extrabold text-[#17211C]"
          >
            {CITY_OPTIONS.map((city) => (
              <option key={city} value={city}>
                {city === "전체" ? "전국 전체" : city}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#637068]"
            size={22}
          />
        </label>

        {/* DISTRICT SELECTOR (구/읍/면) — optional, only shown when a city is selected */}
        {showDistrict && (
          <label className="relative mt-3 block">
            <span className="mb-1 flex items-center gap-1 text-[13px] font-bold text-[#68736D]">
              구 / 읍 / 면 <span className="font-medium text-[#9AA49E]">(선택)</span>
            </span>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              disabled={districtsLoading}
              className="min-h-14 w-full appearance-none rounded-2xl border border-[#D5DDD6] bg-white px-4 pr-12 text-[16px] font-extrabold text-[#17211C] disabled:opacity-60"
            >
              <option value="전체">전체 (시 전체)</option>
              {districtsLoading ? (
                <option value="전체" disabled>
                  불러오는 중...
                </option>
              ) : (
                districtOptions.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))
              )}
            </select>
            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#637068]"
              size={22}
            />
          </label>
        )}

        {/* DISTRICT LOAD ERROR */}
        {districtsError && (
          <p className="mt-2 flex items-center gap-1.5 text-[13px] font-bold text-[#C0392B]">
            <AlertCircle aria-hidden="true" size={15} />
            {districtsError}
          </p>
        )}

        {/* RESULT COUNT */}
        {!loading && !error && (
          <p className="mt-5 text-[13px] font-bold text-[#68736D]">
            {locationLabel} · {stores.length}곳
          </p>
        )}

        {/* STORE LIST */}
        <section className="mt-3 space-y-3" aria-label="판매점 순위 목록">
          {loading ? (
            <div className="py-12 text-center text-[#68736D] font-bold">
              최다 당첨 판매점 데이터를 불러오는 중...
            </div>
          ) : error ? (
            <div className="py-10 text-center">
              <p className="text-[15px] font-bold text-[#C0392B]">{error}</p>
              <button
                type="button"
                onClick={() => setRetryKey((k) => k + 1)}
                className="pressable mt-3 rounded-full border border-[#D7DED8] bg-white px-5 py-2 text-[14px] font-extrabold text-[#17211C]"
              >
                다시 시도
              </button>
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
