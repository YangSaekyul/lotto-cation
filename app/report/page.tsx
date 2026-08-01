import { CheckCircle2, Flag, MapPin } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { PageFooter } from "@/components/page-footer";

const reportTypes = ["폐점", "이전", "주소 오류"];

export default function ReportPage() {
  return (
    <>
      <AppHeader title="정보 제보" backHref="/store/green-lottery" />
      <main className="px-4 pb-3 pt-5 sm:px-6">
        <div className="flex items-start gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8F4EF] text-[#0F8A5F]"><Flag aria-hidden="true" size={24} /></span>
          <div>
            <h1 className="text-[24px] font-black tracking-[-0.04em]">어떤 정보가 다른가요?</h1>
            <p className="mt-1 text-[15px] text-[#68736D]">확인 후 판매점 정보에 반영할 수 있도록 알려주세요.</p>
          </div>
        </div>

        <section className="mt-5 rounded-2xl border border-[#DFE4DF] bg-white p-4">
          <p className="text-[14px] font-bold text-[#68736D]">제보 대상</p>
          <div className="mt-2 flex gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#EFF5F1] text-[#0F8A5F]"><MapPin aria-hidden="true" size={21} /></span>
            <div><p className="text-[18px] font-extrabold">그린복권방</p><p className="text-[14px] text-[#68736D]">서울 마포구 월드컵로 112</p></div>
          </div>
        </section>

        <form className="mt-5 space-y-5" aria-label="판매점 정보 제보 목업">
          <fieldset>
            <legend className="text-[16px] font-extrabold">제보 유형</legend>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {reportTypes.map((type, index) => (
                <label key={type} className={`pressable flex min-h-14 cursor-pointer items-center justify-center rounded-2xl border text-[16px] font-extrabold ${index === 0 ? "border-[#0F8A5F] bg-[#E8F4EF] text-[#08724D]" : "border-[#D8DED9] bg-white"}`}>
                  <input type="radio" name="reportType" defaultChecked={index === 0} className="sr-only" />{type}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="block">
            <span className="text-[16px] font-extrabold">상세 내용 <span className="font-medium text-[#7A847E]">(선택)</span></span>
            <textarea rows={5} placeholder="예: 지난달부터 영업하지 않는 것으로 보여요." className="mt-2 w-full resize-none rounded-2xl border border-[#D5DDD6] bg-white p-4 text-[16px] placeholder:text-[#98A09B]" />
          </label>

          <label className="block">
            <span className="text-[16px] font-extrabold">연락받을 이메일 <span className="font-medium text-[#7A847E]">(선택)</span></span>
            <input type="email" inputMode="email" placeholder="example@email.com" className="mt-2 min-h-14 w-full rounded-2xl border border-[#D5DDD6] bg-white px-4 text-[16px] placeholder:text-[#98A09B]" />
          </label>

          <button type="button" className="pressable flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#0F8A5F] px-5 text-[17px] font-extrabold text-white">
            <CheckCircle2 aria-hidden="true" size={21} />
            제보 내용 확인
          </button>
          <p className="text-center text-[13px] leading-5 text-[#7A847E]">현재 화면은 디자인 목업이며 제보가 실제 전송되지 않습니다.</p>
        </form>
      </main>
      <PageFooter />
    </>
  );
}
