import type { WinRank } from "@/lib/mock-data";

const rankStyles: Record<WinRank, string> = {
  1: "border-[#F0CACA] bg-[#FFF0F0] text-[#B62F2F]",
  2: "border-[#F2D4B9] bg-[#FFF4E9] text-[#BD5B14]",
  3: "border-[#C9DDF0] bg-[#EDF5FC] text-[#27649E]",
  4: "border-[#D9DEDA] bg-[#F1F3F1] text-[#4F5B54]",
  5: "border-[#D9DEDA] bg-[#F1F3F1] text-[#4F5B54]",
};

type RankBadgeProps = {
  rank: WinRank;
  count?: number;
};

export function RankBadge({ rank, count }: RankBadgeProps) {
  return (
    <span className={`inline-flex min-h-8 items-center rounded-full border px-2.5 text-[14px] font-extrabold ${rankStyles[rank]}`}>
      {rank}등{typeof count === "number" ? ` ${count}회` : ""}
    </span>
  );
}
