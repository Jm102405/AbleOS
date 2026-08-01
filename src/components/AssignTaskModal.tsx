import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LoaderIcon, PlusIcon, Trash2Icon, XIcon } from "lucide-react";
import { apiFetch } from "../lib/apiFetch";

const STAFF = [
  { value: "dane", label: "Dane", role: "Integration lead", enabled: true },
  { value: "karen", label: "Karen", role: "Operations", enabled: false },
  { value: "jeremiah", label: "Jeremiah", role: "Field ops", enabled: false },
  {
    value: "colton",
    label: "Colton",
    role: "Crew lead, Side A",
    enabled: false,
  },
  { value: "zo", label: "Zo", role: "Crew lead, Side B", enabled: false },
];

const PRIORITIES = ["Low", "Normal", "Urgent"] as const;
const TYPES = ["Task", "Feature"] as const;

type Priority = (typeof PRIORITIES)[number];
type TaskType = (typeof TYPES)[number];
type FlowStep = { from: string; to: string; action: string };

type AssignTaskModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

const EMPTY = {
  assignedTo: "dane",
  taskType: "Task" as TaskType,
  title: "",
  description: "",
  definitionOfDone: "",
  referenceLink: "",
  flowNotes: "",
  priority: "Normal" as Priority,
  dueDate: "",
};

const inputClass =
  "w-full rounded-xl border border-[#DCE4EE] bg-white px-3 py-2.5 text-[13px] font-medium text-[#1A1A2E] outline-none transition-colors placeholder:text-[#A3B0C0] focus:border-[#418BFF]";

export function AssignTaskModal({
  open,
  onClose,
  onCreated,
}: AssignTaskModalProps) {
  const [form, setForm] = React.useState(EMPTY);
  const [steps, setSteps] = React.useState<FlowStep[]>([]);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setForm(EMPTY);
      setSteps([{ from: "", to: "", action: "" }]);
      setError("");
      setSubmitting(false);
    }
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  function update<K extends keyof typeof EMPTY>(
    key: K,
    value: (typeof EMPTY)[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateStep(index: number, key: keyof FlowStep, value: string) {
    setSteps((prev) =>
      prev.map((step, i) => (i === index ? { ...step, [key]: value } : step)),
    );
  }

  const isFeature = form.taskType === "Feature";
  const canSubmit =
    form.title.trim() !== "" && form.description.trim() !== "" && !submitting;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await apiFetch("/api/tasks", {
        method: "POST",
        body: JSON.stringify({
          assignedTo: form.assignedTo,
          taskType: form.taskType,
          title: form.title,
          description: form.description,
          definitionOfDone: form.definitionOfDone,
          referenceLink: form.referenceLink,
          priority: form.priority,
          dueDate: form.dueDate || null,
          flowSteps: isFeature ? steps : [],
          flowNotes: isFeature ? form.flowNotes : "",
        }),
      });

      const raw = await res.text();
      if (!res.ok) {
        let msg = `Could not assign task (${res.status})`;
        try {
          const parsed = JSON.parse(raw);
          if (parsed?.error) msg = parsed.error;
        } catch {
          /* keep default message */
        }
        throw new Error(msg);
      }

      onCreated?.();
      onClose();
    } catch (err) {
      console.error("Assign task failed:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const assignee = STAFF.find((s) => s.value === form.assignedTo);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#1A1A2E]/50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:items-center sm:px-4 sm:py-6"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.form
            animate={{ opacity: 1, y: 0 }}
            className="flex max-h-full w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-[0_20px_40px_rgba(30,58,138,0.18)]"
            exit={{ opacity: 0, y: 12 }}
            initial={{ opacity: 0, y: 12 }}
            onClick={(event) => event.stopPropagation()}
            onSubmit={handleSubmit}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {/* Header */}
            <div className="flex shrink-0 items-start justify-between gap-4 px-6 pt-6">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#5B6B82]">
                  Assign work
                </p>
                <h2 className="mt-1 text-[18px] font-extrabold tracking-[-0.025em] text-[#1A1A2E]">
                  New task
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

            {/* Body */}
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 pb-5 pt-5">
              <Field label="Assign to" required>
                <select
                  className={inputClass}
                  onChange={(e) => update("assignedTo", e.target.value)}
                  value={form.assignedTo}
                >
                  {STAFF.map((person) => (
                    <option
                      disabled={!person.enabled}
                      key={person.value}
                      value={person.value}
                    >
                      {person.label} — {person.role}
                      {person.enabled ? "" : " (coming soon)"}
                    </option>
                  ))}
                </select>
                {assignee && (
                  <p className="mt-1.5 text-[11px] font-medium text-[#8A99AC]">
                    {assignee.label} sees this in their cockpit and gets a bell
                    notification.
                  </p>
                )}
              </Field>

              <Field hint="Feature adds a flow section" label="Type">
                <div className="grid grid-cols-2 gap-2">
                  {TYPES.map((type) => {
                    const active = form.taskType === type;
                    return (
                      <button
                        className={`rounded-xl border px-3 py-2.5 text-[12px] font-bold transition-colors ${
                          active
                            ? "border-[#418BFF] bg-[#EBF3FF] text-[#418BFF]"
                            : "border-[#DCE4EE] bg-white text-[#6B7A90] hover:bg-[#F8FAFC]"
                        }`}
                        key={type}
                        onClick={() => update("taskType", type)}
                        type="button"
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
              </Field>

              <Field label="Title" required>
                <input
                  className={inputClass}
                  maxLength={200}
                  onChange={(e) => update("title", e.target.value)}
                  placeholder="e.g. Jeremiah's cockpit approval buttons"
                  type="text"
                  value={form.title}
                />
              </Field>

              <Field
                hint="Be as detailed as you like"
                label="What you need"
                required
              >
                <textarea
                  className={`${inputClass} min-h-[140px] resize-y`}
                  maxLength={5000}
                  onChange={(e) => update("description", e.target.value)}
                  placeholder={
                    "Describe it fully. Background, what's wrong today, what good looks like, anything Dane shouldn't have to ask about."
                  }
                  value={form.description}
                />
                <p className="mt-1 text-right text-[10px] font-bold text-[#A3B0C0]">
                  {form.description.length} / 5000
                </p>
              </Field>

              {isFeature && (
                <div className="rounded-2xl border border-[#DCE4EE] bg-[#F8FAFC] p-4">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#5B6B82]">
                    The flow
                  </p>
                  <p className="mt-1 text-[11px] font-medium leading-snug text-[#6B7A90]">
                    Who hands what to whom. One row per handoff.
                  </p>

                  <div className="mt-3 space-y-2">
                    {steps.map((step, index) => (
                      <div
                        className="rounded-xl border border-[#DCE4EE] bg-white p-3"
                        key={index}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#8A99AC]">
                            Step {index + 1}
                          </span>
                          {steps.length > 1 && (
                            <button
                              aria-label={`Remove step ${index + 1}`}
                              className="grid h-6 w-6 place-items-center rounded-lg text-[#93A3B8] transition-colors hover:bg-[#FFF1E9] hover:text-[#D95717]"
                              onClick={() =>
                                setSteps((prev) =>
                                  prev.filter((_, i) => i !== index),
                                )
                              }
                              type="button"
                            >
                              <Trash2Icon size={13} strokeWidth={2.25} />
                            </button>
                          )}
                        </div>

                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <input
                            className={`${inputClass} py-2 text-[12px]`}
                            onChange={(e) =>
                              updateStep(index, "from", e.target.value)
                            }
                            placeholder="From (e.g. Colton)"
                            type="text"
                            value={step.from}
                          />
                          <input
                            className={`${inputClass} py-2 text-[12px]`}
                            onChange={(e) =>
                              updateStep(index, "to", e.target.value)
                            }
                            placeholder="To (e.g. Jeremiah)"
                            type="text"
                            value={step.to}
                          />
                        </div>

                        <input
                          className={`${inputClass} mt-2 py-2 text-[12px]`}
                          onChange={(e) =>
                            updateStep(index, "action", e.target.value)
                          }
                          placeholder="What gets sent or done"
                          type="text"
                          value={step.action}
                        />
                      </div>
                    ))}
                  </div>

                  <button
                    className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-[#418BFF] bg-[#EBF3FF] px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-wide text-[#418BFF] transition-colors hover:bg-[#DBEAFE]"
                    onClick={() =>
                      setSteps((prev) => [
                        ...prev,
                        { from: "", to: "", action: "" },
                      ])
                    }
                    type="button"
                  >
                    <PlusIcon size={14} strokeWidth={3} />
                    Add step
                  </button>

                  <div className="mt-4">
                    <Field label="Flow notes" hint="Optional">
                      <textarea
                        className={`${inputClass} min-h-[70px] resize-y`}
                        maxLength={2000}
                        onChange={(e) => update("flowNotes", e.target.value)}
                        placeholder="Anything the steps above don't cover"
                        value={form.flowNotes}
                      />
                    </Field>
                  </div>
                </div>
              )}

              <Field hint="Optional" label="How you'll know it's done">
                <textarea
                  className={`${inputClass} min-h-[70px] resize-y`}
                  maxLength={2000}
                  onChange={(e) => update("definitionOfDone", e.target.value)}
                  placeholder="e.g. I can approve a stage from my phone and Colton sees it change"
                  value={form.definitionOfDone}
                />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3">
                <Field hint="Optional" label="Due date">
                  <input
                    className={inputClass}
                    min={today}
                    onChange={(e) => update("dueDate", e.target.value)}
                    type="date"
                    value={form.dueDate}
                  />
                </Field>

                <Field hint="Optional" label="Reference link">
                  <input
                    className={inputClass}
                    onChange={(e) => update("referenceLink", e.target.value)}
                    placeholder="Notion, mockup, screenshot"
                    type="url"
                    value={form.referenceLink}
                  />
                </Field>
              </div>

              <Field label="Priority">
                <div className="grid grid-cols-3 gap-2">
                  {PRIORITIES.map((level) => {
                    const active = form.priority === level;
                    return (
                      <button
                        className={`rounded-xl border px-3 py-2.5 text-[12px] font-bold transition-colors ${
                          active
                            ? "border-[#418BFF] bg-[#EBF3FF] text-[#418BFF]"
                            : "border-[#DCE4EE] bg-white text-[#6B7A90] hover:bg-[#F8FAFC]"
                        }`}
                        key={level}
                        onClick={() => update("priority", level)}
                        type="button"
                      >
                        {level}
                      </button>
                    );
                  })}
                </div>
              </Field>
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t border-[#E6ECF2] px-6 pb-6 pt-4">
              {error && (
                <p className="mb-3 text-[11px] font-bold text-red-500">
                  {error}
                </p>
              )}
              <div className="flex gap-3">
                <button
                  className="flex-1 rounded-xl border border-[#DCE4EE] px-4 py-3 text-[12px] font-extrabold uppercase tracking-wide text-[#526176] transition-colors hover:bg-[#F1F5F9]"
                  onClick={onClose}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#418BFF] px-4 py-3 text-[12px] font-extrabold uppercase tracking-wide text-white transition-colors hover:bg-[#2F6FD8] disabled:cursor-not-allowed disabled:bg-[#CBD5E1] disabled:text-[#8A99AC]"
                  disabled={!canSubmit}
                  type="submit"
                >
                  {submitting ? (
                    <>
                      <LoaderIcon
                        className="animate-spin"
                        size={14}
                        strokeWidth={2.5}
                      />
                      Assigning...
                    </>
                  ) : (
                    `Assign to ${assignee?.label ?? "staff"}`
                  )}
                </button>
              </div>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

type FieldProps = {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
};

function Field({ label, required, hint, children }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-2">
        <span className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#5B6B82]">
          {label}
        </span>
        {required && (
          <span className="text-[11px] font-bold text-[#FF7832]">*</span>
        )}
        {hint && (
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#A3B0C0]">
            {hint}
          </span>
        )}
      </span>
      {children}
    </label>
  );
}
