import { ChevronRightIcon } from "lucide-react";
import type { Task } from "./TaskCard";

type TaskRowProps = {
  task: Task;
  onOpen: (task: Task) => void;
};

/**
 * Deliberately shows the title and nothing else. Everything lives in the
 * detail sheet. The chevron, the hover lift and the pointer cursor are the
 * three cues that say "this opens something".
 */
export function TaskRow({ task, onOpen }: TaskRowProps) {
  return (
    <button
      className="flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-[#DCE4EE] bg-white px-4 py-4 text-left shadow-[0_4px_12px_rgba(30,58,138,0.045)] transition-all hover:-translate-y-0.5 hover:border-[#B7C7DC] hover:shadow-[0_8px_18px_rgba(30,58,138,0.1)] active:translate-y-0 sm:px-5"
      onClick={() => onOpen(task)}
      type="button"
    >
      <span className="min-w-0 flex-1 text-[18px] font-medium leading-[1.4] tracking-[-0.01em] text-[#1A1A2E]">
        {task.title}
      </span>

      <ChevronRightIcon
        aria-hidden="true"
        className="shrink-0 text-[#C3CEDC]"
        size={20}
        strokeWidth={2.25}
      />
    </button>
  );
}
