import React from "react";
import {
  CheckIcon,
  ChevronDownIcon,
  ExternalLinkIcon,
  FileTextIcon,
  LoaderIcon,
  MessageSquareIcon,
  PaperclipIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import {
  ACCEPT_ATTRIBUTE,
  loadEvidenceUrls,
  uploadEvidence,
  type EvidenceFile,
} from "../dailytasks/evidence";

export type FlowStep = { from: string; to: string; action: string };

export type Task = {
  id: string;
  assigned_to: string;
  created_by: string;
  task_type: "Task" | "Feature";
  title: string;
  description: string;
  definition_of_done: string | null;
  reference_link: string | null;
  flow_steps: FlowStep[];
  flow_notes: string | null;
  priority: "Low" | "Normal" | "Urgent";
  due_date: string | null;
  status: "Not started" | "In progress" | "Blocked" | "Done";
  created_at: string;
  /** Raj's sign-off. Only then does it count toward Dane's progress. */
  approved_at: string | null;
  approved_on: string | null;
  approved_by: string | null;
};

export const TASK_STATUSES: Task["status"][] = [
  "Not started",
  "In progress",
  "Blocked",
  "Done",
];

export const taskStatusStyles: Record<Task["status"], string> = {
  "Not started": "bg-[#EEF2F6] text-[#526176]",
  "In progress": "bg-[#EEF5FF] text-[#418BFF]",
  Blocked: "bg-[#FFF1E9] text-[#D95717]",
  Done: "bg-[#EAF8EF] text-[#16A34A]",
};

const priorityStyles: Record<Task["priority"], string> = {
  Low: "bg-[#EEF2F6] text-[#526176]",
  Normal: "bg-[#EEF5FF] text-[#418BFF]",
  Urgent: "bg-[#FFF1E9] text-[#D95717]",
};

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

type TaskCardProps = {
  task: Task;
  saving: boolean;
  onStatusChange: (status: Task["status"]) => void;
  /** Shown bottom-left. Raj sees who it went to; staff see who sent it. */
  metaLabel?: string;
  /** Raj's view: status is display-only, with a delete action instead. */
  readOnly?: boolean;
  onDelete?: () => void;
  deleting?: boolean;
  onOpenChat?: () => void;
  commentCount?: number;
  /** Raj only. Appears once the task is Done and not yet approved. */
  onApprove?: () => void;
  approving?: boolean;
  /** Opened straight from a notification: expand and scroll to it. */
  defaultExpanded?: boolean;
};

export function TaskCard({
  task,
  saving,
  onStatusChange,
  metaLabel = "From Raj",
  readOnly = false,
  onDelete,
  deleting = false,
  onOpenChat,
  commentCount = 0,
  onApprove,
  approving = false,
  defaultExpanded = false,
}: TaskCardProps) {
  const [expanded, setExpanded] = React.useState(defaultExpanded);
  const articleRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    if (!defaultExpanded) return;
    setExpanded(true);
    // Wait a frame so the expanded content has laid out before measuring.
    requestAnimationFrame(() => {
      articleRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [defaultExpanded]);
  const hasFlow = Array.isArray(task.flow_steps) && task.flow_steps.length > 0;

  const [files, setFiles] = React.useState<EvidenceFile[]>([]);
  const [uploading, setUploading] = React.useState(0);
  const [pending, setPending] = React.useState<File[]>([]);
  const [fileError, setFileError] = React.useState("");
  // Starts true so the first paint says "loading", never "nothing attached".
  const [loadingFiles, setLoadingFiles] = React.useState(true);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const refreshFiles = React.useCallback(async () => {
    setLoadingFiles(true);
    try {
      setFiles(await loadEvidenceUrls({ assignedTaskId: task.id }));
    } catch (err) {
      console.error("Could not load evidence:", err);
    } finally {
      setLoadingFiles(false);
    }
  }, [task.id]);

  // Only fetch when someone opens Details. Signed URLs are minted per file,
  // so loading them for every card in the list would be wasteful.
  React.useEffect(() => {
    if (!expanded) return;
    refreshFiles();
  }, [expanded, refreshFiles]);

  const previews = React.useMemo(
    () => pending.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [pending],
  );

  // Object URLs leak memory until revoked.
  React.useEffect(
    () => () => previews.forEach((item) => URL.revokeObjectURL(item.url)),
    [previews],
  );

  function handleFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!picked.length) return;

    setFileError("");
    setPending((current) => [...current, ...picked]);
  }

  function removePending(index: number) {
    setPending((current) => current.filter((_, position) => position !== index));
  }

  /** Nothing is stored until this runs. Raj is told once, at the end. */
  async function submitPending() {
    if (!pending.length) return;

    setFileError("");
    setUploading(pending.length);

    let sent = 0;
    const batch = pending;

    for (let index = 0; index < batch.length; index += 1) {
      try {
        await uploadEvidence({ assignedTaskId: task.id }, batch[index], {
          notify: index === batch.length - 1,
        });
        sent += 1;
      } catch (err) {
        setFileError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading((current) => current - 1);
      }
    }

    if (sent > 0) setPending([]);
    await refreshFiles();
  }

  return (
    <article
      className="rounded-2xl border border-[#DCE4EE] bg-white shadow-[0_5px_14px_rgba(30,58,138,0.055)]"
      ref={articleRef}
    >
      <div className="px-4 py-4 sm:px-5">
        <div className="flex items-start gap-2">
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[14px] font-semibold tracking-wide ${
              task.task_type === "Feature"
                ? "bg-[#F0EDFF] text-[#5B44BE]"
                : "bg-[#EEF2F6] text-[#526176]"
            }`}
          >
            {task.task_type}
          </span>
          <h3 className="min-w-0 flex-1 text-[18px] font-semibold leading-snug tracking-[-0.015em] text-[#1A1A2E]">
            {task.title}
          </h3>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[14px] font-semibold tracking-wide ${priorityStyles[task.priority]}`}
          >
            {task.priority}
          </span>
        </div>

        <p className="mt-2 text-[16px] font-medium leading-snug text-[#6B7A90]">
          {expanded ? "" : task.description.slice(0, 120)}
          {!expanded && task.description.length > 120 ? "..." : ""}
        </p>

        {expanded && (
          <div className="mt-2 space-y-4">
            <p className="whitespace-pre-line text-[16px] font-medium leading-relaxed text-[#526176]">
              {task.description}
            </p>

            {hasFlow && (
              <div className="rounded-xl border border-[#DCE4EE] bg-[#F8FAFC] p-3.5">
                <p className="text-[16px] font-semibold tracking-[0.08em] text-[#5B6B82]">
                  The flow
                </p>
                <ol className="mt-2.5 space-y-2">
                  {task.flow_steps.map((step, index) => (
                    <li className="flex gap-2.5" key={index}>
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-[#1E3A8A] text-[14px] font-semibold text-white">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[16px] font-semibold text-[#1A1A2E]">
                          {step.from || "?"} to {step.to || "?"}
                        </p>
                        {step.action && (
                          <p className="mt-0.5 text-[16px] font-medium leading-snug text-[#6B7A90]">
                            {step.action}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>

                {task.flow_notes && (
                  <p className="mt-3 whitespace-pre-line border-t border-[#DCE4EE] pt-2.5 text-[16px] font-medium leading-relaxed text-[#6B7A90]">
                    {task.flow_notes}
                  </p>
                )}
              </div>
            )}

            {task.definition_of_done && (
              <div className="rounded-xl border border-[#C9E9E1] bg-[#F1FCF8] p-3.5">
                <p className="text-[16px] font-semibold tracking-[0.08em] text-[#0F766E]">
                  Done when
                </p>
                <p className="mt-1.5 whitespace-pre-line text-[16px] font-medium leading-relaxed text-[#0F766E]">
                  {task.definition_of_done}
                </p>
              </div>
            )}

            {task.reference_link && (
              <a
                className="inline-flex items-center gap-1.5 text-[16px] font-semibold text-[#418BFF] hover:underline"
                href={task.reference_link}
                rel="noopener noreferrer"
                target="_blank"
              >
                Reference
                <ExternalLinkIcon size={12} strokeWidth={2.5} />
              </a>
            )}

            <div className="rounded-xl border border-[#DCE4EE] bg-[#F8FAFC] p-3.5">
              <p className="text-[16px] font-semibold tracking-[0.08em] text-[#5B6B82]">
                Proof
              </p>

              {!readOnly && (
                <>
                  <input
                    accept={ACCEPT_ATTRIBUTE}
                    className="hidden"
                    multiple
                    onChange={handleFiles}
                    ref={inputRef}
                    type="file"
                  />

                  <button
                    className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-dashed border-[#B7C7DC] px-3 py-2 text-[16px] font-semibold tracking-wide text-[#526176] transition-colors hover:border-[#1E3A8A] hover:text-[#1E3A8A] disabled:opacity-60"
                    disabled={uploading > 0}
                    onClick={() => inputRef.current?.click()}
                    type="button"
                  >
                    <PaperclipIcon size={11} strokeWidth={2.5} />
                    Add photo or PDF
                  </button>

                  {previews.length > 0 && (
                    <>
                      <div className="mt-2.5 grid grid-cols-3 gap-2">
                        {previews.map((item, index) => (
                          <div
                            className="relative overflow-hidden rounded-xl border border-[#DCE4EE] bg-white"
                            key={`${item.file.name}-${index}`}
                          >
                            {item.file.type.startsWith("image/") ? (
                              <img
                                alt={item.file.name}
                                className="h-20 w-full bg-[#F1F5F9] object-contain"
                                src={item.url}
                              />
                            ) : (
                              <div className="flex h-20 flex-col items-center justify-center gap-1 text-[#526176]">
                                <FileTextIcon size={16} strokeWidth={2.5} />
                                <span className="text-[8px] font-medium">PDF</span>
                              </div>
                            )}

                            <button
                              aria-label={`Remove ${item.file.name}`}
                              className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-white/90 text-[#DC2626] shadow-sm transition-colors hover:bg-white"
                              disabled={uploading > 0}
                              onClick={() => removePending(index)}
                              type="button"
                            >
                              <XIcon size={11} strokeWidth={3} />
                            </button>
                          </div>
                        ))}
                      </div>

                      <button
                        className="mt-2.5 inline-flex items-center gap-1.5 rounded-xl bg-[#1E3A8A] px-3 py-2 text-[16px] font-semibold tracking-wide text-white transition-colors hover:bg-[#172F6E] disabled:opacity-60"
                        disabled={uploading > 0}
                        onClick={submitPending}
                        type="button"
                      >
                        {uploading > 0 ? (
                          <>
                            <LoaderIcon
                              className="animate-spin"
                              size={11}
                              strokeWidth={2.5}
                            />
                            Sending {uploading}
                          </>
                        ) : (
                          <>
                            <PaperclipIcon size={11} strokeWidth={2.5} />
                            Submit {previews.length} to Raj
                          </>
                        )}
                      </button>
                    </>
                  )}
                </>
              )}

              {fileError && (
                <p className="mt-2 text-[16px] font-medium text-[#DC2626]">
                  {fileError}
                </p>
              )}

              {files.length > 0 ? (
                <div className="mt-2.5 grid grid-cols-2 gap-2">
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
                          className="h-28 w-full bg-[#F1F5F9] object-contain"
                          src={file.url}
                        />
                      </a>
                    ) : (
                      <a
                        className="flex h-28 flex-col items-center justify-center gap-1 rounded-xl border border-[#DCE4EE] bg-white text-[#526176]"
                        href={file.url}
                        key={file.id}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        <FileTextIcon size={18} strokeWidth={2.5} />
                        <span className="text-[8px] font-medium">PDF</span>
                      </a>
                    ),
                  )}
                </div>
              ) : loadingFiles ? (
                <p className="mt-2 flex items-center gap-1.5 text-[16px] font-medium text-[#A3B0C0]">
                  <LoaderIcon
                    className="animate-spin"
                    size={11}
                    strokeWidth={2.5}
                  />
                  Loading proof...
                </p>
              ) : (
                <p className="mt-2 text-[16px] font-medium text-[#A3B0C0]">
                  Nothing attached yet.
                </p>
              )}
            </div>
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[16px] font-medium tracking-wide text-[#8A99AC]">
          <span>{metaLabel}</span>
          {task.due_date && <span>Due {formatDate(task.due_date)}</span>}
          {onOpenChat && (
            <button
              className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-[#EEF5FF] px-2.5 py-1 text-[16px] font-semibold tracking-wide text-[#418BFF] transition-colors hover:bg-[#DBEAFE]"
              onClick={onOpenChat}
              type="button"
            >
              <MessageSquareIcon size={11} strokeWidth={2.75} />
              Chat
              {commentCount > 0 && (
                <span className="rounded-full bg-[#418BFF] px-1.5 text-[14px] font-semibold text-white">
                  {commentCount}
                </span>
              )}
            </button>
          )}
          <button
            className={`inline-flex items-center gap-1 text-[16px] font-semibold tracking-wide text-[#418BFF] hover:underline ${
              onOpenChat ? "" : "ml-auto"
            }`}
            onClick={() => setExpanded((value) => !value)}
            type="button"
          >
            {expanded ? "Less" : "Details"}
            <ChevronDownIcon
              className={
                expanded
                  ? "rotate-180 transition-transform"
                  : "transition-transform"
              }
              size={12}
              strokeWidth={2.5}
            />
          </button>
        </div>
      </div>

      {readOnly ? (
        <div className="flex items-center justify-between gap-3 border-t border-[#E6ECF2] px-4 py-2.5 sm:px-5">
          <span
            className={`rounded-full px-2.5 py-1 text-[16px] font-semibold tracking-wide ${taskStatusStyles[task.status]}`}
          >
            {task.approved_at ? "Approved" : task.status}
          </span>

          {onApprove && task.status === "Done" && !task.approved_at && (
            <button
              className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-[#16A34A] px-3 py-1.5 text-[16px] font-semibold tracking-wide text-white transition-colors hover:bg-[#128A3E] disabled:opacity-60"
              disabled={approving}
              onClick={onApprove}
              type="button"
            >
              {approving ? (
                <LoaderIcon
                  className="animate-spin"
                  size={11}
                  strokeWidth={2.5}
                />
              ) : (
                <CheckIcon size={11} strokeWidth={3} />
              )}
              Approve
            </button>
          )}

          {onDelete && (
            <button
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[16px] font-semibold tracking-wide text-[#DC2626] transition-colors hover:bg-[#FEE2E2] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={deleting}
              onClick={onDelete}
              type="button"
            >
              {deleting ? (
                <LoaderIcon
                  className="animate-spin"
                  size={12}
                  strokeWidth={2.5}
                />
              ) : (
                <Trash2Icon size={12} strokeWidth={2.5} />
              )}
              Delete
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-1.5 overflow-x-auto border-t border-[#E6ECF2] px-4 py-2.5 sm:px-5">
          {task.approved_at && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#EAF8EF] px-2.5 py-1 text-[16px] font-semibold tracking-wide text-[#16A34A]">
              <CheckIcon size={10} strokeWidth={3} />
              Approved
            </span>
          )}
          {saving ? (
            <span className="flex items-center gap-2 text-[16px] font-medium text-[#5B6B82]">
              <LoaderIcon
                className="animate-spin"
                size={13}
                strokeWidth={2.5}
              />
              Saving...
            </span>
          ) : (
            TASK_STATUSES.map((status) => {
              const active = task.status === status;
              return (
                <button
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[16px] font-semibold tracking-wide transition-colors ${
                    active
                      ? taskStatusStyles[status]
                      : "text-[#A3B0C0] hover:bg-[#F1F5F9]"
                  }`}
                  key={status}
                  onClick={() => !active && onStatusChange(status)}
                  type="button"
                >
                  {status}
                </button>
              );
            })
          )}
        </div>
      )}
    </article>
  );
}