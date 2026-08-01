import { ChevronDown, Medal } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { PageFooter } from "@/components/page-footer";
import { StoreCard } from "@/components/store-card";
import { rankingStores } from "@/lib/mock-data";

const ranks = ["전체", "1등", "2등", "3등", "4등", "5등"];

export default function StoreRankingPage() {
  return (
    <>
      <AppHeader title="최다 판매점" eyebrow="과거 당첨 이력 순" />
      <main className="px-4 pb-3 pt-5 sm:px-6">
        <div className="flex items-start gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8F4EF] text-[#0F8A5F]"><Medal aria-hidden="true" size={25} /></span>
          <div>
            <h1 className="text-[24px] font-black tracking-[-0.04em]">당첨 이력 많은 판매점</h1>
            <p className="mt-1 text-[15px] text-[#68736D]">공개된 과거 이력을 합산한 목업 순위입니다.</p>
          </div>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="당첨 등수">
          {ranks.map((rank) => (
            <button key={rank} type="button" role="tab" aria-selected={rank === "전체"} className={`pressable min-h-12 shrink-0 rounded-full px-4 text-[15px] font-extrabold ${rank === "전체" ? "bg-[#17211C] text-white" : "border border-[#D7DED8] bg-white"}`}>
              {rank}
            </button>
          ))}
        </div>

        <label className="relative mt-4 block">
          <span className="sr-only">지역 선택</span>
          <select defaultValue="전국" className="min-h-14 w-full appearance-none rounded-2xl border border-[#D5DDD6] bg-white px-4 pr-12 text-[16px] font-extrabold text-[#17211C]">
            <option>전국</option><option>서울</option><option>부산</option><option>대전</option><option>경기</option>
          </select>
          <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#637068]" size={22} />
        </label>

        <section className="mt-5 space-y-3" aria-label="판매점 순위 목록">
          {rankingStores.map((store, index) => <StoreCard key={store.id} store={store} rank={index + 1} />)}
        </section>
      </main>
      <PageFooter />
    </>
  );
}
