import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BottomNav } from "@/components/bottom-nav";

export const metadata: Metadata = {
  title: { default: "로또케이션", template: "%s | 로또케이션" },
  description: "가까운 로또 판매점과 과거 당첨 이력을 살펴보는 모바일 정보 서비스",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F7F8F5",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <div className="mx-auto min-h-dvh w-full max-w-3xl overflow-x-clip bg-[#F7F8F5] sm:border-x sm:border-[#DDE3DE]">
          {children}
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
