"use client";

import { BarChart3, Map, Medal, TicketCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "지도", icon: Map },
  { href: "/draw/latest", label: "최근 결과", icon: TicketCheck },
  { href: "/stats", label: "번호 통계", icon: BarChart3 },
  { href: "/stores/ranking", label: "최다 판매점", icon: Medal },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="주요 메뉴"
      className="fixed inset-x-0 bottom-0 z-50 mx-auto grid w-full max-w-3xl grid-cols-4 border-t border-[#DCE2DD] bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-4px_16px_rgba(0,0,0,0.04)] backdrop-blur-md"
    >
      {items.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`pressable flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[12px] font-extrabold transition-all ${
              active
                ? "bg-[#E8F4EF] text-[#0F8A5F]"
                : "text-[#68736D] hover:bg-[#F4F6F4] hover:text-[#17211C]"
            }`}
          >
            <Icon aria-hidden="true" size={21} strokeWidth={active ? 2.5 : 2} />
            <span className="leading-none">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
