import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "기간별 로또 번호 TOP 6",
  description: "최근 1개월, 3개월, 6개월, 1년 기준으로 출현 횟수가 많은 로또 번호 TOP 6를 비교하세요.",
  alternates: { canonical: "/stats/top" },
  openGraph: {
    type: "website",
    title: "기간별 로또 번호 TOP 6 | 로또리",
    description: "기간별 공식 로또 당첨번호 출현 상위 6개를 비교하세요.",
    url: "/stats/top",
  },
};

export default function StatsTopLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
