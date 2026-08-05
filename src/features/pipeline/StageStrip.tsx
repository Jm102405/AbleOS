import { stages } from "./data";
import { TERMINAL_STAGES, type DealStage } from "./types";

type StageStripProps = {
  counts: Record<string, number>;
  onSelect: (stage: DealStage) => void;
  selectedStage: DealStage;
};

export function StageStrip({
  counts,
  onSelect,
  selectedStage,
}: StageStripProps) {
  return (
    <div
      aria-label="Pipeline stages"
      className="no-scrollbar -mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1 sm:-mx-8 sm:px-8"
      role="tablist"
    >
      {stages.map((stage) => {
        const active = stage.key === selectedStage;
        const terminal = TERMINAL_STAGES.includes(stage.key);
        const count = counts[stage.key] ?? 0;

        return (
          <button
            aria-selected={active}
            className={`shrink-0 rounded-full border px-3.5 py-2 text-[11px] font-extrabold tracking-[-0.01em] transition-colors focus:outline-none focus:ring-2 focus:ring-[#3B82C4] ${
              active
                ? "border-[#1E3A8A] bg-[#1E3A8A] text-white"
                : terminal
                  ? "border-[#DCE4EE] bg-[#F8FAFC] text-[#93A3B8] hover:text-[#526176]"
                  : "border-[#DCE4EE] bg-white text-[#526176] hover:border-[#B7C7DC]"
            }`}
            key={stage.key}
            onClick={() => onSelect(stage.key)}
            role="tab"
            type="button"
          >
            {stage.name}{" "}
            <span className={active ? "text-white/70" : "text-[#93A3B8]"}>
              ({count})
            </span>
          </button>
        );
      })}
    </div>
  );
}
