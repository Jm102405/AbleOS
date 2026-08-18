import { CalendarIcon, ChevronRightIcon, PaperclipIcon } from "lucide-react";
import type { DailyTask } from "./useDailyTasks";
import { describeDue } from "./dueDate";
/** Today as YYYY-MM-DD in the viewer's timezone. */
function todayYmd() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Colour by state. Green only once the work is actually finished. */
type Tone = { bar: string; chip: string; label: string };

const TONES: Record<DailyTask["state"], Tone> = {
  draft: {
    bar: "bg-[#94A3B8]",
    chip: "bg-[#94A3B8] text-white",
    label: "Draft",
  },
  in_progress: {
    bar: "bg-[#418BFF]",
    chip: "bg-[#418BFF] text-white",
    label: "In progress",
  },
  completed: {
    bar: "bg-[#16A34A]",
    chip: "bg-[#16A34A] text-white",
    label: "Completed",
  },
};

/** First sentence only. CSS truncates further if that sentence is long. */
function firstSentence(text: string | null) {
  const trimmed = (text ?? "").trim();
  if (!trimmed) return "";

  const match = trimmed.match(/^[^.!?]+[.!?]/);
  if (!match) return trimmed;

  const sentence = match[0].trim();
  return sentence.length < trimmed.length ? `${sentence} ...` : sentence;
}

/** Viewer's own timezone, on purpose. */
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type DailyTaskRowProps = {
  task: DailyTask;
  onOpen: (task: DailyTask) => void;
};

export function DailyTaskRow({ task, onOpen }: DailyTaskRowProps) {
  const tone = TONES[task.state];
  const summary = firstSentence(task.description);
  const fileCount = task.files?.length ?? 0;

  const dateLabel = task.completed_at
    ? `Done ${formatDate(task.completed_at)}`
    : `Started ${formatDate(task.created_at)}`;
  // A finished task can't be late, so never flag it red.
  const due =
    task.state === "completed" ? null : describeDue(task.due_on, todayYmd());

  return (
    <button
      className="flex w-full cursor-pointer items-stretch gap-3 overflow-hidden rounded-2xl border border-[#DCE4EE] bg-white text-left shadow-[0_4px_12px_rgba(30,58,138,0.045)] transition-all hover:-translate-y-0.5 hover:border-[#B7C7DC] hover:shadow-[0_8px_18px_rgba(30,58,138,0.1)] active:translate-y-0"
      onClick={() => onOpen(task)}
      type="button"
    >
      <span aria-hidden="true" className={`w-1.5 shrink-0 ${tone.bar}`} />

      <span className="min-w-0 flex-1 py-4 pr-2">
        <span className="block truncate text-[18px] font-bold leading-[1.35] tracking-[-0.01em] text-[#1A1A2E]">
          {task.title}
        </span>

        {summary && (
          <span className="mt-1 block truncate text-[16px] font-normal leading-[1.5] text-[#8291A5]">
            {summary}
          </span>
        )}

        <span className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#64748B]">
            <CalendarIcon aria-hidden="true" size={15} strokeWidth={2.25} />
            {dateLabel}
          </span>

          {fileCount > 0 && (
            <span className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#64748B]">
              <PaperclipIcon aria-hidden="true" size={15} strokeWidth={2.25} />
              {fileCount}
            </span>
          )}
        </span>

        <span className="mt-2 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-[14px] font-medium ${tone.chip}`}
          >
            {tone.label}
          </span>

          {task.priority === "Urgent" && (
            <span className="rounded-full bg-[#DC2626] px-2.5 py-0.5 text-[14px] font-medium text-white">
              Urgent
            </span>
          )}
          {due && (
            <span
              className={`rounded-full px-2.5 py-0.5 text-[14px] font-medium ${
                due.overdue
                  ? "bg-[#FEE2E2] text-[#DC2626]"
                  : "bg-[#F1F5F9] text-[#64748B]"
              }`}
            >
              {due.label}
            </span>
          )}
        </span>
      </span>

      <span className="flex shrink-0 items-center pr-4">
        <ChevronRightIcon
          aria-hidden="true"
          className="text-[#C3CEDC]"
          size={20}
          strokeWidth={2.25}
        />
      </span>
    </button>
  );
}
