// src/features/leads/AddLeadModal.tsx
// Manual entry. Only the name is required so nobody abandons the form
// halfway through a phone call.

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { NewLead } from "./useLeads";

const FIELDS: { key: keyof NewLead; label: string; type?: string }[] = [
  { key: "name", label: "Name" },
  { key: "phone", label: "Phone", type: "tel" },
  { key: "email", label: "Email", type: "email" },
  { key: "address", label: "Property address" },
  { key: "source", label: "Where did they come from?" },
];

const EMPTY: NewLead = {
  name: "",
  phone: "",
  email: "",
  address: "",
  source: "",
  notes: "",
};

export function AddLeadModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (lead: NewLead) => Promise<unknown>;
}) {
  const [form, setForm] = useState<NewLead>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    setForm(EMPTY);
    setError(null);
    onClose();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name.trim()) {
      setError("A name is required");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      // Drop the blank fields so the database stores null, not "".
      const payload = Object.fromEntries(
        Object.entries(form).filter(([, v]) => String(v ?? "").trim() !== ""),
      ) as NewLead;

      await onCreate(payload);
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save lead");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.form
            onSubmit={submit}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[88vh] w-full overflow-y-auto rounded-t-3xl bg-white sm:max-w-lg sm:rounded-3xl"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-[#EEF2F7] bg-white px-5 pb-3 pt-5">
              <h2 className="text-[20px] font-bold text-[#0F1E33]">New lead</h2>

              <button
                type="button"
                onClick={close}
                className="rounded-full px-3 py-1.5 text-[16px] font-semibold text-[#5A6B85] hover:bg-[#F2F6FB]"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-3 px-5 py-4">
              {FIELDS.map((field) => (
                <label key={field.key} className="block">
                  <span className="text-[14px] font-semibold uppercase tracking-wide text-[#7A8AA3]">
                    {field.label}
                    {field.key === "name" && " *"}
                  </span>

                  <input
                    type={field.type || "text"}
                    value={form[field.key] || ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, [field.key]: e.target.value }))
                    }
                    className="mt-1 w-full rounded-xl border border-[#DCE4EE] px-3 py-2.5 text-[18px] text-[#0F1E33] focus:border-[#418BFF] focus:outline-none"
                  />
                </label>
              ))}

              <label className="block">
                <span className="text-[14px] font-semibold uppercase tracking-wide text-[#7A8AA3]">
                  Notes
                </span>

                <textarea
                  rows={3}
                  value={form.notes || ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-[#DCE4EE] px-3 py-2.5 text-[18px] text-[#0F1E33] focus:border-[#418BFF] focus:outline-none"
                />
              </label>

              {error && (
                <div className="rounded-xl bg-[#FEF2F2] px-3 py-2 text-[16px] text-[#B91C1C]">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-[#0F1E33] px-4 py-3 text-[18px] font-semibold text-white disabled:opacity-60"
              >
                {busy ? "Saving…" : "Save lead"}
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
