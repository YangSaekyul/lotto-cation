export const REPORT_TYPES = ["closed", "moved", "address_error", "location_error", "other"] as const;
export type ReportType = (typeof REPORT_TYPES)[number];

export type ValidatedReport = {
  storeId: string;
  reportType: ReportType;
  detail: string;
  reporterEmail?: string;
};

export type ReportValidation =
  | { ok: true; data: ValidatedReport }
  | { ok: false; message: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateStoreReport(input: unknown): ReportValidation {
  if (!input || typeof input !== "object") return { ok: false, message: "잘못된 요청입니다." };
  const record = input as Record<string, unknown>;
  if (typeof record.honeypot === "string" && record.honeypot.trim()) {
    return { ok: false, message: "요청을 처리할 수 없습니다." };
  }
  if (typeof record.storeId !== "string" || !record.storeId.trim() || record.storeId.length > 100) {
    return { ok: false, message: "유효한 판매점을 선택해 주세요." };
  }
  if (typeof record.reportType !== "string" || !REPORT_TYPES.includes(record.reportType as ReportType)) {
    return { ok: false, message: "유효한 제보 유형을 선택해 주세요." };
  }
  if (typeof record.detail !== "string") return { ok: false, message: "상세 내용을 입력해 주세요." };
  const detail = record.detail.trim();
  if (detail.length < 5 || detail.length > 1000) {
    return { ok: false, message: "상세 내용은 5자 이상 1,000자 이하로 입력해 주세요." };
  }
  let reporterEmail: string | undefined;
  if (record.reporterEmail !== undefined && record.reporterEmail !== "") {
    if (typeof record.reporterEmail !== "string") return { ok: false, message: "이메일 형식이 올바르지 않습니다." };
    reporterEmail = record.reporterEmail.trim().toLowerCase();
    if (reporterEmail.length > 254 || !EMAIL_PATTERN.test(reporterEmail)) {
      return { ok: false, message: "이메일 형식이 올바르지 않습니다." };
    }
  }
  return {
    ok: true,
    data: {
      storeId: record.storeId.trim(),
      reportType: record.reportType as ReportType,
      detail,
      reporterEmail,
    },
  };
}
