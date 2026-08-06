import { ChevronRight, MapPin, Navigation, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { RankBadge } from "@/components/rank-badge";
import type { WinRank } from "@/lib/db";
import { buildNaverDirectionsUrl } from "@/lib/map-features";

type StoreCardProps = {
  store: {
    id: string;
    name: string;
    address: string;
    latitude?: number | null;
    longitude?: number | null;
    distance?: string;
    distanceFormatted?: string;
    totalWins: number;
    rankCounts: Partial<Record<WinRank, number>>;
    status?: string;
    geocode_status?: string;
  };
  rank?: number;
  isSelected?: boolean;
  onSelect?: () => void;
};

const MEDAL_EMOJIS: Record<number, string> = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};

export function StoreCard({ store, rank, isSelected, onSelect }: StoreCardProps) {
  const visibleRanks = ([1, 2, 3, 4, 5] as WinRank[]).filter(
    (item) => store.rankCounts && (store.rankCounts[item] ?? 0) > 0
  );

  const displayDistance = store.distanceFormatted || store.distance || "";
  const directionsUrl = buildNaverDirectionsUrl(store);
  const detailUrl = `/store/${store.id}`;

  const handleCardClick = (e: React.MouseEvent) => {
    if (onSelect) {
      e.preventDefault();
      onSelect();
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative rounded-2xl border p-4 transition-all ${
        isSelected
          ? "border-2 border-[#0F8A5F] bg-[#F0F8F4] shadow-md ring-2 ring-[#0F8A5F]/20"
          : "border-[#DFE4DF] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:border-[#B9D6C8] active:bg-[#F6F8F6]"
      }`}
    >
      <div className="block cursor-pointer">
        <div className="flex items-start gap-3">
          {rank ? (
            <span
              className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-[16px] font-black text-white shadow-sm ${
                rank === 1
                  ? "bg-[#D4AF37]"
                  : rank === 2
                  ? "bg-[#8E979E]"
                  : rank === 3
                  ? "bg-[#CD7F32]"
                  : "bg-[#17211C]"
              }`}
            >
              {MEDAL_EMOJIS[rank] || rank}
            </span>
          ) : (
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F4EF] text-[#0F8A5F]">
              <MapPin aria-hidden="true" size={22} />
            </span>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                <h3 className="truncate text-[17px] font-black tracking-[-0.02em] text-[#17211C]">
                  {store.name}
                </h3>
                {store.geocode_status === "official_verified" && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-[#EFF6FF] px-1.5 py-0.5 text-[10px] font-extrabold text-[#1D4ED8]">
                    <ShieldCheck size={11} /> 공식
                  </span>
                )}
                {isSelected && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-[#0F8A5F] px-2 py-0.5 text-[11px] font-black text-white shadow-xs">
                    📍 지도 선택됨 (한 번 더 누르면 상세)
                  </span>
                )}
              </div>
              <Link href={detailUrl} onClick={(e) => e.stopPropagation()} className="pressable flex items-center gap-0.5 text-[12px] font-black text-[#0F8A5F] hover:underline">
                {isSelected ? "상세보기 >" : <ChevronRight aria-hidden="true" className="shrink-0 text-[#8B958F] group-hover:text-[#0F8A5F] transition-colors" size={20} />}
              </Link>
            </div>

            <p className="mt-1 line-clamp-1 text-[13px] text-[#68736D] leading-tight">{store.address}</p>

            <div className="mt-1.5 flex items-center gap-2 flex-wrap text-[13px]">
              {displayDistance && (
                <span className="inline-flex items-center rounded-md bg-[#E8F4EF] px-1.5 py-0.5 font-black text-[#0F8A5F] text-[12px]">
                  {displayDistance}
                </span>
              )}
              <span className="font-extrabold text-[#4F5B54]">과거 당첨 총 {store.totalWins}회</span>
            </div>
          </div>
        </div>
      </div>

      {/* Win Ranks Badges & Directions */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-1.5 border-t border-[#EDF0ED] pt-2.5">
        <Link href={detailUrl} onClick={(e) => e.stopPropagation()} className="flex flex-wrap gap-1">
          {visibleRanks.map((item) => (
            <RankBadge key={item} rank={item} count={store.rankCounts[item]!} />
          ))}
        </Link>

        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="pressable inline-flex min-h-10 items-center gap-1 rounded-xl bg-[#0F8A5F] px-3 py-1.5 text-[12px] font-extrabold text-white shadow-xs"
        >
          <Navigation size={13} />
          길찾기
        </a>
      </div>
    </div>
  );
}
