import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckIcon, ExternalLinkIcon, XIcon } from "lucide-react";
import type { ApproverRole, Stage } from "./ApprovalQueue";

/** Which checkbox counts as "I approved this" for each role. */
const APPROVED_FIELD: Record<ApproverRole, keyof Stage> = {
  jeremiah: "jeremiahApproved",
  karen: "karenApproved",
  raj: "rajApproved",
};

const PHASES = ["Phase 1", "Phase 2", "Phase 3", "Phase 4"];

type Filter = "All" | "Side A" | "Side B";
const FILTERS: Filter[] = ["All", "Side A", "Side B"];

type ApprovedGatesModalProps = {
  open: boolean;
  onClose: () => void;
  stages: Stage[];
  loading: boolean;
  role: ApproverRole;
};

/**
 * Everything Raj has signed off, grouped by phase, each linking to the stage's
 * Drive folder. The photos stay where the crew uploaded them - this is the
 * record of what was approved, not a second copy.
 */
export function ApprovedGatesModal({
  open,
  onClose,
  stages,
  loading,
  role,
}: ApprovedGatesModalProps) {
  const [filter, setFilter] = React.useState<Filter>("All");

  React.useEffect(() => {
    if (open) setFilter("All");
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  const approved = React.useMemo(() => {
    const field = APPROVED_FIELD[role];
    return stages.filter((stage) => Boolean(stage[field]));
  }, [role, stages]);

  const visible = React.useMemo(
    () =>
      filter === "All" ? approved : approved.filter((s) => s.side === filter),
    [approved, filter],
  );

  const counts = React.useMemo(
    () => ({
      All: approved.length,
      "Side A": approved.filter((s) => s.side === "Side A").length,
      "Side B": approved.filter((s) => s.side === "Side B").length,
    }),
    [approved],
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[55] flex items-end justify-center bg-[#1A1A2E]/50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:items-center sm:px-4 sm:py-6"
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
            {/* Header */}
            <div className="shrink-0 border-b border-[#DCE4EE] bg-white px-5 pb-3 pt-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#5B6B82]">
                    Signed off by you
                  </p>
                  <h2 className="mt-1 text-[18px] font-extrabold tracking-[-0.025em] text-[#1A1A2E]">
                    Gates approved
                  </h2>
                </div>
                <button
                  aria-label="Close"
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[#93A3B8] transition-colors hover:bg-[#F1F5F9]"
                  onClick={onClose}
                  type="button"
                >
                  <XIcon aria-hidden="true" size={16} />
                </button>
              </div>

              <div className="mt-3 flex gap-1.5">
                {FILTERS.map((option) => {
                  const active = filter === option;
                  return (
                    <button
                      className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide transition-colors ${
                        active
                          ? "bg-[#1E3A8A] text-white"
                          : "text-[#A3B0C0] hover:bg-[#F1F5F9]"
                      }`}
                      key={option}
                      onClick={() => setFilter(option)}
                      type="button"
                    >
                      {option} ({counts[option]})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Body */}
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
              {loading && (
                <p className="text-[12px] font-medium text-[#8A99AC]">
                  Loading…
                </p>
              )}

              {!loading && visible.length === 0 && (
                <div className="rounded-2xl border border-dashed border-[#DCE4EE] bg-white px-5 py-8 text-center">
                  <p className="text-[12px] font-medium leading-snug text-[#8A99AC]">
                    Nothing approved yet. Stages appear here once you sign them
                    off.
                  </p>
                </div>
              )}

              {!loading &&
                PHASES.map((phase) => {
                  const inPhase = visible.filter((s) => s.phase === phase);
                  if (inPhase.length === 0) return null;

                  return (
                    <div key={phase}>
                      <h3 className="mb-2.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#5B6B82]">
                        {phase}
                        <span className="ml-1.5 text-[#A3B0C0]">
                          ({inPhase.length})
                        </span>
                      </h3>

                      <div className="space-y-2">
                        {inPhase.map((stage) => (
                          <article
                            className="flex items-center gap-3 rounded-2xl border border-[#DCE4EE] bg-white px-4 py-3 shadow-[0_4px_12px_rgba(30,58,138,0.045)]"
                            key={stage.notionPageId}
                          >
                            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#16A34A] text-white">
                              <CheckIcon
                                aria-hidden="true"
                                size={13}
                                strokeWidth={3}
                              />
                            </span>

                            <div className="min-w-0 flex-1">
                              <p className="text-[13px] font-extrabold leading-snug tracking-[-0.015em] text-[#1A1A2E]">
                                {stage.stageName}
                              </p>
                              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-[#8A99AC]">
                                {stage.side}
                              </p>
                            </div>

                            {stage.drivePhotoLink ? (
                              <a
                                className="flex shrink-0 items-center gap-1 text-[11px] font-bold text-[#418BFF] hover:underline"
                                href={stage.drivePhotoLink}
                                rel="noopener noreferrer"
                                target="_blank"
                              >
                                Photos
                                <ExternalLinkIcon size={12} strokeWidth={2.5} />
                              </a>
                            ) : (
                              <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-[#CBD5E1]">
                                No link
                              </span>
                            )}
                          </article>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
