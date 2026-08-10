import {
  CalendarIcon,
  ChevronRightIcon,
  MessageSquareIcon,
} from "lucide-react";
import type { Task } from "./TaskCard";

/**
 * Colour carries meaning here, so it is chosen for what the reader should
 * feel, not for variety. Amber is the only one that means "you owe someone
 * something" - a task marked done is sitting waiting on Raj.
 */
type Tone = { bar: string; chip: string; label: string };

function toneFor(task: Task, waitingLabel: string): Tone {
  if (task.approved_at) {
    return {
      bar: "bg-[#16A34A]",
      chip: "bg-[#16A34A] text-white",
      label: "Approved",
    };
  }

  switch (task.status) {
    case "Done":
      return {
        bar: "bg-[#D97706]",
        chip: "bg-[#D97706] text-white",
        label: waitingLabel,
      };
    case "Blocked":
      return {
        bar: "bg-[#DC2626]",
        chip: "bg-[#DC2626] text-white",
        label: "Blocked",
      };
    case "In progress":
      return {
        bar: "bg-[#418BFF]",
        chip: "bg-[#418BFF] text-white",
        label: "In progress",
      };
    default:
      return {
        bar: "bg-[#94A3B8]",
        chip: "bg-[#94A3B8] text-white",
        label: "Not started",
      };
  }
}

/** First sentence only. CSS truncates further if that sentence is long. */
function firstSentence(text: string) {
  const trimmed = (text ?? "").trim();
  if (!trimmed) return "";

  const match = trimmed.match(/^[^.!?]+[.!?]/);
  if (!match) return trimmed;

  const sentence = match[0].trim();
  return sentence.length < trimmed.length ? `${sentence} ...` : sentence;
}

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type TaskRowProps = {
  task: Task;
  onOpen: (task: Task) => void;
  commentCount?: number;
  /** Raj sees "Waiting on you". Dane sees "Waiting on Raj". */
  waitingLabel?: string;
};

export function TaskRow({
  task,
  onOpen,
  commentCount = 0,
  waitingLabel = "Waiting on you",
}: TaskRowProps) {
  const tone = toneFor(task, waitingLabel);
  const summary = firstSentence(task.description);

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

        <span className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {task.due_date && (
            <span className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#64748B]">
              <CalendarIcon aria-hidden="true" size={15} strokeWidth={2.25} />
              {formatDate(task.due_date)}
            </span>
          )}

          {commentCount > 0 && (
            <span className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#64748B]">
              <MessageSquareIcon
                aria-hidden="true"
                size={15}
                strokeWidth={2.25}
              />
              {commentCount}
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
