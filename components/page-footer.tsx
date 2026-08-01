import { Info } from "lucide-react";

export function ProbabilityNotice() {
  return (
    <aside className="flex gap-3 rounded-2xl border border-[#D9E6DE] bg-[#EFF6F1] p-4 text-[#43534A]">
      <Info aria-hidden="true" className="mt-0.5 shrink-0 text-[#0F8A5F]" size={20} />
      <p className="text-[15px] leading-6">
        과거 당첨 이력과 번호 통계는 향후 당첨 확률을 높이지 않습니다.
      </p>
    </aside>
  );
}

export function PageFooter() {
  return (
    <footer className="px-4 pb-24 pt-5 text-center text-[13px] font-medium text-[#7A847E] sm:px-6">
      동행복권과 무관한 정보 서비스
    </footer>
  );
}
