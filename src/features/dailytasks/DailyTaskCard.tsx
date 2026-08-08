import React from "react";
import {
  CheckIcon,
  FileTextIcon,
  LoaderIcon,
  PaperclipIcon,
  RotateCcwIcon,
} from "lucide-react";
import { loadEvidenceUrls, type EvidenceFile } from "./evidence";
import type { DailyTask } from "./useDailyTasks";

type DailyTaskCardProps = {
  task: DailyTask;
  busy?: boolean;
  /** Omit both handlers for a read-only card. */
  onComplete?: (task: DailyTask) => void;
  onReopen?: (task: DailyTask) => void;
};

/** Rendered in the viewer's own timezone, on purpose. */
function shortTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function DailyTaskCard({
  task,
  busy,
  onComplete,
  onReopen,
}: DailyTaskCardProps) {
  const [expanded, setExpanded] = React.useState(false);
  const [files, setFiles] = React.useState<EvidenceFile[]>([]);
  const [loadingFiles, setLoadingFiles] = React.useState(false);

  const fileCount = task.files?.length ?? 0;
  const done = task.state === "completed";

  async function toggleFiles() {
    const next = !expanded;
    setExpanded(next);

    // Signed URLs expire, so fetch them only when someone actually looks.
    if (next && files.length === 0 && fileCount > 0) {
      setLoadingFiles(true);
      try {
        setFiles(await loadEvidenceUrls(task.id));
      } catch (err) {
        console.error("Could not load evidence:", err);
      } finally {
        setLoadingFiles(false);
      }
    }
  }

  return (
    <article className="rounded-2xl border border-[#DCE4EE] bg-white px-4 py-4 shadow-[0_5px_14px_rgba(30,58,138,0.055)] sm:px-5">
      <div className="flex items-start gap-2">
        <h3 className="min-w-0 flex-1 text-[13px] font-extrabold leading-snug tracking-[-0.015em] text-[#1A1A2E] sm:text-[14px]">
          {task.title}
        </h3>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ${
            task.priority === "Urgent"
              ? "bg-[#FFF1E9] text-[#FF7832]"
              : "bg-[#F1F5F9] text-[#8291A5]"
          }`}
        >
          {task.priority}
        </span>
      </div>

      {task.description ? (
        <p className="mt-1.5 whitespace-pre-line text-[11px] font-medium leading-relaxed text-[#6B7A90] sm:text-[12px]">
          {task.description}
        </p>
      ) : null}

      <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-bold uppercase tracking-wide text-[#A3B0C0]">
        <span>Started {shortTime(task.created_at)}</span>
        {done && task.completed_at ? (
          <span className="text-[#16A34A]">
            · Done {shortTime(task.completed_at)}
          </span>
        ) : null}
      </div>

      {done && task.completion_note ? (
        <p className="mt-2.5 rounded-xl border border-[#DCE4EE] bg-[#F8FAFC] px-3 py-2 text-[11px] font-medium leading-relaxed text-[#526176]">
          {task.completion_note}
        </p>
      ) : null}

      {(fileCount > 0 || onComplete || onReopen) && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {fileCount > 0 && (
            <button
              className="inline-flex items-center gap-1.5 rounded-full bg-[#EEF5FF] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.06em] text-[#418BFF] transition-colors hover:bg-[#DFEBFF]"
              onClick={toggleFiles}
              type="button"
            >
              <PaperclipIcon size={11} strokeWidth={2.5} />
              {fileCount} {fileCount === 1 ? "file" : "files"}
            </button>
          )}

          {onComplete && !done && (
            <button
              className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-[#16A34A] px-3 py-2 text-[10px] font-extrabold uppercase tracking-wide text-white transition-colors hover:bg-[#128A3E] disabled:opacity-60"
              disabled={busy}
              onClick={() => onComplete(task)}
              type="button"
            >
              {busy ? (
                <LoaderIcon
                  className="animate-spin"
                  size={11}
                  strokeWidth={2.5}
                />
              ) : (
                <CheckIcon size={11} strokeWidth={3} />
              )}
              Done
            </button>
          )}

          {onReopen && done && (
            <button
              className="ml-auto inline-flex items-center gap-1.5 rounded-xl border border-[#DCE4EE] px-3 py-2 text-[10px] font-extrabold uppercase tracking-wide text-[#526176] transition-colors hover:bg-[#F1F5F9] disabled:opacity-60"
              disabled={busy}
              onClick={() => onReopen(task)}
              type="button"
            >
              {busy ? (
                <LoaderIcon
                  className="animate-spin"
                  size={11}
                  strokeWidth={2.5}
                />
              ) : (
                <RotateCcwIcon size={11} strokeWidth={2.5} />
              )}
              Reopen
            </button>
          )}
        </div>
      )}

      {expanded && (
        <div className="mt-3">
          {loadingFiles && (
            <p className="text-[11px] font-medium text-[#8A99AC]">
              Loading files...
            </p>
          )}

          {!loadingFiles && files.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
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
                      className="h-40 w-full bg-[#F1F5F9] object-contain"
                      src={file.url}
                    />
                  </a>
                ) : (
                  <a
                    className="flex h-20 flex-col items-center justify-center gap-1 rounded-xl border border-[#DCE4EE] bg-[#F8FAFC] text-[#526176] transition-colors hover:bg-[#F1F5F9]"
                    href={file.url}
                    key={file.id}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <FileTextIcon size={18} strokeWidth={2.5} />
                    <span className="px-1 text-center text-[8px] font-bold leading-tight">
                      PDF
                    </span>
                  </a>
                ),
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
