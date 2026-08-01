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
};

export function LottoBall({ number, label }: LottoBallProps) {
  const toneIndex = number <= 10 ? 0 : number <= 20 ? 1 : number <= 30 ? 2 : number <= 40 ? 3 : 4;

  return (
    <div className="flex min-w-0 flex-col items-center gap-1.5">
      <span className={`flex aspect-square w-full max-w-14 items-center justify-center rounded-full text-[20px] font-black ${tones[toneIndex]}`}>
        {number}
      </span>
      {label ? <span className="text-[12px] font-bold text-[#68736D]">{label}</span> : null}
    </div>
  );
}
