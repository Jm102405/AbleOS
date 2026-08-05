import { ChevronRightIcon } from "lucide-react";
import type { Deal } from "./types";

type DealCardProps = {
  deal: Deal;
  onSelect: (deal: Deal) => void;
};

function timeLabel(days: number | null) {
  if (days === null) return "Not moved yet";
  if (days === 0) return "Moved today";
  if (days === 1) return "1 day in stage";
  return `${days} days in stage`;
}

export function DealCard({ deal, onSelect }: DealCardProps) {
  const stalled = typeof deal.daysInStage === "number" && deal.daysInStage >= 4;

  return (
    <button
      className="flex w-full items-center gap-3 rounded-2xl border border-[#DCE4EE] bg-white px-4 py-4 text-left shadow-[0_5px_14px_rgba(30,58,138,0.055)] transition-shadow hover:shadow-[0_8px_18px_rgba(30,58,138,0.1)] sm:px-5"
      onClick={() => onSelect(deal)}
      type="button"
    >
      <div
        className={`h-10 w-1 shrink-0 rounded-full ${
          stalled ? "bg-[#FF7832]" : "bg-[#1E3A8A]"
        }`}
      />

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-[13px] font-extrabold leading-snug tracking-[-0.015em] text-[#1A1A2E] sm:text-[14px]">
          {deal.name}
        </h3>
        <p className="mt-1 truncate text-[11px] font-medium leading-snug text-[#6B7A90] sm:text-[12px]">
          {deal.address || "No address recorded"}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-[#EEF5FF] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.06em] text-[#418BFF]">
            {deal.source}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.06em] ${
              stalled
                ? "bg-[#FFF1E9] text-[#FF7832]"
                : "bg-[#F1F5F9] text-[#8291A5]"
            }`}
          >
            {timeLabel(deal.daysInStage)}
          </span>
        </div>
      </div>

      <ChevronRightIcon
        aria-hidden="true"
        className="shrink-0 text-[#93A3B8]"
        size={16}
        strokeWidth={2.5}
      />
    </button>
  );
}
