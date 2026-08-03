import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { PageFooter } from "@/components/page-footer";

export default function PrivacyPage() {
  return (
    <>
      <AppHeader title="개인정보 처리 안내" backHref="/" />
      <main className="px-4 pb-4 pt-5 text-[15px] leading-7 text-[#43534A] sm:px-6">
        <h1 className="text-[24px] font-black text-[#17211C]">개인정보 처리 안내</h1>
        <p className="mt-3">로또리는 판매점 정보 제보 처리에 필요한 최소 정보만 사용합니다.</p>
        <section className="mt-5 space-y-2 rounded-2xl border border-[#DFE4DF] bg-white p-4">
          <h2 className="font-extrabold text-[#17211C]">처리 항목과 목적</h2>
          <p>선택 입력한 이메일은 제보 확인 연락에만 사용합니다. 스팸 방지를 위해 IP 주소를 복원할 수 없는 해시로 변환하여 처리합니다.</p>
          <p>제보 내용, 이메일, IP 해시는 제보 검토 완료 후 최대 1년간 보관한 뒤 삭제합니다.</p>
        </section>
        <section className="mt-4 space-y-2 rounded-2xl border border-[#DFE4DF] bg-white p-4">
          <h2 className="font-extrabold text-[#17211C]">위치정보</h2>
          <p>현재 위치는 가까운 판매점을 계산할 때만 사용하며 계정과 연결하거나 별도 저장하지 않습니다. 위치 권한을 거부해도 지역 검색을 사용할 수 있습니다.</p>
        </section>
        <section className="mt-4 space-y-2 rounded-2xl border border-[#DFE4DF] bg-white p-4">
          <h2 className="font-extrabold text-[#17211C]">문의 및 삭제 요청</h2>
          <p>
            제보 내용 확인, 개인정보 삭제 요청 및 서비스 문의는{" "}
            <a className="font-bold text-[#08783F] underline" href="mailto:seoulohso@gmail.com">
              seoulohso@gmail.com
            </a>
            으로 접수할 수 있습니다.
          </p>
        </section>
        <p className="mt-5 text-[13px] text-[#68736D]">시행 예정일: 공개 서비스 정식 출시일</p>
        <Link href="/" className="mt-5 inline-flex min-h-12 items-center font-bold text-[#0F8A5F] underline">홈으로 돌아가기</Link>
      </main>
      <PageFooter />
    </>
  );
}
