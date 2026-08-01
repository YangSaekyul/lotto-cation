import { LocateFixed, MapPin, SlidersHorizontal, Ticket } from "lucide-react";
import { stores, type WinRank } from "@/lib/mock-data";
import { PageFooter } from "@/components/page-footer";
import { StoreCard } from "@/components/store-card";

const filterRanks: WinRank[] = [1, 2, 3, 4, 5];

const pins = [
  { label: "1등", top: "30%", left: "24%", tone: "bg-[#C83B3B]" },
  { label: "2등", top: "45%", left: "69%", tone: "bg-[#D97120]" },
  { label: "3등", top: "62%", left: "42%", tone: "bg-[#3174B8]" },
];

export function MapHome() {
  return (
    <main className="relative min-h-dvh overflow-x-hidden pb-20">
      <section aria-label="판매점 지도 목업" className="map-grid relative h-[62dvh] min-h-[470px] overflow-hidden border-b border-[#D6DED7]">
        <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between p-4 sm:p-6">
          <div className="flex min-h-12 items-center gap-2 rounded-2xl border border-[#DDE4DE] bg-white px-3.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-[#0F8A5F] text-white">
              <Ticket aria-hidden="true" size={18} />
            </span>
            <div>
              <p className="text-[18px] font-black leading-5 tracking-[-0.03em]">로또케이션</p>
              <p className="text-[11px] font-bold text-[#68736D]">LOTTO + LOCATION</p>
            </div>
          </div>
          <button type="button" className="pressable flex size-12 items-center justify-center rounded-full border border-[#DDE4DE] bg-white text-[#0F8A5F]" aria-label="현재 위치로 이동">
            <LocateFixed aria-hidden="true" size={24} />
          </button>
        </div>

        <div className="absolute left-4 right-4 top-22 z-20 flex gap-2 overflow-x-auto pb-1 sm:left-6 sm:right-6">
          <button type="button" className="pressable flex min-h-12 shrink-0 items-center gap-2 rounded-full border border-[#17211C] bg-[#17211C] px-4 text-[15px] font-bold text-white">
            <SlidersHorizontal aria-hidden="true" size={18} />
            전체
          </button>
          {filterRanks.map((rank) => (
            <button key={rank} type="button" className="pressable min-h-12 shrink-0 rounded-full border border-[#D7DED8] bg-white px-4 text-[15px] font-bold">
              {rank}등
            </button>
          ))}
        </div>

        {pins.map((pin) => (
          <div key={pin.label} className="absolute z-10 -translate-x-1/2 -translate-y-1/2" style={{ top: pin.top, left: pin.left }}>
            <div className={`flex min-h-10 items-center gap-1 rounded-full border-2 border-white px-3 text-[14px] font-extrabold text-white ${pin.tone}`}>
              <MapPin aria-hidden="true" size={16} fill="currentColor" />
              {pin.label}
            </div>
            <span className="mx-auto block h-3 w-0.5 bg-[#17211C]/25" />
          </div>
        ))}

        <div className="absolute bottom-16 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-[#C9D4CC] bg-white/92 px-3 py-2 text-[13px] font-bold text-[#556159]">
          <span className="size-2 rounded-full bg-[#0F8A5F]" />
          지도는 디자인용 예시입니다
        </div>
      </section>

      <section aria-labelledby="nearby-title" className="relative z-30 -mt-9 rounded-t-[28px] border-t border-[#D8DFD9] bg-[#F7F8F5] px-4 pt-3 sm:px-6">
        <div aria-hidden="true" className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[#C2CAC4]" />
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-[14px] font-extrabold text-[#0F8A5F]">현재 위치 주변</p>
            <h1 id="nearby-title" className="mt-0.5 text-[24px] font-black tracking-[-0.04em]">가까운 판매점 12곳</h1>
          </div>
          <button type="button" className="pressable min-h-12 shrink-0 rounded-xl border border-[#D8DED9] bg-white px-3 text-[14px] font-bold">거리순</button>
        </div>
        <div className="space-y-3">
          {stores.map((store) => <StoreCard key={store.id} store={store} />)}
        </div>
        <PageFooter />
      </section>
    </main>
  );
}
