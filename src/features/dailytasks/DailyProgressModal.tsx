import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { XIcon } from "lucide-react";
import { DailyTaskCard } from "./DailyTaskCard";
import { TaskCard, type Task } from "../tasks/TaskCard";
import type { DailyTask } from "./useDailyTasks";

type View = "in_progress" | "completed";
type Mode = "today" | "this_week" | "last_week" | "all" | "date";

type DailyProgressModalProps = {
  open: boolean;
  onClose: () => void;
  tasks: DailyTask[];
  loading: boolean;
  /** Today's date in the business timezone, from the API. */
  today: string;
  personLabel: string;
  /** Tasks Raj assigned and has since approved. */
  approvedTasks?: Task[];
};

/**
 * completed_on is a plain YYYY-MM-DD in the business timezone. Building the
 * Date from its parts keeps it on that day - passing the string straight to
 * new Date() would treat it as UTC midnight and show the day before for
 * anyone west of Greenwich.
 */
function ymdToDate(ymd: string) {
  const [year, month, day] = ymd.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function dateToYmd(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function prettyDate(ymd: string) {
  if (!ymd) return "";
  return ymdToDate(ymd).toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function shortDate(ymd: string) {
  if (!ymd) return "";
  return ymdToDate(ymd).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

/** Sunday to Saturday, US convention. weeksBack 0 is the current week. */
function weekRange(todayYmd: string, weeksBack: number) {
  const base = ymdToDate(todayYmd);
  const start = new Date(base);
  start.setDate(base.getDate() - base.getDay() - weeksBack * 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: dateToYmd(start), end: dateToYmd(end) };
}

const MODES: Array<{ key: Mode; label: string }> = [
  { key: "today", label: "Today" },
  { key: "this_week", label: "This week" },
  { key: "last_week", label: "Last week" },
  { key: "all", label: "All dates" },
];

export function DailyProgressModal({
  open,
  onClose,
  tasks,
  loading,
  today,
  personLabel,
  approvedTasks = [],
}: DailyProgressModalProps) {
  const [view, setView] = React.useState<View>("in_progress");
  const [mode, setMode] = React.useState<Mode>("today");
  const [date, setDate] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    setView("in_progress");
    setMode("today");
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

  const range = React.useMemo(() => {
    if (mode === "all") return null;
    if (mode === "today") return { start: today, end: today };
    if (mode === "date") return { start: date, end: date };
    return weekRange(today, mode === "this_week" ? 0 : 1);
  }, [date, mode, today]);

  const visibleCompleted = React.useMemo(() => {
    if (!range || !range.start) return completed;
    return completed.filter(
      (task) =>
        task.completed_on &&
        task.completed_on >= range.start &&
        task.completed_on <= range.end,
    );
  }, [completed, range]);

  const visibleApproved = React.useMemo(() => {
    if (!range || !range.start) return approvedTasks;
    return approvedTasks.filter(
      (task) =>
        task.approved_on &&
        task.approved_on >= range.start &&
        task.approved_on <= range.end,
    );
  }, [approvedTasks, range]);

  const rangeLabel = React.useMemo(() => {
    if (!range) return "all time";
    if (range.start === range.end) return prettyDate(range.start);
    return `${shortDate(range.start)} to ${shortDate(range.end)}`;
  }, [range]);

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
                  Completed ({completed.length + approvedTasks.length})
                </button>
              </div>

              {view === "completed" && (
                <>
                  <div className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto pb-1">
                    {MODES.map((option) => (
                      <button
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide transition-colors ${
                          mode === option.key
                            ? "bg-[#EEF5FF] text-[#418BFF]"
                            : "text-[#A3B0C0] hover:bg-[#F1F5F9]"
                        }`}
                        key={option.key}
                        onClick={() => setMode(option.key)}
                        type="button"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[9px] font-extrabold uppercase tracking-[0.08em] text-[#A3B0C0]">
                      Or pick a day
                    </span>
                    <input
                      aria-label="Filter by completion date"
                      className={`rounded-xl border bg-[#F8FAFC] px-2.5 py-1.5 text-[11px] font-bold text-[#1A1A2E] outline-none transition-colors focus:bg-white ${
                        mode === "date"
                          ? "border-[#418BFF]"
                          : "border-[#DCE4EE] focus:border-[#1E3A8A]"
                      }`}
                      onChange={(event) => {
                        setDate(event.target.value);
                        setMode("date");
                      }}
                      type="date"
                      value={date}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-5">
              {loading && (
                <p className="text-[12px] font-medium text-[#8A99AC]">
                  Loading...
                </p>
              )}

              {view === "completed" && !loading && (
                <p className="text-[11px] font-bold text-[#526176]">
                  {visibleCompleted.length + visibleApproved.length}{" "}
                  {visibleCompleted.length + visibleApproved.length === 1
                    ? "task"
                    : "tasks"}{" "}
                  completed · {rangeLabel}
                </p>
              )}

              {!loading &&
                visible.length === 0 &&
                (view === "in_progress" || visibleApproved.length === 0) && (
                <div className="rounded-2xl border border-dashed border-[#DCE4EE] bg-white px-5 py-8 text-center">
                  <p className="text-[12px] font-medium leading-snug text-[#8A99AC]">
                    {view === "in_progress"
                      ? "Nothing in progress right now."
                      : "Nothing completed in this range."}
                  </p>
                </div>
              )}

              {visible.map((task) => (
                <DailyTaskCard key={task.id} task={task} />
              ))}

              {view === "completed" && visibleApproved.length > 0 && (
                <p className="pt-2 text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#8291A5]">
                  Assigned by Raj
                </p>
              )}

              {view === "completed" &&
                visibleApproved.map((task) => (
                  <TaskCard
                    key={task.id}
                    onStatusChange={() => {}}
                    readOnly
                    saving={false}
                    task={task}
                  />
                ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
