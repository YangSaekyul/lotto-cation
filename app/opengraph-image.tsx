import { ImageResponse } from "next/og";

export const alt = "로또리 | 내 주변 로또 판매점 지도";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px",
          background: "#F7F8F5",
          color: "#17211C",
        }}
      >
        <div style={{ fontSize: 30, fontWeight: 800, color: "#0F8A5F" }}>LOTTO + RY</div>
        <div style={{ marginTop: 18, fontSize: 68, fontWeight: 900 }}>로또리</div>
        <div style={{ marginTop: 18, fontSize: 34, fontWeight: 700 }}>내 주변 로또 판매점과 당첨 이력 지도</div>
        <div style={{ marginTop: 28, fontSize: 24, color: "#556159" }}>최근 당첨번호 · 번호 통계 · 지역별 판매점</div>
      </div>
    ),
    size,
  );
}
