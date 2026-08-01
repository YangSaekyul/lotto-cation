import { Clock3, Flag, MapPin, Navigation, Phone, Store as StoreIcon } from "lucide-react";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { PageFooter, ProbabilityNotice } from "@/components/page-footer";
import { RankBadge } from "@/components/rank-badge";
import { getStore } from "@/lib/mock-data";

type StorePageProps = { params: Promise<{ id: string }> };

export default async function StorePage({ params }: StorePageProps) {
  const { id } = await params;
  const store = getStore(id);

  return (
    <>
      <AppHeader title="판매점 상세" backHref="/" />
      <main className="px-4 pb-3 pt-5 sm:px-6">
        <section className="rounded-2xl border border-[#DFE4DF] bg-white p-5">
          <div className="flex items-start gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8F4EF] text-[#0F8A5F]">
              <StoreIcon aria-hidden="true" size={25} />
            </span>
            <div className="min-w-0">
              <span className={`inline-flex rounded-full px-2 py-0.5 text-[13px] font-bold ${store.status === "영업 중" ? "bg-[#E8F4EF] text-[#08724D]" : "bg-[#F1F3F1] text-[#5C6761]"}`}>
                {store.status}
              </span>
              <h1 className="mt-1 text-[26px] font-black tracking-[-0.04em]">{store.name}</h1>
            </div>
          </div>
          <dl className="mt-5 space-y-3 border-t border-[#E7EBE7] pt-4 text-[15px]">
            <div className="flex gap-3"><MapPin aria-hidden="true" className="mt-0.5 shrink-0 text-[#0F8A5F]" size={20} /><div><dt className="sr-only">주소</dt><dd>{store.address}</dd></div></div>
            <div className="flex gap-3"><Clock3 aria-hidden="true" className="mt-0.5 shrink-0 text-[#0F8A5F]" size={20} /><div><dt className="sr-only">운영 시간</dt><dd>{store.hours}</dd></div></div>
            <div className="flex gap-3"><Phone aria-hidden="true" className="mt-0.5 shrink-0 text-[#0F8A5F]" size={20} /><div><dt className="sr-only">전화번호</dt><dd>{store.phone}</dd></div></div>
          </dl>
        </section>

        <button type="button" className="pressable mt-3 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#0F8A5F] px-5 text-[17px] font-extrabold text-white">
          <Navigation aria-hidden="true" size={21} />
          네이버 지도 길찾기
        </button>

        <section className="mt-7" aria-labelledby="history-title">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[14px] font-extrabold text-[#0F8A5F]">공개된 과거 기록</p>
              <h2 id="history-title" className="text-[22px] font-black tracking-[-0.03em]">당첨 이력</h2>
            </div>
            <p className="text-[15px] font-bold text-[#56625B]">총 {store.totalWins}회</p>
          </div>
          <div className="mt-3 overflow-hidden rounded-2xl border border-[#DFE4DF] bg-white">
            {store.history.map((item, index) => (
              <div key={`${item.draw}-${item.rank}`} className={`flex min-h-16 items-center gap-3 px-4 ${index ? "border-t border-[#E9ECE9]" : ""}`}>
                <RankBadge rank={item.rank} />
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold">제 {item.draw}회</p>
                  <p className="text-[14px] text-[#68736D]">{item.method ? `${item.method} 선택 · ` : ""}{item.count}건 기록</p>
                </div>
                <span className="text-[13px] font-bold text-[#7A847E]">이력</span>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-4"><ProbabilityNotice /></div>
        <Link href="/report" className="pressable mt-3 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border border-[#C9D1CB] bg-white px-5 text-[16px] font-extrabold">
          <Flag aria-hidden="true" size={20} />
          폐점·이전·정보 오류 제보
        </Link>
      </main>
      <PageFooter />
    </>
  );
}
