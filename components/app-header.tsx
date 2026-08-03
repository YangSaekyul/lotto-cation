import { ChevronLeft, Ticket } from "lucide-react";
import Link from "next/link";

type AppHeaderProps = {
  title?: string;
  backHref?: string;
  eyebrow?: string;
};

export function AppHeader({ title = "로또리", backHref, eyebrow }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex min-h-16 items-center gap-3 border-b border-[#DFE4DF] bg-[#F7F8F5]/95 px-4 backdrop-blur-sm sm:px-6">
      {backHref ? (
        <Link
          href={backHref}
          aria-label="이전 화면"
          className="pressable -ml-1 flex size-12 items-center justify-center rounded-full hover:bg-[#E9ECE8]"
        >
          <ChevronLeft aria-hidden="true" size={26} />
        </Link>
      ) : (
        <span className="flex size-10 items-center justify-center rounded-xl bg-[#0F8A5F] text-white">
          <Ticket aria-hidden="true" size={22} />
        </span>
      )}
      <div className="min-w-0">
        {eyebrow ? <p className="text-[13px] font-bold text-[#0F8A5F]">{eyebrow}</p> : null}
        <p className="truncate text-[20px] font-extrabold tracking-[-0.02em]">{title}</p>
      </div>
    </header>
  );
}
