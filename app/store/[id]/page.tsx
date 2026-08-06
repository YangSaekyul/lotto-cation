import { Clock3, Flag, MapPin, Navigation, Phone, Store as StoreIcon, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { PageFooter, ProbabilityNotice } from "@/components/page-footer";
import { RankBadge } from "@/components/rank-badge";
import { StoreMiniMap } from "@/components/store-mini-map";
import { getDrawDateMap, getStoreById, type WinRank } from "@/lib/db";

type StorePageProps = { params: Promise<{ id: string }> };

export default async function StorePage({ params }: StorePageProps) {
  const { id } = await params;
  const store = getStoreById(id);
  const drawDateMap = getDrawDateMap();

  if (!store) {
    notFound();
  }

  // Construct Naver Map directions URL
  let directionsUrl = `https://map.naver.com/v5/search/${encodeURIComponent(store.name + " " + store.address)}`;
  if (store.latitude && store.longitude) {
    directionsUrl = `https://map.naver.com/v5/directions/-/${store.latitude},${store.longitude},${encodeURIComponent(store.name)}/-/walk`;
  }

  const ranks: WinRank[] = [1, 2, 3, 4, 5];

  return (
    <>
      <AppHeader title="판매점 상세" backHref="/" />
      <main className="px-4 pb-3 pt-5 sm:px-6">
        {/* STORE OVERVIEW CARD */}
        <section className="rounded-2xl border border-[#DFE4DF] bg-white p-5">
          <div className="flex items-start gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8F4EF] text-[#0F8A5F]">
              <StoreIcon aria-hidden="true" size={25} />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-[13px] font-extrabold ${
                    store.status === "좌표 확인"
                      ? "bg-[#E8F4EF] text-[#08724D]"
                      : "bg-[#F1F3F1] text-[#5C6761]"
                  }`}
                >
                  {store.status}
                </span>
                {store.geocode_status === "official_verified" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#EFF6FF] px-2.5 py-0.5 text-[12px] font-extrabold text-[#1D4ED8]">
                    <ShieldCheck size={14} /> 공식 좌표 검증
                  </span>
                )}
              </div>
              <h1 className="mt-1.5 text-[26px] font-black tracking-[-0.04em]">{store.name}</h1>
            </div>
          </div>

          <dl className="mt-5 space-y-3 border-t border-[#E7EBE7] pt-4 text-[15px]">
            <div className="flex gap-3">
              <MapPin aria-hidden="true" className="mt-0.5 shrink-0 text-[#0F8A5F]" size={20} />
              <div>
                <dt className="sr-only">주소</dt>
                <dd className="font-bold text-[#17211C]">{store.address}</dd>
              </div>
            </div>
            <div className="flex gap-3">
              <Clock3 aria-hidden="true" className="mt-0.5 shrink-0 text-[#0F8A5F]" size={20} />
              <div>
                <dt className="sr-only">운영 시간</dt>
                <dd className="text-[#556159]">{store.hours}</dd>
              </div>
            </div>
            <div className="flex gap-3">
              <Phone aria-hidden="true" className="mt-0.5 shrink-0 text-[#0F8A5F]" size={20} />
              <div>
                <dt className="sr-only">데이터 기준시각</dt>
                <dd className="text-[#556159]">{store.updated_at}</dd>
              </div>
            </div>
          </dl>
        </section>

        {/* STORE MINI MAP */}
        <StoreMiniMap store={store} />

        {/* RANK SUMMARY */}
        <section className="mt-6 rounded-2xl border border-[#DFE4DF] bg-white p-4">
          <h2 className="text-[16px] font-black text-[#17211C]">등수별 당첨 횟수 요약</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {ranks.map((rank) => {
              const count = store.rankCounts[rank] || 0;
              return <RankBadge key={rank} rank={rank} count={count} />;
            })}
          </div>
        </section>

        {/* WINNING HISTORY LIST */}
        <section className="mt-7" aria-labelledby="history-title">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[14px] font-extrabold text-[#0F8A5F]">공개된 공식 기록</p>
              <h2 id="history-title" className="text-[22px] font-black tracking-[-0.03em]">
                최근 당첨 이력
              </h2>
            </div>
            <p className="text-[15px] font-bold text-[#56625B]">총 {store.totalWins}회</p>
          </div>

          <div className="mt-3 overflow-hidden rounded-2xl border border-[#DFE4DF] bg-white">
            {store.history.length === 0 ? (
              <div className="p-6 text-center text-[14px] text-[#68736D]">
                등록된 당첨 이력이 없습니다.
              </div>
            ) : (
              store.history.slice(0, 5).map((item, index) => (
                <div
                  key={`${item.draw}-${item.rank}-${index}`}
                  className={`flex min-h-16 items-center gap-3 px-4 ${
                    index ? "border-t border-[#E9ECE9]" : ""
                  }`}
                >
                  <RankBadge rank={item.rank} />
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold text-[#17211C]">
                      제 {item.draw}회
                      {drawDateMap[item.draw] && (
                        <span className="ml-1.5 font-bold text-[#68736D] text-[14px]">
                          ({drawDateMap[item.draw]})
                        </span>
                      )}
                    </p>
                    <p className="text-[14px] text-[#68736D]">
                      {item.source === "donghaeng_official"
                        ? "동행복권 공식 1~5등 수집 기록"
                        : "1·2등 이력 수집 기록"}
                    </p>
                  </div>
                  <span className="text-[13px] font-bold text-[#7A847E]">공식</span>
                </div>
              ))
            )}
          </div>
          {store.history.length > 5 && (
            <p className="mt-2 text-center text-[13px] text-[#68736D]">
              최근 5건만 표시합니다. 전체 누적 횟수는 위 요약을 확인해 주세요.
            </p>
          )}
        </section>

        <div className="mt-4">
          <ProbabilityNotice />
        </div>

        <Link
          href={`/report?storeId=${store.id}`}
          className="pressable mt-3 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border border-[#C9D1CB] bg-white px-5 text-[16px] font-extrabold text-[#17211C]"
        >
          <Flag aria-hidden="true" size={20} />
          폐점·이전·정보 오류 제보
        </Link>
      </main>
      <PageFooter />
    </>
  );
}
