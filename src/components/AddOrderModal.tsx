import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LoaderIcon, XIcon } from "lucide-react";
import { apiFetch } from "../lib/apiFetch";

const PRIORITIES = ["Low", "Normal", "Urgent"] as const;
type Priority = (typeof PRIORITIES)[number];

type AddOrderModalProps = {
  open: boolean;
  onClose: () => void;
  /** Called after a successful submit, so the parent can refresh its list. */
  onCreated?: () => void;
};

const EMPTY = {
  orderName: "",
  description: "",
  dateNeeded: "",
  priority: "Normal" as Priority,
  estimatedCost: "",
};

const inputClass =
  "w-full rounded-xl border border-[#DCE4EE] bg-white px-3 py-2.5 text-[18px] font-medium text-[#1A1A2E] outline-none transition-colors placeholder:text-[#A3B0C0] focus:border-[#418BFF]";

export function AddOrderModal({
  open,
  onClose,
  onCreated,
}: AddOrderModalProps) {
  const [form, setForm] = React.useState(EMPTY);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");

  // Reset whenever the modal is opened, so a previous draft or error
  // never bleeds into a new request.
  React.useEffect(() => {
    if (open) {
      setForm(EMPTY);
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

  const canSubmit =
    form.orderName.trim() !== "" &&
    form.description.trim() !== "" &&
    form.dateNeeded !== "" &&
    !submitting;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await apiFetch("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          orderName: form.orderName,
          description: form.description,
          dateNeeded: form.dateNeeded,
          priority: form.priority,
          estimatedCost: form.estimatedCost,
        }),
      });

      const raw = await res.text();
      if (!res.ok) {
        let msg = `Submit failed (${res.status})`;
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
      console.error("Create order failed:", err);
      setError(
        err instanceof Error ? err.message : "Submit failed. Try again.",
      );
      setSubmitting(false);
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#1A1A2E]/50 px-4 py-6 sm:items-center"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.form
            animate={{ opacity: 1, y: 0 }}
            className="max-h-full w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-[0_20px_40px_rgba(30,58,138,0.18)]"
            exit={{ opacity: 0, y: 12 }}
            initial={{ opacity: 0, y: 12 }}
            onClick={(event) => event.stopPropagation()}
            onSubmit={handleSubmit}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[16px] font-semibold tracking-[0.13em] text-[#5B6B82]">
                  New request
                </p>
                <h2 className="mt-1 text-[18px] font-semibold tracking-[-0.025em] text-[#1A1A2E]">
                  Add Order
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

            <div className="mt-5 space-y-4">
              <Field label="Order name" required>
                <input
                  className={inputClass}
                  maxLength={200}
                  onChange={(e) => update("orderName", e.target.value)}
                  placeholder="e.g. Jeremiah's cockpit — live Notion data"
                  type="text"
                  value={form.orderName}
                />
              </Field>

              <Field label="Description" required>
                <textarea
                  className={`${inputClass} min-h-[88px] resize-y`}
                  maxLength={2000}
                  onChange={(e) => update("description", e.target.value)}
                  placeholder="What's needed and why"
                  value={form.description}
                />
              </Field>

              <Field label="Date needed" required>
                <input
                  className={inputClass}
                  min={today}
                  onChange={(e) => update("dateNeeded", e.target.value)}
                  type="date"
                  value={form.dateNeeded}
                />
              </Field>

              <Field label="Priority">
                <div className="grid grid-cols-3 gap-2">
                  {PRIORITIES.map((level) => {
                    const active = form.priority === level;
                    return (
                      <button
                        className={`rounded-xl border px-3 py-2.5 text-[16px] font-medium transition-colors ${
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

              <Field hint="Optional" label="Estimated cost">
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] font-medium text-[#93A3B8]">
                    $
                  </span>
                  <input
                    className={`${inputClass} pl-7`}
                    min="0"
                    onChange={(e) => update("estimatedCost", e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    type="number"
                    value={form.estimatedCost}
                  />
                </div>
              </Field>
            </div>

            {error && (
              <p className="mt-4 text-[16px] font-medium text-red-500">{error}</p>
            )}

            <div className="mt-6 flex gap-3">
              <button
                className="flex-1 rounded-xl border border-[#DCE4EE] px-4 py-3 text-[16px] font-semibold tracking-wide text-[#526176] transition-colors hover:bg-[#F1F5F9]"
                onClick={onClose}
                type="button"
              >
                Cancel
              </button>
              <button
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#418BFF] px-4 py-3 text-[16px] font-semibold tracking-wide text-white transition-colors hover:bg-[#2F6FD8] disabled:cursor-not-allowed disabled:bg-[#CBD5E1] disabled:text-[#8A99AC]"
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
                    Sending…
                  </>
                ) : (
                  "Send to Raj"
                )}
              </button>
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
        <span className="text-[16px] font-semibold tracking-[0.08em] text-[#5B6B82]">
          {label}
        </span>
        {required && (
          <span className="text-[16px] font-medium text-[#FF7832]">*</span>
        )}
        {hint && (
          <span className="text-[16px] font-medium tracking-wide text-[#A3B0C0]">
            {hint}
          </span>
        )}
      </span>
      {children}
    </label>
  );
}
