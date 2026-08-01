import { CalendarDays, CheckCircle2 } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { LottoBall } from "@/components/lotto-balls";
import { PageFooter } from "@/components/page-footer";
import { RankBadge } from "@/components/rank-badge";
import { latestDraw } from "@/lib/mock-data";

export default function LatestDrawPage() {
  return (
    <>
      <AppHeader title="최근 결과" eyebrow="직전 추첨 회차" />
      <main className="px-4 pb-3 pt-5 sm:px-6">
        <section className="rounded-2xl border border-[#DFE4DF] bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[14px] font-bold text-[#68736D]">로또 6/45</p>
              <h1 className="mt-0.5 text-[28px] font-black tracking-[-0.04em]">제 {latestDraw.draw}회</h1>
            </div>
            <span className="flex min-h-10 items-center gap-1.5 rounded-full bg-[#EFF3F0] px-3 text-[13px] font-bold text-[#56625B]">
              <CheckCircle2 aria-hidden="true" size={17} className="text-[#0F8A5F]" />
              추첨 완료
            </span>
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-[14px] text-[#68736D]"><CalendarDays aria-hidden="true" size={17} />{latestDraw.date}</p>
          <div className="mt-6 grid grid-cols-7 gap-1.5" aria-label="당첨 번호">
            {latestDraw.numbers.map((number) => <LottoBall key={number} number={number} />)}
            <LottoBall number={latestDraw.bonus} label="보너스" />
          </div>
        </section>

        <section className="mt-7" aria-labelledby="winner-title">
          <p className="text-[14px] font-extrabold text-[#0F8A5F]">등수별 결과</p>
          <h2 id="winner-title" className="text-[22px] font-black tracking-[-0.03em]">당첨자 수</h2>
          <div className="mt-3 overflow-hidden rounded-2xl border border-[#DFE4DF] bg-white">
            {latestDraw.winners.map((winner, index) => (
              <div key={winner.rank} className={`grid min-h-[74px] grid-cols-[auto_1fr_auto] items-center gap-3 px-4 ${index ? "border-t border-[#E9ECE9]" : ""}`}>
                <RankBadge rank={winner.rank} />
                <div>
                  <p className="text-[20px] font-black tabular-nums">{winner.count.toLocaleString("ko-KR")}명</p>
                  <p className="text-[13px] text-[#68736D]">당첨자 기준</p>
                </div>
                <p className="text-right text-[14px] font-bold text-[#4F5B54]">{winner.prize}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <PageFooter />
    </>
  );
}
