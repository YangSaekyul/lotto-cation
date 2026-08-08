import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "로또 번호 통계",
  description: "최근 1개월부터 5년까지 공식 로또 당첨번호의 기간별 출현 횟수와 최다 출현 번호를 확인하세요.",
  alternates: { canonical: "/stats" },
  openGraph: {
    type: "website",
    title: "로또 번호 통계 | 기간별 출현 횟수",
    description: "공식 로또 당첨번호의 기간별 출현 횟수와 최다 출현 번호를 확인하세요.",
    url: "/stats",
  },
};

export default function StatsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
