import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeftIcon,
  CheckIcon,
  Clock3Icon,
  FileTextIcon,
  LoaderIcon,
  PlayIcon,
  RotateCcwIcon,
  XIcon,
} from "lucide-react";
import { loadEvidenceUrls, type EvidenceFile } from "./evidence";
import type { DailyTask, DailyTaskState } from "./useDailyTasks";

const STATE_LABELS: Record<DailyTaskState, string> = {
  draft: "Draft",
  in_progress: "In progress",
  completed: "Completed",
};

const STATE_STYLES: Record<DailyTaskState, string> = {
  draft: "bg-[#F1F5F9] text-[#8291A5]",
  in_progress: "bg-[#EEF5FF] text-[#418BFF]",
  completed: "bg-[#EAF8EF] text-[#16A34A]",
};

/** Rendered in the viewer's own timezone, on purpose. */
function fullTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

type DailyTaskDetailModalProps = {
  task: DailyTask | null;
  open: boolean;
  onClose: () => void;
  busy?: boolean;
  /** Omit all three for a read-only sheet, which is Raj's view. */
  onComplete?: (task: DailyTask) => void;
  onReopen?: (task: DailyTask) => void;
  onStart?: (task: DailyTask) => void;
};

export function DailyTaskDetailModal({
  task,
  open,
  onClose,
  busy = false,
  onComplete,
  onReopen,
  onStart,
}: DailyTaskDetailModalProps) {
  const [files, setFiles] = React.useState<EvidenceFile[]>([]);
  const [loadingFiles, setLoadingFiles] = React.useState(true);

  const taskId = task?.id ?? null;
  const fileCount = task?.files?.length ?? 0;

  React.useEffect(() => {
    if (!open || !taskId) return;

    // Nothing attached, so skip the round trip entirely.
    if (fileCount === 0) {
      setFiles([]);
      setLoadingFiles(false);
      return;
    }

    let cancelled = false;
    setLoadingFiles(true);
    setFiles([]);

    loadEvidenceUrls({ taskId })
      .then((result) => {
        if (!cancelled) setFiles(result);
      })
      .catch((err) => console.error("Could not load evidence:", err))
      .finally(() => {
        if (!cancelled) setLoadingFiles(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, taskId, fileCount]);

  React.useEffect(() => {
    if (!open) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) onClose();
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose, busy]);

  const showStart = Boolean(onStart) && task?.state === "draft";
  const showComplete = Boolean(onComplete) && task?.state === "in_progress";
  const showReopen = Boolean(onReopen) && task?.state === "completed";
  const hasActions = showStart || showComplete || showReopen;

  return (
    <AnimatePresence>
      {open && task && (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-end justify-center overflow-hidden bg-[#1A1A2E]/50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:items-center sm:px-4 sm:py-6"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onClick={() => {
            if (!busy) onClose();
          }}
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
            <div className="shrink-0 border-b border-[#DCE4EE] bg-white px-5 pb-4 pt-4">
              <div className="flex items-center justify-between gap-3">
                <button
                  className="inline-flex items-center gap-1.5 text-[16px] font-medium text-[#3B82C4] transition-colors hover:text-[#2F6FD8]"
                  onClick={onClose}
                  type="button"
                >
                  <ArrowLeftIcon aria-hidden="true" size={18} />
                  Back
                </button>

                <button
                  aria-label="Close"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#93A3B8] transition-colors hover:bg-[#F1F5F9]"
                  onClick={onClose}
                  type="button"
                >
                  <XIcon aria-hidden="true" size={18} />
                </button>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-[14px] font-medium ${STATE_STYLES[task.state]}`}
                >
                  {STATE_LABELS[task.state]}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-[14px] font-medium ${
                    task.priority === "Urgent"
                      ? "bg-[#FEE2E2] text-[#DC2626]"
                      : "bg-[#F1F5F9] text-[#8291A5]"
                  }`}
                >
                  {task.priority}
                </span>
              </div>

              <h2 className="mt-2.5 text-[24px] font-semibold leading-[1.25] tracking-[-0.02em] text-[#1A1A2E]">
                {task.title}
              </h2>
            </div>

            {/* Body */}
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
              <div className="rounded-2xl border border-[#DCE4EE] bg-white p-4">
                <span className="text-[#3B82C4]">
                  <Clock3Icon aria-hidden="true" size={17} />
                </span>
                <p className="mt-2 text-[16px] font-normal text-[#8291A5]">
                  Started
                </p>
                <p className="mt-0.5 text-[16px] font-medium text-[#1A1A2E]">
                  {fullTime(task.created_at)}
                </p>

                {task.due_on && (
                  <>
                    <p className="mt-3 text-[16px] font-normal text-[#8291A5]">
                      Due
                    </p>
                    <p
                      className={`mt-0.5 text-[16px] font-medium ${
                        !task.completed_at &&
                        task.due_on < new Date().toISOString().slice(0, 10)
                          ? "text-[#DC2626]"
                          : "text-[#1A1A2E]"
                      }`}
                    >
                      {new Date(
                        `${task.due_on}T00:00:00`,
                      ).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </>
                )}
                {task.completed_at && (
                  <>
                    <p className="mt-3 text-[16px] font-normal text-[#8291A5]">
                      Completed
                    </p>
                    <p className="mt-0.5 text-[16px] font-medium text-[#16A34A]">
                      {fullTime(task.completed_at)}
                    </p>
                  </>
                )}
              </div>

              {task.description && (
                <div className="rounded-2xl border border-[#DCE4EE] bg-white p-4">
                  <p className="text-[16px] font-medium text-[#5B6B82]">
                    Description
                  </p>
                  <p className="mt-1.5 whitespace-pre-line text-[18px] font-normal leading-[1.6] text-[#1A1A2E]">
                    {task.description}
                  </p>
                </div>
              )}

              {task.completion_note && (
                <div className="rounded-2xl border border-[#C9E9E1] bg-[#F1FCF8] p-4">
                  <p className="text-[16px] font-medium text-[#0F766E]">
                    What was done
                  </p>
                  <p className="mt-1.5 whitespace-pre-line text-[16px] font-normal leading-[1.6] text-[#0F766E]">
                    {task.completion_note}
                  </p>
                </div>
              )}

              <div className="rounded-2xl border border-[#DCE4EE] bg-white p-4">
                <p className="text-[16px] font-medium text-[#5B6B82]">Proof</p>

                {loadingFiles && fileCount > 0 && (
                  <p className="mt-2 flex items-center gap-2 text-[16px] font-normal text-[#A3B0C0]">
                    <LoaderIcon
                      className="animate-spin"
                      size={14}
                      strokeWidth={2.25}
                    />
                    Loading proof...
                  </p>
                )}

                {!loadingFiles && files.length === 0 && (
                  <p className="mt-2 text-[16px] font-normal text-[#A3B0C0]">
                    Nothing attached.
                  </p>
                )}

                {!loadingFiles && files.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {files.map((file) =>
                      file.mimeType.startsWith("image/") ? (
                        <a
                          className="overflow-hidden rounded-xl border border-[#DCE4EE]"
                          href={file.url}
                          key={file.id}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          <img
                            alt={file.fileName}
                            className="h-32 w-full bg-[#F1F5F9] object-contain"
                            src={file.url}
                          />
                        </a>
                      ) : (
                        <a
                          className="flex h-32 flex-col items-center justify-center gap-1.5 rounded-xl border border-[#DCE4EE] bg-[#F8FAFC] text-[#526176] transition-colors hover:bg-[#F1F5F9]"
                          href={file.url}
                          key={file.id}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          <FileTextIcon size={22} strokeWidth={2.25} />
                          <span className="text-[14px] font-medium">PDF</span>
                        </a>
                      ),
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Actions - absent entirely on Raj's read-only view */}
            {hasActions && (
              <div className="shrink-0 border-t border-[#DCE4EE] bg-white px-5 py-4">
                {showStart && (
                  <button
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-5 py-3 text-[16px] font-medium text-white transition-colors hover:bg-[#172F6E] disabled:opacity-60"
                    disabled={busy}
                    onClick={() => onStart?.(task)}
                    type="button"
                  >
                    {busy ? (
                      <LoaderIcon
                        className="animate-spin"
                        size={16}
                        strokeWidth={2.25}
                      />
                    ) : (
                      <PlayIcon size={16} strokeWidth={2.25} />
                    )}
                    Start task
                  </button>
                )}

                {showComplete && (
                  <button
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#16A34A] px-5 py-3 text-[16px] font-medium text-white transition-colors hover:bg-[#128A3E] disabled:opacity-60"
                    disabled={busy}
                    onClick={() => onComplete?.(task)}
                    type="button"
                  >
                    <CheckIcon size={16} strokeWidth={2.5} />
                    Mark as done
                  </button>
                )}

                {showReopen && (
                  <button
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#DCE4EE] px-5 py-3 text-[16px] font-medium text-[#526176] transition-colors hover:bg-[#F1F5F9] disabled:opacity-60"
                    disabled={busy}
                    onClick={() => onReopen?.(task)}
                    type="button"
                  >
                    {busy ? (
                      <LoaderIcon
                        className="animate-spin"
                        size={16}
                        strokeWidth={2.25}
                      />
                    ) : (
                      <RotateCcwIcon size={16} strokeWidth={2.25} />
                    )}
                    Reopen
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
