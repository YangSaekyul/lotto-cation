import { ChevronLeft, Ticket } from "lucide-react";
import Link from "next/link";

type AppHeaderProps = {
  title?: string;
  backHref?: string;
  eyebrow?: string;
};

export function AppHeader({ title = "로또리", backHref, eyebrow }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex min-h-16 items-center gap-3 border-b border-[#DFE4DF] bg-[#F7F8F5]/92 px-4 pb-2.5 pt-[max(0.75rem,env(safe-area-inset-top))] shadow-[0_1px_3px_rgba(0,0,0,0.03)] backdrop-blur-md sm:px-6">
      {backHref ? (
        <Link
          href={backHref}
          aria-label="이전 화면"
          className="pressable -ml-1 flex size-11 items-center justify-center rounded-full text-[#17211C] hover:bg-[#E9ECE8] active:bg-[#DFE4DF]"
        >
          <ChevronLeft aria-hidden="true" size={26} />
        </Link>
      ) : (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#0F8A5F] text-white shadow-sm">
          <Ticket aria-hidden="true" size={22} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        {eyebrow ? <p className="text-[12px] font-extrabold text-[#0F8A5F]">{eyebrow}</p> : null}
        <p className="truncate text-[19px] font-black tracking-[-0.03em] text-[#17211C]">{title}</p>
      </div>
    </header>
  );
}
