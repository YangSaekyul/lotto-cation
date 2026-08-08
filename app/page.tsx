import { Suspense } from "react";
import Link from "next/link";
import { MapHome } from "@/components/map-home";

export default function HomePage() {
  return (
    <>
      <Suspense fallback={<div className="h-dvh w-full bg-[#F7F8F5]" />}>
        <MapHome />
      </Suspense>
      <section className="border-t border-[#DDE3DE] bg-[#F7F8F5] px-5 pb-32 pt-9 sm:px-8" aria-labelledby="seo-intro-title">
        <p className="text-[13px] font-extrabold text-[#0F8A5F]">로또리 LottoRy</p>
        <h2 id="seo-intro-title" className="mt-1 text-[22px] font-black tracking-[-0.04em] text-[#17211C]">
          내 주변 로또 판매점과 당첨 이력 찾기
        </h2>
        <p className="mt-3 text-[15px] leading-7 text-[#556159]">
          로또리는 현재 위치를 기준으로 가까운 로또 판매점을 지도에서 찾고, 공개된 1~5등 당첨 이력을 확인할 수 있는 무료 정보 서비스입니다.
          최근 로또 당첨번호와 기간별 번호 통계도 함께 제공합니다.
        </p>
        <div className="mt-5 grid gap-2 sm:grid-cols-3" aria-label="로또리 주요 정보">
          <Link href="/draw/latest" className="rounded-xl border border-[#DDE3DE] bg-white px-4 py-3 text-[14px] font-extrabold text-[#17211C]">
            최근 로또 당첨번호
          </Link>
          <Link href="/stats" className="rounded-xl border border-[#DDE3DE] bg-white px-4 py-3 text-[14px] font-extrabold text-[#17211C]">
            로또 번호 통계
          </Link>
          <Link href="/stores/ranking" className="rounded-xl border border-[#DDE3DE] bg-white px-4 py-3 text-[14px] font-extrabold text-[#17211C]">
            당첨 이력 많은 판매점
          </Link>
        </div>
        <p className="mt-5 text-[13px] leading-6 text-[#68736D]">
          과거 당첨 이력과 번호 통계는 미래 당첨 확률을 높이지 않습니다. 동행복권과 무관한 비공식 정보 서비스입니다.
        </p>
      </section>
    </>
  );
}
