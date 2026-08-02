import { CalendarDays, CheckCircle2, ExternalLink, ShieldCheck } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { LottoBall } from "@/components/lotto-balls";
import { PageFooter } from "@/components/page-footer";
import { RankBadge } from "@/components/rank-badge";
import { getLatestDraw, type WinRank } from "@/lib/db";

export default function LatestDrawPage() {
  const draw = getLatestDraw();

  const ranks: WinRank[] = [1, 2, 3, 4, 5];

  return (
    <>
      <AppHeader title="최근 결과" eyebrow="직전 추첨 회차" />
      <main className="px-4 pb-3 pt-5 sm:px-6">
        <section className="rounded-2xl border border-[#DFE4DF] bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[14px] font-bold text-[#68736D]">동행복권 6/45</p>
              <h1 className="mt-0.5 text-[28px] font-black tracking-[-0.04em]">
                제 {draw.draw_no}회
              </h1>
            </div>
            <span className="flex min-h-10 items-center gap-1.5 rounded-full bg-[#EFF3F0] px-3 text-[13px] font-bold text-[#56625B]">
              <CheckCircle2 aria-hidden="true" size={17} className="text-[#0F8A5F]" />
              추첨 완료
            </span>
          </div>

          <p className="mt-2 flex items-center gap-1.5 text-[14px] text-[#68736D]">
            <CalendarDays aria-hidden="true" size={17} />
            {draw.draw_date}
          </p>

          <div className="mt-6 grid grid-cols-7 gap-1.5" aria-label="당첨 번호">
            {draw.winning_numbers.map((number) => (
              <LottoBall key={number} number={number} />
            ))}
            <LottoBall number={draw.bonus_number} label="보너스" />
          </div>
        </section>

        {/* WINNERS BREAKDOWN */}
        <section className="mt-7" aria-labelledby="winner-title">
          <p className="text-[14px] font-extrabold text-[#0F8A5F]">공식 등수별 결과</p>
          <h2 id="winner-title" className="text-[22px] font-black tracking-[-0.03em]">
            등수별 당첨자 수
          </h2>

          <div className="mt-3 overflow-hidden rounded-2xl border border-[#DFE4DF] bg-white">
            {ranks.map((rank, index) => {
              const count = draw.winner_counts[String(rank)] || 0;
              return (
                <div
                  key={rank}
                  className={`grid min-h-[74px] grid-cols-[auto_1fr] items-center gap-3 px-4 ${
                    index ? "border-t border-[#E9ECE9]" : ""
                  }`}
                >
                  <RankBadge rank={rank} />
                  <div>
                    <p className="text-[20px] font-black tabular-nums">
                      {count.toLocaleString("ko-KR")}명
                    </p>
                    <p className="text-[13px] text-[#68736D]">공식 당첨자 기준</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SOURCE URL & TIMESTAMPS */}
        <section className="mt-4 rounded-xl border border-[#E1E7E3] bg-[#F7F9F8] p-3.5 text-[13px] text-[#556159]">
          <div className="flex items-center gap-1.5 font-bold text-[#17211C]">
            <ShieldCheck size={16} className="text-[#0F8A5F]" />
            <span>검증된 공식 원천 정보</span>
          </div>
          <p className="mt-1">수집 기준시각: {draw.collected_at.slice(0, 19).replace("T", " ")}</p>
          <a
            href={draw.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1.5 inline-flex items-center gap-1 font-bold text-[#0F8A5F] underline"
          >
            <span>동행복권 공식 결과 바로가기</span>
            <ExternalLink size={13} />
          </a>
        </section>
      </main>
      <PageFooter />
    </>
  );
}
