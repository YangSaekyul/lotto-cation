import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BottomNav } from "@/components/bottom-nav";

const SITE_URL = "https://lotto-cation.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "로또리 | 내 주변 로또 판매점 지도", template: "%s | 로또리" },
  description: "현재 위치와 지도 화면을 기준으로 로또 판매점을 찾고 과거 1~5등 당첨 이력을 확인하는 비공식 정보 서비스",
  applicationName: "로또리",
  keywords: ["로또 판매점", "로또 지도", "주변 로또 판매점", "로또 당첨 판매점", "로또리"],
  alternates: { canonical: "/" },
  icons: { icon: "/icon.svg" },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: SITE_URL,
    siteName: "로또리",
    title: "로또리 | 내 주변 로또 판매점 지도",
    description: "현재 위치와 지도 화면을 기준으로 판매점과 과거 당첨 이력을 확인하세요.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0F8A5F",
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "로또리",
  alternateName: "LottoRi",
  url: SITE_URL,
  applicationCategory: "MapApplication",
  operatingSystem: "Web",
  inLanguage: "ko-KR",
  description: "현재 위치와 지도 화면을 기준으로 로또 판매점과 과거 당첨 이력을 제공하는 비공식 정보 서비스",
  isAccessibleForFree: true,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        <div className="mx-auto min-h-dvh w-full max-w-3xl overflow-x-clip bg-[#F7F8F5] sm:border-x sm:border-[#DDE3DE]">
          {children}
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
