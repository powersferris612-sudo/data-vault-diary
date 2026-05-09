import { ChevronLeft, ChevronRight } from "lucide-react";
import { MONTH_NAMES, monthKey } from "@/lib/finance-store";

type Props = {
  year: number; month: number; // month is 1..12
  onChange: (year: number, month: number) => void;
};

export function MonthYearSelector({ year, month, onChange }: Props) {
  const move = (delta: number) => {
    let m = month + delta; let y = year;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    onChange(y, m);
  };
  return (
    <div className="inline-flex items-center gap-1 card px-1 py-1">
      <button onClick={() => move(-1)} className="p-2 rounded-md hover:bg-surface-2"><ChevronLeft className="w-4 h-4" /></button>
      <div className="px-3 text-sm font-medium tabular-nums min-w-[10ch] text-center">
        {MONTH_NAMES[month - 1]} {year}
      </div>
      <button onClick={() => move(1)} className="p-2 rounded-md hover:bg-surface-2"><ChevronRight className="w-4 h-4" /></button>
    </div>
  );
}

export const mk = monthKey;
