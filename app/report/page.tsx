"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Flag, MapPin, AlertCircle } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { PageFooter } from "@/components/page-footer";
import type { StoreRecord } from "@/lib/db";

const REPORT_TYPES = [
  { id: "closed", label: "폐점" },
  { id: "moved", label: "이전" },
  { id: "address_error", label: "주소 오류" },
  { id: "location_error", label: "위치 오류" },
  { id: "other", label: "기타" },
];

function ReportFormContent() {
  const searchParams = useSearchParams();
  const storeId = searchParams.get("storeId") || "";

  const [store, setStore] = useState<StoreRecord | null>(null);
  const [reportType, setReportType] = useState<string>("closed");
  const [detail, setDetail] = useState<string>("");
  const [reporterEmail, setReporterEmail] = useState<string>("");
  const [honeypot, setHoneypot] = useState<string>("");
  const [privacyAgreed, setPrivacyAgreed] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!storeId) return;
    async function fetchStore() {
      try {
        const res = await fetch(`/api/stores/${storeId}`);
        if (res.ok) {
          const data = await res.json();
          setStore(data.store);
        }
      } catch (err) {
        console.error("Failed to fetch store details for report:", err);
      }
    }
    fetchStore();
  }, [storeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (honeypot) {
      // Anti-bot honeypot filled
      return;
    }

    if (!detail.trim() || detail.trim().length < 5) {
      setErrorMessage("제보 상세 내용을 5자 이상 작성해 주세요.");
      return;
    }
    if (!storeId) {
      setErrorMessage("제보할 판매점을 먼저 선택해 주세요.");
      return;
    }
    if (!privacyAgreed) {
      setErrorMessage("개인정보 처리 안내에 동의해 주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: storeId || undefined,
          reportType,
          detail,
          reporterEmail: reporterEmail || undefined,
          honeypot,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitted(true);
      } else {
        setErrorMessage(data.error || "제보 제출 중 오류가 발생했습니다.");
      }
    } catch (err) {
      console.error("Error submitting report:", err);
      setErrorMessage("네트워크 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="px-4 pb-3 pt-5 sm:px-6">
      <div className="flex items-start gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8F4EF] text-[#0F8A5F]">
          <Flag aria-hidden="true" size={24} />
        </span>
        <div>
          <h1 className="text-[24px] font-black tracking-[-0.04em]">어떤 정보가 다른가요?</h1>
          <p className="mt-1 text-[15px] text-[#68736D]">
            확인 후 판매점 정보에 반영할 수 있도록 알려주세요.
          </p>
        </div>
      </div>

      {store && (
        <section className="mt-5 rounded-2xl border border-[#DFE4DF] bg-white p-4">
          <p className="text-[14px] font-bold text-[#68736D]">제보 대상 판매점</p>
          <div className="mt-2 flex gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#EFF5F1] text-[#0F8A5F]">
              <MapPin aria-hidden="true" size={21} />
            </span>
            <div>
              <p className="text-[18px] font-extrabold text-[#17211C]">{store.name}</p>
              <p className="text-[14px] text-[#68736D]">{store.address}</p>
            </div>
          </div>
        </section>
      )}

      {submitted ? (
        <section className="mt-6 rounded-2xl border border-[#CBE3D7] bg-[#EEF7F2] p-6 text-center">
          <CheckCircle2 size={40} className="mx-auto text-[#0F8A5F] mb-3" />
          <h2 className="text-[20px] font-extrabold text-[#17211C]">제보가 접수되었습니다!</h2>
          <p className="mt-2 text-[14px] font-medium text-[#556159]">
            제출해주신 내용은 확인 후 데이터 검증을 거쳐 `pending` 상태로 보관되며, 교차 검증 후 반영됩니다. 감사합니다.
          </p>
        </section>
      ) : (
        <form onSubmit={handleSubmit} className="mt-5 space-y-5" aria-label="판매점 정보 제보">
          {/* Honeypot field (hidden from real users) */}
          <input
            type="text"
            name="website_url_hp"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
          />

          <fieldset>
            <legend className="text-[16px] font-extrabold text-[#17211C]">제보 유형</legend>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {REPORT_TYPES.map((item) => (
                <label
                  key={item.id}
                  className={`pressable flex min-h-14 cursor-pointer items-center justify-center rounded-2xl border text-[15px] font-extrabold transition-colors ${
                    reportType === item.id
                      ? "border-[#0F8A5F] bg-[#E8F4EF] text-[#08724D]"
                      : "border-[#D8DED9] bg-white text-[#17211C]"
                  }`}
                >
                  <input
                    type="radio"
                    name="reportType"
                    value={item.id}
                    checked={reportType === item.id}
                    onChange={() => setReportType(item.id)}
                    className="sr-only"
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="block">
            <span className="text-[16px] font-extrabold text-[#17211C]">
              상세 내용 <span className="text-[#E54B4B]">*</span>
            </span>
            <textarea
              rows={4}
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="예: 해당 위치의 판매점이 폐점했거나 다른 건물로 이전되었습니다."
              className="mt-2 w-full resize-none rounded-2xl border border-[#D5DDD6] bg-white p-4 text-[16px] placeholder:text-[#98A09B] outline-none focus:border-[#0F8A5F]"
              required
            />
          </label>

          <label className="block">
            <span className="text-[16px] font-extrabold text-[#17211C]">
              연락받을 이메일 <span className="font-medium text-[#7A847E]">(선택)</span>
            </span>
            <input
              type="email"
              inputMode="email"
              value={reporterEmail}
              onChange={(e) => setReporterEmail(e.target.value)}
              placeholder="example@email.com"
              className="mt-2 min-h-14 w-full rounded-2xl border border-[#D5DDD6] bg-white px-4 text-[16px] placeholder:text-[#98A09B] outline-none focus:border-[#0F8A5F]"
            />
          </label>

          <label className="flex min-h-12 items-start gap-3 rounded-2xl border border-[#D5DDD6] bg-white p-3 text-[14px] text-[#43534A]">
            <input
              type="checkbox"
              checked={privacyAgreed}
              onChange={(event) => setPrivacyAgreed(event.target.checked)}
              className="mt-1 size-5 accent-[#0F8A5F]"
              required
            />
            <span>
              제보 처리 목적의 개인정보 처리에 동의합니다. 이메일은 선택 항목입니다. {" "}
              <Link href="/privacy" className="font-bold text-[#0F8A5F] underline">자세히 보기</Link>
            </span>
          </label>

          {errorMessage && (
            <div className="flex items-center gap-2 rounded-xl bg-[#FDF2F2] border border-[#F87171] p-3 text-[14px] font-bold text-[#DC2626]">
              <AlertCircle size={18} />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !storeId}
            className="pressable flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#0F8A5F] px-5 text-[17px] font-extrabold text-white shadow-sm disabled:opacity-50"
          >
            <CheckCircle2 aria-hidden="true" size={21} />
            {submitting ? "제출하는 중..." : "제보 내용 제출하기"}
          </button>
          <p className="text-center text-[13px] leading-5 text-[#7A847E]">
            제보해주신 정보는 관리자 검토 후 `pending` 상태로 기록되며 데이터 수정을 거쳐 반영됩니다.
          </p>
        </form>
      )}
    </main>
  );
}

export default function ReportPage() {
  return (
    <>
      <AppHeader title="정보 제보" backHref="/" />
      <Suspense fallback={<div className="p-6 text-center">로딩 중...</div>}>
        <ReportFormContent />
      </Suspense>
      <PageFooter />
    </>
  );
}
