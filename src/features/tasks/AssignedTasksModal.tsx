import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDownIcon,
  LoaderIcon,
  SlidersHorizontalIcon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react";
import { TASK_STATUSES, type Task } from "./TaskCard";
import { TaskRow } from "./TaskRow";
import { TaskDetailModal } from "./TaskDetailModal";

type Filter = "All" | "Waiting" | "Approved" | Task["status"];

// Done is split into two mutually exclusive filters - waiting on Raj, and
// signed off. A raw Done tab put the same task in two places at once.
const FILTERS: Filter[] = [
  "All",
  "Waiting",
  ...TASK_STATUSES.filter((status) => status !== "Done"),
  "Approved",
];

/** Done by the assignee, not yet signed off by Raj. */
function isWaiting(task: Task) {
  return task.status === "Done" && !task.approved_at;
}

const FILTER_LABELS: Record<string, string> = { Waiting: "Waiting on you" };

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
  onDelete,
  onOpenChat,
  commentCounts,
  onApprove,
  approvingId,
  focusTaskId,
}: AssignedTasksModalProps) {
  const [filter, setFilter] = React.useState<Filter>("All");
  const [detailId, setDetailId] = React.useState<string | null>(null);
  const [filterOpen, setFilterOpen] = React.useState(false);
  const filterRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!filterOpen) return;

    function handleOutside(event: MouseEvent) {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
        setFilterOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [filterOpen]);
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
    if (!open) setDetailId(null);
  }, [open]);

  // Arriving from a notification opens that task straight away.
  React.useEffect(() => {
    if (open && focusTaskId) setDetailId(focusTaskId);
  }, [open, focusTaskId]);

  // Read from the live list so the sheet updates after an approve.
  const detailTask = tasks.find((task) => task.id === detailId) ?? null;

  React.useEffect(() => {
    if (!open) return;
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  const counts = React.useMemo(() => {
    const result: Record<string, number> = {
      All: tasks.length,
      Waiting: tasks.filter(isWaiting).length,
      Approved: tasks.filter((task) => Boolean(task.approved_at)).length,
    };
    for (const status of TASK_STATUSES) {
      result[status] = tasks.filter((task) => task.status === status).length;
    }
    return result;
  }, [tasks]);

  const visible = React.useMemo(() => {
    if (filter === "All") return tasks;
    if (filter === "Waiting") return tasks.filter(isWaiting);
    if (filter === "Approved") {
      return tasks.filter((task) => Boolean(task.approved_at));
    }
    return tasks.filter((task) => task.status === filter);
  }, [filter, tasks]);

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
            className="flex h-full max-h-full w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-[#EEF2F6] shadow-[0_20px_40px_rgba(30,58,138,0.18)] sm:h-[85vh]"
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

              <div className="relative mt-3" ref={filterRef}>
                <button
                  className="inline-flex items-center gap-2 rounded-xl border border-[#DCE4EE] bg-white px-3.5 py-2.5 text-[16px] font-medium text-[#526176] transition-colors hover:bg-[#F8FAFC]"
                  onClick={() => setFilterOpen((value) => !value)}
                  type="button"
                >
                  <SlidersHorizontalIcon
                    aria-hidden="true"
                    size={16}
                    strokeWidth={2.25}
                  />
                  {FILTER_LABELS[filter] ?? filter} ({counts[filter] ?? 0})
                  <ChevronDownIcon
                    aria-hidden="true"
                    className={
                      filterOpen
                        ? "rotate-180 transition-transform"
                        : "transition-transform"
                    }
                    size={16}
                    strokeWidth={2.25}
                  />
                </button>

                {filterOpen && (
                  <div className="absolute left-0 top-full z-20 mt-2 w-60 overflow-hidden rounded-xl border border-[#DCE4EE] bg-white shadow-[0_12px_28px_rgba(30,58,138,0.16)]">
                    {FILTERS.map((option) => (
                      <button
                        className={`flex w-full items-center justify-between border-b border-[#F1F5F9] px-4 py-3 text-left text-[16px] transition-colors last:border-b-0 hover:bg-[#F8FAFC] ${
                          filter === option
                            ? "font-semibold text-[#1E3A8A]"
                            : "font-normal text-[#526176]"
                        }`}
                        key={option}
                        onClick={() => {
                          setFilter(option);
                          setFilterOpen(false);
                        }}
                        type="button"
                      >
                        {FILTER_LABELS[option] ?? option}
                        <span className="text-[14px] font-normal text-[#8291A5]">
                          {counts[option] ?? 0}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
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
                <TaskRow
                  commentCount={commentCounts[task.id] ?? 0}
                  key={task.id}
                  onOpen={() => setDetailId(task.id)}
                  task={task}
                />
              ))}
            </div>
          </motion.div>

          <TaskDetailModal
            approving={approvingId === detailTask?.id}
            commentCount={detailTask ? (commentCounts[detailTask.id] ?? 0) : 0}
            metaLabel="Assigned to"
            onApprove={detailTask ? () => onApprove(detailTask.id) : undefined}
            onClose={() => setDetailId(null)}
            onDelete={detailTask ? () => setConfirming(detailTask) : undefined}
            onOpenChat={detailTask ? () => onOpenChat(detailTask) : undefined}
            open={Boolean(detailTask)}
            task={detailTask}
          />

          {/* Delete confirmation, layered over the list */}
          <AnimatePresence>
            {confirming && (
              <motion.div
                animate={{ opacity: 1 }}
                className="fixed inset-0 z-[60] flex items-center justify-center bg-[#1A1A2E]/60 px-5"
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
