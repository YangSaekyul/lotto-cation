import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { getStoreById } from "@/lib/db";
import { persistReport } from "@/lib/report-storage";
import { validateStoreReport } from "@/lib/report-validation";

export async function POST(request: Request) {
  try {
    const validation = validateStoreReport(await request.json());
    if (!validation.ok) return NextResponse.json({ error: validation.message }, { status: 400 });
    const report = validation.data;
    if (!getStoreById(report.storeId)) {
      return NextResponse.json({ error: "존재하지 않는 판매점입니다." }, { status: 400 });
    }

    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const salt = process.env.REPORT_HASH_SALT;
    if (!salt) {
      return NextResponse.json({ error: "제보 기능이 아직 설정되지 않았습니다." }, { status: 503 });
    }
    const ipHash = createHash("sha256").update(`${salt}:${forwarded}`).digest("hex");
    const result = await persistReport({
      store_id: report.storeId,
      report_type: report.reportType,
      detail: report.detail,
      reporter_email: report.reporterEmail,
      ip_hash: ipHash,
      status: "pending",
    });
    if (!result.ok) return NextResponse.json({ error: result.message }, { status: 503 });
    return NextResponse.json({ success: true, message: "제보가 접수되었습니다. 검토 후 반영됩니다." });
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
}
