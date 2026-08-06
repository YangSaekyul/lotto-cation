const tones = [
  "bg-[#F4C84A] text-[#4F3A00]",
  "bg-[#5B91C7] text-white",
  "bg-[#D66767] text-white",
  "bg-[#8D9290] text-white",
  "bg-[#55A56D] text-white",
];

type LottoBallProps = {
  number: number;
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZE_STYLES = {
  sm: "size-8 text-[15px]",
  md: "size-11 sm:size-12 text-[19px] sm:text-[21px]",
  lg: "size-12 sm:size-14 text-[22px] sm:text-[25px]",
};

export function LottoBall({ number, label, size = "md", className = "" }: LottoBallProps) {
  const toneIndex = number <= 10 ? 0 : number <= 20 ? 1 : number <= 30 ? 2 : number <= 40 ? 3 : 4;

  return (
    <div className="flex flex-col items-center justify-center">
      <span
        className={`flex shrink-0 aspect-square items-center justify-center rounded-full font-black shadow-md ${SIZE_STYLES[size]} ${tones[toneIndex]} ${className}`}
      >
        {number}
      </span>
      {label ? <span className="mt-1 text-[12px] font-bold text-[#68736D]">{label}</span> : null}
    </div>
  );
}
