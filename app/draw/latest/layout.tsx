import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "최근 로또 당첨번호",
  description: "동행복권 공식 데이터를 기준으로 최신 로또 6/45 당첨번호와 보너스 번호, 등수별 당첨자 수를 확인하세요.",
  alternates: { canonical: "/draw/latest" },
  openGraph: {
    type: "website",
    title: "최근 로또 당첨번호 | 로또리",
    description: "최신 로또 6/45 당첨번호와 등수별 당첨자 수를 확인하세요.",
    url: "/draw/latest",
  },
};

export default function LatestDrawLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
