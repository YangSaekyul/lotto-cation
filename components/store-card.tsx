import { ChevronRight, MapPin } from "lucide-react";
import Link from "next/link";
import { RankBadge } from "@/components/rank-badge";
import type { WinRank } from "@/lib/db";

type StoreCardProps = {
  store: {
    id: string;
    name: string;
    address: string;
    distance?: string;
    distanceFormatted?: string;
    totalWins: number;
    rankCounts: Partial<Record<WinRank, number>>;
    status?: string;
  };
  rank?: number;
};

export function StoreCard({ store, rank }: StoreCardProps) {
  const visibleRanks = ([1, 2, 3, 4, 5] as WinRank[]).filter(
    (item) => store.rankCounts && (store.rankCounts[item] ?? 0) > 0
  );

  const displayDistance = store.distanceFormatted || store.distance || "";

  return (
    <Link
      href={`/store/${store.id}`}
      className="pressable block rounded-2xl border border-[#DFE4DF] bg-white p-4 hover:border-[#B9D6C8]"
    >
      <div className="flex items-start gap-3">
        {rank ? (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#17211C] text-[18px] font-black text-white">
            {rank}
          </span>
        ) : (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F4EF] text-[#0F8A5F]">
            <MapPin aria-hidden="true" size={22} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-[18px] font-extrabold tracking-[-0.02em]">{store.name}</h3>
            <ChevronRight aria-hidden="true" className="shrink-0 text-[#8B958F]" size={22} />
          </div>
          <p className="mt-1 truncate text-[15px] text-[#68736D]">{store.address}</p>
          {displayDistance && (
            <p className="mt-1 text-[14px] font-bold text-[#0F8A5F]">{displayDistance}</p>
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5 border-t border-[#EDF0ED] pt-3">
        {visibleRanks.map((item) => (
          <RankBadge key={item} rank={item} count={store.rankCounts[item]!} />
        ))}
        <span className="ml-auto self-center text-[14px] font-bold text-[#4F5B54]">총 {store.totalWins}회</span>
      </div>
    </Link>
  );
}
