import React from "react";
import { ChevronRightIcon } from "lucide-react";
import { stages } from "./data";
import type { DealStage } from "./types";

type StageStripProps = {
  selectedStage: DealStage;
  onSelect: (stage: DealStage) => void;
  counts: Record<string, number>;
};

/**
 * Horizontally scrollable stage tabs. Edge fades signal there is more to
 * scroll - a real scrollbar can't be relied on, since Chrome and mobile
 * browsers both hide overlay scrollbars when idle.
 */
export function StageStrip({
  selectedStage,
  onSelect,
  counts,
}: StageStripProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, scrollLeft: 0 });
  const [edges, setEdges] = React.useState({ atStart: true, atEnd: true });

  const updateEdges = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setEdges({
      atStart: el.scrollLeft <= 1,
      atEnd: maxScroll <= 1 || el.scrollLeft >= maxScroll - 1,
    });
  }, []);

  React.useEffect(() => {
    updateEdges();
    window.addEventListener("resize", updateEdges);
    return () => window.removeEventListener("resize", updateEdges);
  }, [updateEdges]);

  function handleMouseDown(event: React.MouseEvent) {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setDragStart({ x: event.pageX, scrollLeft: scrollRef.current.scrollLeft });
  }

  function handleMouseMove(event: React.MouseEvent) {
    if (!isDragging || !scrollRef.current) return;
    event.preventDefault();
    scrollRef.current.scrollLeft =
      dragStart.scrollLeft - (event.pageX - dragStart.x);
  }

  const stopDragging = () => setIsDragging(false);

  return (
    <div className="relative -mx-5 mt-4 sm:-mx-8 lg:-mx-10">
      <div
        className="no-scrollbar min-w-0 cursor-grab select-none overflow-x-auto pb-1 active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseLeave={stopDragging}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDragging}
        onScroll={updateEdges}
        ref={scrollRef}
      >
        <div
          aria-label="Select a pipeline stage"
          className="flex w-max flex-nowrap gap-2 px-5 pr-12 sm:px-8 lg:px-10"
          role="tablist"
        >
          {stages.map((stage) => {
            const isSelected = selectedStage === stage.name;
            const count = counts[stage.name] ?? 0;

            return (
              <button
                aria-selected={isSelected}
                className={`shrink-0 whitespace-nowrap rounded-xl border px-3 py-2.5 text-[11px] font-extrabold transition-colors focus:outline-none focus:ring-2 focus:ring-[#3B82C4] focus:ring-offset-2 ${
                  isSelected
                    ? "border-[#1E3A8A] bg-[#1E3A8A] text-white shadow-[0_4px_10px_rgba(30,58,138,0.18)]"
                    : "border-[#DCE4EE] bg-white text-[#526176] hover:border-[#9CC6FF]"
                }`}
                key={stage.name}
                onClick={() => onSelect(stage.name)}
                role="tab"
                type="button"
              >
                {stage.name}{" "}
                <span
                  className={isSelected ? "text-white/75" : "text-[#8291A5]"}
                >
                  ({count})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Left fade - only once scrolled away from the start */}
      {!edges.atStart && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#EEF2F6] via-[#EEF2F6]/80 to-transparent"
        />
      )}

      {/* Right fade with a chevron - the always-visible hint that there's more */}
      {!edges.atEnd && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 flex w-12 items-center justify-end bg-gradient-to-l from-[#EEF2F6] via-[#EEF2F6]/85 to-transparent pb-1 pr-1"
        >
          <ChevronRightIcon
            className="text-[#8291A5]"
            size={18}
            strokeWidth={2.5}
          />
        </div>
      )}
    </div>
  );
}
