import React from "react";
import { ChevronDownIcon, ExternalLinkIcon, LoaderIcon } from "lucide-react";

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
};

export function TaskCard({ task, saving, onStatusChange }: TaskCardProps) {
  const [expanded, setExpanded] = React.useState(false);
  const hasFlow = Array.isArray(task.flow_steps) && task.flow_steps.length > 0;

  return (
    <article className="rounded-2xl border border-[#DCE4EE] bg-white shadow-[0_5px_14px_rgba(30,58,138,0.055)]">
      <div className="px-4 py-4 sm:px-5">
        <div className="flex items-start gap-2">
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ${
              task.task_type === "Feature"
                ? "bg-[#F0EDFF] text-[#5B44BE]"
                : "bg-[#EEF2F6] text-[#526176]"
            }`}
          >
            {task.task_type}
          </span>
          <h3 className="min-w-0 flex-1 text-[13px] font-extrabold leading-snug tracking-[-0.015em] text-[#1A1A2E] sm:text-[14px]">
            {task.title}
          </h3>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ${priorityStyles[task.priority]}`}
          >
            {task.priority}
          </span>
        </div>

        <p className="mt-2 text-[11px] font-medium leading-snug text-[#6B7A90] sm:text-[12px]">
          {expanded ? "" : task.description.slice(0, 120)}
          {!expanded && task.description.length > 120 ? "..." : ""}
        </p>

        {expanded && (
          <div className="mt-2 space-y-4">
            <p className="whitespace-pre-line text-[12px] font-medium leading-relaxed text-[#526176]">
              {task.description}
            </p>

            {hasFlow && (
              <div className="rounded-xl border border-[#DCE4EE] bg-[#F8FAFC] p-3.5">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#5B6B82]">
                  The flow
                </p>
                <ol className="mt-2.5 space-y-2">
                  {task.flow_steps.map((step, index) => (
                    <li className="flex gap-2.5" key={index}>
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-[#1E3A8A] text-[9px] font-extrabold text-white">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[11px] font-extrabold text-[#1A1A2E]">
                          {step.from || "?"} to {step.to || "?"}
                        </p>
                        {step.action && (
                          <p className="mt-0.5 text-[11px] font-medium leading-snug text-[#6B7A90]">
                            {step.action}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>

                {task.flow_notes && (
                  <p className="mt-3 whitespace-pre-line border-t border-[#DCE4EE] pt-2.5 text-[11px] font-medium leading-relaxed text-[#6B7A90]">
                    {task.flow_notes}
                  </p>
                )}
              </div>
            )}

            {task.definition_of_done && (
              <div className="rounded-xl border border-[#C9E9E1] bg-[#F1FCF8] p-3.5">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#0F766E]">
                  Done when
                </p>
                <p className="mt-1.5 whitespace-pre-line text-[11px] font-medium leading-relaxed text-[#0F766E]">
                  {task.definition_of_done}
                </p>
              </div>
            )}

            {task.reference_link && (
              <a
                className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-[#418BFF] hover:underline"
                href={task.reference_link}
                rel="noopener noreferrer"
                target="_blank"
              >
                Reference
                <ExternalLinkIcon size={12} strokeWidth={2.5} />
              </a>
            )}
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-bold uppercase tracking-wide text-[#8A99AC]">
          <span>From Raj</span>
          {task.due_date && <span>Due {formatDate(task.due_date)}</span>}
          <button
            className="ml-auto inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wide text-[#418BFF] hover:underline"
            onClick={() => setExpanded((value) => !value)}
            type="button"
          >
            {expanded ? "Less" : "Details"}
            <ChevronDownIcon
              className={expanded ? "rotate-180 transition-transform" : "transition-transform"}
              size={12}
              strokeWidth={2.5}
            />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto border-t border-[#E6ECF2] px-4 py-2.5 sm:px-5">
        {saving ? (
          <span className="flex items-center gap-2 text-[11px] font-bold text-[#5B6B82]">
            <LoaderIcon className="animate-spin" size={13} strokeWidth={2.5} />
            Saving...
          </span>
        ) : (
          TASK_STATUSES.map((status) => {
            const active = task.status === status;
            return (
              <button
                className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide transition-colors ${
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
    </article>
  );
}