import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LoaderIcon, TriangleAlertIcon, XIcon } from "lucide-react";
import {
  TaskCard,
  TASK_STATUSES,
  taskStatusStyles,
  type Task,
} from "./TaskCard";

type Filter = "All" | Task["status"];

const FILTERS: Filter[] = ["All", ...TASK_STATUSES];

const STAFF_LABELS: Record<string, string> = {
  dane: "Dane",
  karen: "Karen",
  jeremiah: "Jeremiah",
  colton: "Colton",
  zo: "Zo",
};

type AssignedTasksModalProps = {
  open: boolean;
  onClose: () => void;
  tasks: Task[];
  loading: boolean;
  savingTask: string | null;
  onStatusChange: (id: string, status: Task["status"]) => void;
  onDelete: (id: string) => Promise<void>;
  onOpenChat: (task: Task) => void;
  commentCounts: Record<string, number>;
  onApprove: (id: string) => void;
  approvingId: string | null;
  /** Task to open expanded, when arriving from a notification. */
  focusTaskId?: string | null;
};

export function AssignedTasksModal({
  open,
  onClose,
  tasks,
  loading,
  savingTask,
  onStatusChange,
  onDelete,
  onOpenChat,
  commentCounts,
  onApprove,
  approvingId,
  focusTaskId,
}: AssignedTasksModalProps) {
  const [filter, setFilter] = React.useState<Filter>("All");
  const [confirming, setConfirming] = React.useState<Task | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  async function handleConfirmedDelete() {
    if (!confirming) return;
    setDeleting(true);
    try {
      await onDelete(confirming.id);
      setConfirming(null);
    } finally {
      setDeleting(false);
    }
  }

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

  const counts = React.useMemo(() => {
    const result: Record<string, number> = { All: tasks.length };
    for (const status of TASK_STATUSES) {
      result[status] = tasks.filter((task) => task.status === status).length;
    }
    return result;
  }, [tasks]);

  const visible = React.useMemo(
    () =>
      filter === "All" ? tasks : tasks.filter((task) => task.status === filter),
    [filter, tasks],
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-end justify-center overflow-hidden bg-[#1A1A2E]/50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:items-center sm:px-4 sm:py-6"
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
                  <p className="text-[16px] font-semibold tracking-[0.13em] text-[#5B6B82]">
                    Assigned work
                  </p>
                  <h2 className="mt-1 text-[18px] font-semibold tracking-[-0.025em] text-[#1A1A2E]">
                    Tasks you assigned
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

              <div className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto pb-1">
                {FILTERS.map((option) => {
                  const active = filter === option;
                  return (
                    <button
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[16px] font-semibold tracking-wide transition-colors ${
                        active
                          ? option === "All"
                            ? "bg-[#1E3A8A] text-white"
                            : taskStatusStyles[option]
                          : "text-[#A3B0C0] hover:bg-[#F1F5F9]"
                      }`}
                      key={option}
                      onClick={() => setFilter(option)}
                      type="button"
                    >
                      {option} ({counts[option] ?? 0})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Body */}
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-5">
              {loading && (
                <p className="text-[16px] font-medium text-[#8A99AC]">
                  Loading tasks…
                </p>
              )}

              {!loading && visible.length === 0 && (
                <div className="rounded-2xl border border-dashed border-[#DCE4EE] bg-white px-5 py-8 text-center">
                  <p className="text-[16px] font-medium leading-snug text-[#8A99AC]">
                    {tasks.length === 0
                      ? "You haven't assigned anything yet."
                      : `Nothing ${filter.toLowerCase()}.`}
                  </p>
                </div>
              )}

              {visible.map((task) => (
                <TaskCard
                  approving={approvingId === task.id}
                  defaultExpanded={focusTaskId === task.id}
                  commentCount={commentCounts[task.id] ?? 0}
                  key={task.id}
                  onApprove={() => onApprove(task.id)}
                  metaLabel={`To ${STAFF_LABELS[task.assigned_to] ?? task.assigned_to}`}
                  onDelete={() => setConfirming(task)}
                  onOpenChat={() => onOpenChat(task)}
                  onStatusChange={(status) => onStatusChange(task.id, status)}
                  readOnly
                  saving={savingTask === task.id}
                  task={task}
                />
              ))}
            </div>
          </motion.div>

          {/* Delete confirmation, layered over the list */}
          <AnimatePresence>
            {confirming && (
              <motion.div
                animate={{ opacity: 1 }}
                className="absolute inset-0 z-10 flex items-center justify-center bg-[#1A1A2E]/60 px-5"
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
                onClick={(event) => {
                  if (event.target === event.currentTarget && !deleting) {
                    setConfirming(null);
                  }
                }}
              >
                <motion.div
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full max-w-xs rounded-2xl bg-white p-5 shadow-[0_20px_40px_rgba(26,26,46,0.28)]"
                  exit={{ opacity: 0, scale: 0.97 }}
                  initial={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                >
                  <div className="flex items-start gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#FEE2E2] text-[#DC2626]">
                      <TriangleAlertIcon size={17} strokeWidth={2.5} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-[18px] font-semibold tracking-[-0.02em] text-[#DC2626]">
                        Delete permanently?
                      </h3>
                      <p className="mt-1.5 text-[16px] font-medium leading-relaxed text-[#6B7A90]">
                        <span className="font-semibold text-[#1A1A2E]">
                          {confirming.title}
                        </span>{" "}
                        will be removed from the database for good.{" "}
                        {STAFF_LABELS[confirming.assigned_to] ??
                          confirming.assigned_to}{" "}
                        will no longer see it, and this can&apos;t be undone.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex gap-2.5">
                    <button
                      className="flex-1 rounded-xl border border-[#DCE4EE] px-3 py-2.5 text-[16px] font-semibold tracking-wide text-[#526176] transition-colors hover:bg-[#F1F5F9] disabled:opacity-60"
                      disabled={deleting}
                      onClick={() => setConfirming(null)}
                      type="button"
                    >
                      Keep it
                    </button>
                    <button
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#DC2626] px-3 py-2.5 text-[16px] font-semibold tracking-wide text-white transition-colors hover:bg-[#B91C1C] disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={deleting}
                      onClick={handleConfirmedDelete}
                      type="button"
                    >
                      {deleting && (
                        <LoaderIcon
                          className="animate-spin"
                          size={12}
                          strokeWidth={2.5}
                        />
                      )}
                      Delete
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
