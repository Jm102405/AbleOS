import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FileTextIcon,
  LoaderIcon,
  PaperclipIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import {
  ACCEPT_ATTRIBUTE,
  deleteEvidence,
  loadEvidenceUrls,
  uploadEvidence,
  type EvidenceFile,
} from "./evidence";
import type { DailyTask } from "./useDailyTasks";

type CompleteDailyTaskModalProps = {
  open: boolean;
  task: DailyTask | null;
  onClose: () => void;
  onComplete: (id: string, note: string) => Promise<unknown>;
};

function readableSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CompleteDailyTaskModal({
  open,
  task,
  onClose,
  onComplete,
}: CompleteDailyTaskModalProps) {
  const [note, setNote] = React.useState("");
  const [files, setFiles] = React.useState<EvidenceFile[]>([]);
  const [uploading, setUploading] = React.useState(0);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const taskId = task?.id ?? null;

  const refreshFiles = React.useCallback(async () => {
    if (!taskId) return;
    try {
      setFiles(await loadEvidenceUrls(taskId));
    } catch (err) {
      console.error("Could not load evidence:", err);
    }
  }, [taskId]);

  React.useEffect(() => {
    if (!open || !taskId) return;
    setNote("");
    setError("");
    setFiles([]);
    refreshFiles();
  }, [open, taskId, refreshFiles]);

  React.useEffect(() => {
    if (!open) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !saving && !uploading) onClose();
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose, saving, uploading]);

  async function handleFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(event.target.files ?? []);
    if (!picked.length || !taskId) return;

    // Clear immediately so picking the same file twice still fires onChange.
    event.target.value = "";
    setError("");
    setUploading(picked.length);

    for (const file of picked) {
      try {
        await uploadEvidence(taskId, file);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading((current) => current - 1);
      }
    }

    await refreshFiles();
  }

  async function handleRemove(fileId: string) {
    try {
      await deleteEvidence(fileId);
      setFiles((current) => current.filter((file) => file.id !== fileId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove it");
    }
  }

  async function handleDone() {
    if (!taskId) return;
    setSaving(true);
    setError("");

    try {
      await onComplete(taskId, note.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save that.");
    } finally {
      setSaving(false);
    }
  }

  const busy = saving || uploading > 0;

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
            className="flex max-h-full w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-[0_20px_40px_rgba(30,58,138,0.18)]"
            exit={{ opacity: 0, y: 12 }}
            initial={{ opacity: 0, y: 12 }}
            onClick={(event) => event.stopPropagation()}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="shrink-0 border-b border-[#DCE4EE] px-5 pb-4 pt-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#5B6B82]">
                    Mark as done
                  </p>
                  <h2 className="mt-1 truncate text-[18px] font-extrabold tracking-[-0.025em] text-[#1A1A2E]">
                    {task.title}
                  </h2>
                </div>
                <button
                  aria-label="Close"
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[#93A3B8] transition-colors hover:bg-[#F1F5F9]"
                  disabled={busy}
                  onClick={onClose}
                  type="button"
                >
                  <XIcon aria-hidden="true" size={16} />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
              <label className="block" htmlFor="daily-task-note">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#8291A5]">
                  What did you do?
                </span>
                <textarea
                  className="mt-1.5 w-full resize-none rounded-xl border border-[#DCE4EE] bg-[#F8FAFC] px-3 py-2.5 text-[13px] font-medium leading-relaxed text-[#1A1A2E] outline-none transition-colors focus:border-[#1E3A8A] focus:bg-white"
                  disabled={busy}
                  id="daily-task-note"
                  maxLength={2000}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Optional. A line for Raj."
                  rows={3}
                  value={note}
                />
              </label>

              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#8291A5]">
                  Proof
                </span>

                <input
                  accept={ACCEPT_ATTRIBUTE}
                  className="hidden"
                  multiple
                  onChange={handleFiles}
                  ref={inputRef}
                  type="file"
                />

                <button
                  className="mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#B7C7DC] bg-[#F8FAFC] px-3 py-3 text-[11px] font-extrabold uppercase tracking-wide text-[#526176] transition-colors hover:border-[#1E3A8A] hover:text-[#1E3A8A] disabled:opacity-60"
                  disabled={busy}
                  onClick={() => inputRef.current?.click()}
                  type="button"
                >
                  {uploading > 0 ? (
                    <>
                      <LoaderIcon
                        className="animate-spin"
                        size={13}
                        strokeWidth={2.5}
                      />
                      Uploading {uploading}
                    </>
                  ) : (
                    <>
                      <PaperclipIcon size={13} strokeWidth={2.5} />
                      Add photos or PDF
                    </>
                  )}
                </button>

                <p className="mt-1.5 text-[10px] font-medium text-[#A3B0C0]">
                  Optional. Photos are shrunk automatically. PDFs up to 10 MB.
                </p>

                {files.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {files.map((file) => (
                      <div
                        className="group relative overflow-hidden rounded-xl border border-[#DCE4EE] bg-[#F8FAFC]"
                        key={file.id}
                      >
                        {file.mimeType.startsWith("image/") ? (
                          <img
                            alt={file.fileName}
                            className="h-24 w-full bg-[#F1F5F9] object-contain"
                            src={file.url}
                          />
                        ) : (
                          <a
                            className="flex h-20 w-full flex-col items-center justify-center gap-1 text-[#526176]"
                            href={file.url}
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            <FileTextIcon size={18} strokeWidth={2.5} />
                            <span className="px-1 text-center text-[8px] font-bold leading-tight">
                              {readableSize(file.sizeBytes)}
                            </span>
                          </a>
                        )}

                        <button
                          aria-label={`Remove ${file.fileName}`}
                          className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-white/90 text-[#DC2626] shadow-sm transition-colors hover:bg-white"
                          disabled={busy}
                          onClick={() => handleRemove(file.id)}
                          type="button"
                        >
                          <Trash2Icon size={12} strokeWidth={2.5} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {error ? (
                <p className="text-[11px] font-bold text-[#DC2626]">{error}</p>
              ) : null}
            </div>

            <div className="shrink-0 border-t border-[#DCE4EE] px-5 py-4">
              <div className="flex gap-2.5">
                <button
                  className="flex-1 rounded-xl border border-[#DCE4EE] px-3 py-2.5 text-[11px] font-extrabold uppercase tracking-wide text-[#526176] transition-colors hover:bg-[#F1F5F9] disabled:opacity-60"
                  disabled={busy}
                  onClick={onClose}
                  type="button"
                >
                  Not yet
                </button>
                <button
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#16A34A] px-3 py-2.5 text-[11px] font-extrabold uppercase tracking-wide text-white transition-colors hover:bg-[#128A3E] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={busy}
                  onClick={handleDone}
                  type="button"
                >
                  {saving ? (
                    <LoaderIcon
                      className="animate-spin"
                      size={13}
                      strokeWidth={2.5}
                    />
                  ) : null}
                  Done
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
