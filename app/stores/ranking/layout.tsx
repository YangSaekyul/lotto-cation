import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "당첨 이력 많은 로또 판매점",
  description: "공개된 공식 당첨 이력을 기준으로 1등부터 3등까지 당첨 횟수가 많은 로또 판매점을 지역별로 찾아보세요.",
  alternates: { canonical: "/stores/ranking" },
  openGraph: {
    type: "website",
    title: "당첨 이력 많은 로또 판매점 | 로또리",
    description: "공식 당첨 이력 기준으로 지역별 로또 판매점 순위를 확인하세요.",
    url: "/stores/ranking",
  },
};

export default function StoreRankingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
