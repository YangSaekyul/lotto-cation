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
      className="safe-bottom fixed inset-x-0 bottom-0 z-50 mx-auto grid w-full max-w-3xl grid-cols-4 border-t border-[#DCE2DD] bg-white/96 px-1 pt-1 backdrop-blur-sm"
    >
      {items.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`pressable flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl text-[12px] font-bold ${
              active ? "bg-[#E8F4EF] text-[#0F8A5F]" : "text-[#68736D]"
            }`}
          >
            <Icon aria-hidden="true" size={22} strokeWidth={active ? 2.4 : 2} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
