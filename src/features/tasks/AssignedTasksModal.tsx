import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { XIcon } from "lucide-react";
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
};

export function AssignedTasksModal({
  open,
  onClose,
  tasks,
  loading,
  savingTask,
  onStatusChange,
}: AssignedTasksModalProps) {
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
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#1A1A2E]/50 px-4 py-6 sm:items-center"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-[#EEF2F6] shadow-[0_20px_40px_rgba(30,58,138,0.18)]"
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
                    Assigned work
                  </p>
                  <h2 className="mt-1 text-[18px] font-extrabold tracking-[-0.025em] text-[#1A1A2E]">
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
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide transition-colors ${
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
                <p className="text-[12px] font-medium text-[#8A99AC]">
                  Loading tasks…
                </p>
              )}

              {!loading && visible.length === 0 && (
                <div className="rounded-2xl border border-dashed border-[#DCE4EE] bg-white px-5 py-8 text-center">
                  <p className="text-[12px] font-medium leading-snug text-[#8A99AC]">
                    {tasks.length === 0
                      ? "You haven't assigned anything yet."
                      : `Nothing ${filter.toLowerCase()}.`}
                  </p>
                </div>
              )}

              {visible.map((task) => (
                <TaskCard
                  key={task.id}
                  metaLabel={`To ${STAFF_LABELS[task.assigned_to] ?? task.assigned_to}`}
                  onStatusChange={(status) => onStatusChange(task.id, status)}
                  saving={savingTask === task.id}
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
