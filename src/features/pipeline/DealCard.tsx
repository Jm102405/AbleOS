import {
  CheckCircle2Icon,
  ChevronRightIcon,
  CircleAlertIcon,
} from "lucide-react";
import type { Deal } from "./types";

type DealCardProps = {
  deal: Deal;
  onClick: () => void;
};

export function DealCard({ deal, onClick }: DealCardProps) {
  const hasMissingDocuments = deal.missingDocs.length > 0;

  return (
    <button
      aria-label={`View ${deal.property}`}
      className="group w-full rounded-2xl border border-[#DCE4EE] bg-white px-4 py-4 text-left shadow-[0_5px_14px_rgba(30,58,138,0.055)] transition-colors hover:border-[#9CC6FF] focus:outline-none focus:ring-2 focus:ring-[#3B82C4] focus:ring-offset-2"
      onClick={onClick}
      type="button"
    >
      <div className="flex items-start gap-3">
        <div className="h-9 w-1 shrink-0 rounded-full bg-[#1E3A8A]" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-[14px] font-extrabold leading-snug tracking-[-0.02em] text-[#1A1A2E]">
                {deal.property}
              </h3>
              <p className="mt-1 text-[11px] font-medium text-[#6B7A90]">
                {deal.market}
              </p>
            </div>
            <ChevronRightIcon
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-[#93A3B8] transition-transform group-hover:translate-x-0.5"
              size={18}
            />
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#EDF1F5] pt-3">
            <div>
              <p className="text-[10px] font-bold text-[#718096]">
                {deal.birdDog.split(" ")[0]}
              </p>
              <p className="mt-0.5 text-[15px] font-extrabold tracking-[-0.04em] text-[#1E3A8A]">
                {deal.value}
              </p>
            </div>

            {hasMissingDocuments ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#FFF1E9] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.04em] text-[#D95717]">
                <CircleAlertIcon aria-hidden="true" size={11} />
                {deal.missingDocs.length} missing
              </span>
            ) : (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#EDF8F5] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.04em] text-[#0F766E]">
                <CheckCircle2Icon aria-hidden="true" size={11} />
                Clear
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
