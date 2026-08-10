import React from "react";
import { XIcon } from "lucide-react";

type GateQueueModalProps = {
  open: boolean;
  onClose: () => void;
  /** Null while the contents are still loading. */
  count: number | null;
  eyebrow: string;
  title: string;
  /** Optional control under the header, e.g. a filter menu. */
  toolbar?: React.ReactNode;
  children: React.ReactNode;
};

/**
 * Deliberately no AnimatePresence and no conditional render. The queue inside
 * has to stay mounted while the panel is closed, otherwise it stops fetching
 * and the "Gates awaiting you" KPI goes blank. Closing hides it with CSS
 * instead of unmounting it.
 */
export function GateQueueModal({
  open,
  onClose,
  count,
  eyebrow,
  title,
  toolbar,
  children,
}: GateQueueModalProps) {
  React.useEffect(() => {
    if (!open) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  return (
    <div
      aria-hidden={!open}
      className={
        open
          ? "fixed inset-0 z-40 flex items-end justify-center overflow-hidden bg-[#1A1A2E]/50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:items-center sm:px-4 sm:py-6"
          : "hidden"
      }
      onClick={onClose}
    >
      <div
        className="flex h-full max-h-full w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-[#EEF2F6] shadow-[0_20px_40px_rgba(30,58,138,0.18)] sm:h-[85vh]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="shrink-0 border-b border-[#DCE4EE] bg-white px-5 pb-4 pt-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[16px] font-semibold tracking-[0.13em] text-[#5B6B82]">
                {eyebrow}
              </p>
              <h2 className="mt-1 text-[18px] font-semibold tracking-[-0.025em] text-[#1A1A2E]">
                {title}
              </h2>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="rounded-full bg-[#EAF3FF] px-2.5 py-1 text-[16px] font-semibold tracking-[0.06em] text-[#2465B5]">
                {count === null ? "..." : count} waiting
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

          {toolbar && <div className="mt-3">{toolbar}</div>}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
