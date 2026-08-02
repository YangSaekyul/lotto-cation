import "server-only";

export type PersistedReport = {
  store_id: string;
  report_type: string;
  detail: string;
  reporter_email?: string;
  ip_hash: string;
  status: "pending";
};

function configuration() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return { url, key };
}

function headers(key: string) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

export function isReportStorageConfigured(): boolean {
  return configuration() !== null;
}

export async function persistReport(report: PersistedReport): Promise<{ ok: boolean; message?: string }> {
  const config = configuration();
  if (!config) return { ok: false, message: "제보 저장소가 아직 설정되지 않았습니다." };

  const response = await fetch(`${config.url}/rest/v1/rpc/submit_store_report`, {
    method: "POST",
    headers: headers(config.key),
    body: JSON.stringify({
      p_store_id: report.store_id,
      p_report_type: report.report_type,
      p_detail: report.detail,
      p_reporter_email: report.reporter_email ?? "",
      p_ip_hash: report.ip_hash,
    }),
    cache: "no-store",
  });
  if (!response.ok) {
    return { ok: false, message: "제보를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }

  const result = (await response.json()) as "inserted" | "rate_limited";
  if (result === "rate_limited") {
    return { ok: false, message: "제보 요청이 너무 많습니다. 한 시간 뒤 다시 시도해 주세요." };
  }
  if (result !== "inserted") {
    return { ok: false, message: "제보 저장 결과를 확인하지 못했습니다." };
  }
  return { ok: true };
}
