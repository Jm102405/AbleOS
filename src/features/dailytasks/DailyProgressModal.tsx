import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { XIcon } from "lucide-react";
import { DailyTaskCard } from "./DailyTaskCard";
import type { DailyTask } from "./useDailyTasks";

type View = "in_progress" | "completed";

type DailyProgressModalProps = {
  open: boolean;
  onClose: () => void;
  tasks: DailyTask[];
  loading: boolean;
  /** Today's date in the business timezone, from the API. */
  today: string;
  personLabel: string;
};

/**
 * completed_on is a plain YYYY-MM-DD in the business timezone. Building the
 * Date from its parts keeps it on that day - passing the string straight to
 * new Date() would treat it as UTC midnight and show the day before for
 * anyone west of Greenwich.
 */
function prettyDate(ymd: string) {
  const [year, month, day] = ymd.split("-").map(Number);
  if (!year || !month || !day) return ymd;

  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function DailyProgressModal({
  open,
  onClose,
  tasks,
  loading,
  today,
  personLabel,
}: DailyProgressModalProps) {
  const [view, setView] = React.useState<View>("in_progress");
  const [date, setDate] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    setView("in_progress");
    setDate(today);
  }, [open, today]);

  React.useEffect(() => {
    if (!open) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  const inProgress = React.useMemo(
    () => tasks.filter((task) => task.state === "in_progress"),
    [tasks],
  );

  const completed = React.useMemo(
    () => tasks.filter((task) => task.state === "completed"),
    [tasks],
  );

  /** Dates that actually have completed work, newest first. */
  const availableDates = React.useMemo(() => {
    const set = new Set(
      completed.map((task) => task.completed_on).filter(Boolean) as string[],
    );
    return Array.from(set).sort().reverse();
  }, [completed]);

  const visibleCompleted = React.useMemo(
    () =>
      date ? completed.filter((task) => task.completed_on === date) : completed,
    [completed, date],
  );

  const visible = view === "in_progress" ? inProgress : visibleCompleted;

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
            <div className="shrink-0 border-b border-[#DCE4EE] bg-white px-5 pb-3 pt-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#5B6B82]">
                    Daily work
                  </p>
                  <h2 className="mt-1 text-[18px] font-extrabold tracking-[-0.025em] text-[#1A1A2E]">
                    {personLabel}
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
                <button
                  className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide transition-colors ${
                    view === "in_progress"
                      ? "bg-[#1E3A8A] text-white"
                      : "text-[#A3B0C0] hover:bg-[#F1F5F9]"
                  }`}
                  onClick={() => setView("in_progress")}
                  type="button"
                >
                  In progress ({inProgress.length})
                </button>
                <button
                  className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide transition-colors ${
                    view === "completed"
                      ? "bg-[#16A34A] text-white"
                      : "text-[#A3B0C0] hover:bg-[#F1F5F9]"
                  }`}
                  onClick={() => setView("completed")}
                  type="button"
                >
                  Completed ({completed.length})
                </button>
              </div>

              {view === "completed" && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <input
                    aria-label="Filter by completion date"
                    className="rounded-xl border border-[#DCE4EE] bg-[#F8FAFC] px-2.5 py-1.5 text-[11px] font-bold text-[#1A1A2E] outline-none transition-colors focus:border-[#1E3A8A] focus:bg-white"
                    onChange={(event) => setDate(event.target.value)}
                    type="date"
                    value={date}
                  />
                  <button
                    className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide transition-colors ${
                      date === today
                        ? "bg-[#EEF5FF] text-[#418BFF]"
                        : "text-[#A3B0C0] hover:bg-[#F1F5F9]"
                    }`}
                    onClick={() => setDate(today)}
                    type="button"
                  >
                    Today
                  </button>
                  <button
                    className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide transition-colors ${
                      date === ""
                        ? "bg-[#EEF5FF] text-[#418BFF]"
                        : "text-[#A3B0C0] hover:bg-[#F1F5F9]"
                    }`}
                    onClick={() => setDate("")}
                    type="button"
                  >
                    All dates
                  </button>
                </div>
              )}
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-5">
              {loading && (
                <p className="text-[12px] font-medium text-[#8A99AC]">
                  Loading...
                </p>
              )}

              {view === "completed" && date && !loading && (
                <p className="text-[11px] font-bold text-[#526176]">
                  {visibleCompleted.length}{" "}
                  {visibleCompleted.length === 1 ? "task" : "tasks"} completed
                  on {prettyDate(date)}
                </p>
              )}

              {!loading && visible.length === 0 && (
                <div className="rounded-2xl border border-dashed border-[#DCE4EE] bg-white px-5 py-8 text-center">
                  <p className="text-[12px] font-medium leading-snug text-[#8A99AC]">
                    {view === "in_progress"
                      ? "Nothing in progress right now."
                      : "Nothing completed for this date."}
                  </p>
                  {view === "completed" && availableDates.length > 0 && (
                    <p className="mt-2 text-[10px] font-bold uppercase tracking-wide text-[#A3B0C0]">
                      Most recent: {prettyDate(availableDates[0])}
                    </p>
                  )}
                </div>
              )}

              {visible.map((task) => (
                <DailyTaskCard key={task.id} task={task} />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
