import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "판매점 정보 제보",
  description: "로또 판매점의 폐점, 이전, 정보 오류를 제보하는 페이지입니다.",
  robots: { index: false, follow: true },
};

export default function ReportLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
