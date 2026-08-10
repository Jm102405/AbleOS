import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeftIcon,
  CalendarIcon,
  CheckIcon,
  ExternalLinkIcon,
  FileTextIcon,
  LoaderIcon,
  MessageSquareIcon,
  Trash2Icon,
  UserRoundIcon,
  XIcon,
} from "lucide-react";
import { loadEvidenceUrls, type EvidenceFile } from "../dailytasks/evidence";
import { taskStatusStyles, type Task } from "./TaskCard";

const priorityStyles: Record<Task["priority"], string> = {
  Low: "bg-[#EEF2F6] text-[#526176]",
  Normal: "bg-[#EEF5FF] text-[#418BFF]",
  Urgent: "bg-[#FFF1E9] text-[#D95717]",
};

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type TaskDetailModalProps = {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onApprove?: () => void;
  approving?: boolean;
  onDelete?: () => void;
  deleting?: boolean;
  onOpenChat?: () => void;
  commentCount?: number;
  /** Who it went to, or who it came from. */
  metaLabel?: string;
};

export function TaskDetailModal({
  task,
  open,
  onClose,
  onApprove,
  approving = false,
  onDelete,
  deleting = false,
  onOpenChat,
  commentCount = 0,
  metaLabel = "Assigned to",
}: TaskDetailModalProps) {
  const [files, setFiles] = React.useState<EvidenceFile[]>([]);
  const [loadingFiles, setLoadingFiles] = React.useState(true);

  const taskId = task?.id ?? null;

  React.useEffect(() => {
    if (!open || !taskId) return;

    let cancelled = false;
    setLoadingFiles(true);
    setFiles([]);

    loadEvidenceUrls({ assignedTaskId: taskId })
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
  }, [open, taskId]);

  React.useEffect(() => {
    if (!open) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  const hasFlow =
    Boolean(task) &&
    Array.isArray(task?.flow_steps) &&
    task.flow_steps.length > 0;

  const canApprove =
    Boolean(onApprove) && task?.status === "Done" && !task?.approved_at;

  return (
    <AnimatePresence>
      {open && task && (
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
                  className={`rounded-full px-2.5 py-1 text-[14px] font-medium ${
                    task.task_type === "Feature"
                      ? "bg-[#F0EDFF] text-[#5B44BE]"
                      : "bg-[#EEF2F6] text-[#526176]"
                  }`}
                >
                  {task.task_type}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-[14px] font-medium ${priorityStyles[task.priority]}`}
                >
                  {task.priority}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-[14px] font-medium ${taskStatusStyles[task.status]}`}
                >
                  {task.approved_at ? "Approved" : task.status}
                </span>
              </div>

              <h2 className="mt-2.5 text-[24px] font-semibold leading-[1.25] tracking-[-0.02em] text-[#1A1A2E]">
                {task.title}
              </h2>
            </div>

            {/* Body */}
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-[#DCE4EE] bg-white p-4">
                  <span className="text-[#3B82C4]">
                    <UserRoundIcon aria-hidden="true" size={17} />
                  </span>
                  <p className="mt-2 text-[16px] font-normal text-[#8291A5]">
                    {metaLabel}
                  </p>
                  <p className="mt-0.5 text-[16px] font-medium capitalize text-[#1A1A2E]">
                    {task.assigned_to}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#DCE4EE] bg-white p-4">
                  <span className="text-[#3B82C4]">
                    <CalendarIcon aria-hidden="true" size={17} />
                  </span>
                  <p className="mt-2 text-[16px] font-normal text-[#8291A5]">
                    Due
                  </p>
                  <p className="mt-0.5 text-[16px] font-medium text-[#1A1A2E]">
                    {task.due_date ? formatDate(task.due_date) : "No date"}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-[#DCE4EE] bg-white p-4">
                <p className="text-[16px] font-medium text-[#5B6B82]">
                  Description
                </p>
                <p className="mt-1.5 whitespace-pre-line text-[18px] font-normal leading-[1.6] text-[#1A1A2E]">
                  {task.description}
                </p>
              </div>

              {hasFlow && (
                <div className="rounded-2xl border border-[#DCE4EE] bg-white p-4">
                  <p className="text-[16px] font-medium text-[#5B6B82]">
                    The flow
                  </p>
                  <ol className="mt-3 space-y-3">
                    {task.flow_steps.map((step, index) => (
                      <li className="flex gap-3" key={index}>
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#1E3A8A] text-[14px] font-medium text-white">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[16px] font-medium text-[#1A1A2E]">
                            {step.from || "?"} to {step.to || "?"}
                          </p>
                          {step.action && (
                            <p className="mt-0.5 text-[16px] font-normal leading-[1.5] text-[#6B7A90]">
                              {step.action}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>

                  {task.flow_notes && (
                    <p className="mt-3 whitespace-pre-line border-t border-[#DCE4EE] pt-3 text-[16px] font-normal leading-[1.6] text-[#6B7A90]">
                      {task.flow_notes}
                    </p>
                  )}
                </div>
              )}

              {task.definition_of_done && (
                <div className="rounded-2xl border border-[#C9E9E1] bg-[#F1FCF8] p-4">
                  <p className="text-[16px] font-medium text-[#0F766E]">
                    Done when
                  </p>
                  <p className="mt-1.5 whitespace-pre-line text-[16px] font-normal leading-[1.6] text-[#0F766E]">
                    {task.definition_of_done}
                  </p>
                </div>
              )}

              {task.reference_link && (
                <a
                  className="inline-flex items-center gap-2 text-[16px] font-medium text-[#418BFF] hover:underline"
                  href={task.reference_link}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Reference
                  <ExternalLinkIcon size={16} strokeWidth={2.25} />
                </a>
              )}

              {/* Proof */}
              <div className="rounded-2xl border border-[#DCE4EE] bg-white p-4">
                <p className="text-[16px] font-medium text-[#5B6B82]">Proof</p>

                {loadingFiles && (
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
                    Nothing attached yet.
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

              {onOpenChat && (
                <button
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#DCE4EE] bg-white px-4 py-3.5 text-[16px] font-medium text-[#418BFF] transition-colors hover:bg-[#F8FAFC]"
                  onClick={onOpenChat}
                  type="button"
                >
                  <MessageSquareIcon size={18} strokeWidth={2.25} />
                  Messages
                  {commentCount > 0 && (
                    <span className="rounded-full bg-[#418BFF] px-2 py-0.5 text-[14px] font-medium text-white">
                      {commentCount}
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* Actions */}
            {(canApprove || onDelete) && (
              <div className="shrink-0 border-t border-[#DCE4EE] bg-white px-5 py-4">
                <div className="flex gap-3">
                  {onDelete && (
                    <button
                      className="flex items-center justify-center gap-2 rounded-xl border border-[#DCE4EE] px-5 py-3 text-[16px] font-medium text-[#DC2626] transition-colors hover:bg-[#FEE2E2] disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={deleting}
                      onClick={onDelete}
                      type="button"
                    >
                      {deleting ? (
                        <LoaderIcon
                          className="animate-spin"
                          size={16}
                          strokeWidth={2.25}
                        />
                      ) : (
                        <Trash2Icon size={16} strokeWidth={2.25} />
                      )}
                      Delete
                    </button>
                  )}

                  {canApprove && (
                    <button
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#16A34A] px-5 py-3 text-[16px] font-medium text-white transition-colors hover:bg-[#128A3E] disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={approving}
                      onClick={onApprove}
                      type="button"
                    >
                      {approving ? (
                        <LoaderIcon
                          className="animate-spin"
                          size={16}
                          strokeWidth={2.25}
                        />
                      ) : (
                        <CheckIcon size={16} strokeWidth={2.5} />
                      )}
                      Approve
                    </button>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
