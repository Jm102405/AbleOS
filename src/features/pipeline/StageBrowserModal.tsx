import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SearchIcon, XIcon } from "lucide-react";
import { DealCard } from "./DealCard";
import { StageStrip } from "./StageStrip";
import { STAGE_LABELS, type Deal, type DealStage } from "./types";

type StageBrowserModalProps = {
  open: boolean;
  onClose: () => void;
  counts: Record<string, number>;
  selectedStage: DealStage;
  onSelectStage: (stage: DealStage) => void;
  deals: Deal[];
  onSelectDeal: (deal: Deal) => void;
  loading: boolean;
  birdDogLabel: string;
};

export function StageBrowserModal({
  open,
  onClose,
  counts,
  selectedStage,
  onSelectStage,
  deals,
  onSelectDeal,
  loading,
  birdDogLabel,
}: StageBrowserModalProps) {
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    if (open) setQuery("");
  }, [open]);

  const filtered = React.useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return deals;

    return deals.filter(
      (deal) =>
        deal.name.toLowerCase().includes(term) ||
        deal.address.toLowerCase().includes(term) ||
        deal.source.toLowerCase().includes(term),
    );
  }, [deals, query]);

  React.useEffect(() => {
    if (!open) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-40 flex items-end justify-center overflow-hidden bg-[#1A1A2E]/50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:items-center sm:px-4 sm:py-6"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="flex max-h-full w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-[#EEF2F6] shadow-[0_20px_40px_rgba(30,58,138,0.18)]"
            exit={{ opacity: 0, y: 12 }}
            initial={{ opacity: 0, y: 12 }}
            onClick={(event) => event.stopPropagation()}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {/* Sticky header: title plus the stage tabs */}
            <div className="shrink-0 border-b border-[#DCE4EE] bg-white px-5 pb-3 pt-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[16px] font-semibold tracking-[0.13em] text-[#5B6B82]">
                    Pipeline stages
                  </p>
                  <h2 className="mt-1 truncate text-[18px] font-semibold tracking-[-0.025em] text-[#1A1A2E]">
                    {STAGE_LABELS[selectedStage]}
                  </h2>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="rounded-full bg-[#EAF3FF] px-2.5 py-1 text-[16px] font-semibold tracking-[0.06em] text-[#2465B5]">
                    {filtered.length} deal{filtered.length === 1 ? "" : "s"}
                  </span>
                  <button
                    aria-label="Close"
                    className="grid h-7 w-7 place-items-center rounded-full text-[#93A3B8] transition-colors hover:bg-[#F1F5F9]"
                    onClick={onClose}
                    type="button"
                  >
                    <XIcon aria-hidden="true" size={16} />
                  </button>
                </div>
              </div>

              <StageStrip
                counts={counts}
                onSelect={onSelectStage}
                selectedStage={selectedStage}
              />

              <div className="relative mt-3">
                <SearchIcon
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#93A3B8]"
                  size={15}
                  strokeWidth={2.5}
                />
                <input
                  aria-label="Search deals"
                  className="w-full rounded-xl border border-[#DCE4EE] bg-[#F8FAFC] py-2.5 pl-9 pr-9 text-[18px] font-medium text-[#1A1A2E] outline-none transition-colors placeholder:font-medium placeholder:text-[#A3B0C0] focus:border-[#1E3A8A] focus:bg-white"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search name, address or bird dog"
                  type="text"
                  value={query}
                />
                {query && (
                  <button
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-[#93A3B8] transition-colors hover:bg-[#F1F5F9]"
                    onClick={() => setQuery("")}
                    type="button"
                  >
                    <XIcon aria-hidden="true" size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Scrolling deal list */}
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-5">
              {filtered.length > 0 ? (
                filtered.map((deal) => (
                  <DealCard deal={deal} key={deal.id} onSelect={onSelectDeal} />
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white px-5 py-10 text-center">
                  <p className="text-[18px] font-semibold text-[#526176]">
                    {loading
                      ? "Loading deals..."
                      : query
                        ? "No deals match that search"
                        : "No deals in this stage"}
                  </p>
                  <p className="mt-1 text-[16px] font-medium text-[#8291A5]">
                    Choose another stage to review {birdDogLabel.toLowerCase()}.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
