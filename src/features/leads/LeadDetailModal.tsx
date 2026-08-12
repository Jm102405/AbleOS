// src/features/leads/LeadDetailModal.tsx
// Tap a lead, this slides up. Read the details, tap a stage to move it.
// Phone and email are tappable so Raj can call straight from his phone.

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LEAD_STAGES, type Lead, type LeadStage } from "./useLeads";

const CHIP: Record<LeadStage, string> = {
  New: "bg-[#94A3B8]",
  Contacted: "bg-[#418BFF]",
  Qualified: "bg-[#D97706]",
  "Docs submitted": "bg-[#16A34A]",
  Dead: "bg-[#DC2626]",
};

function Detail({
  label,
  value,
  href,
}: {
  label: string;
  value: string | null;
  href?: string;
}) {
  if (!value) return null;

  return (
    <div className="border-t border-[#EEF2F7] py-3">
      <div className="text-[14px] font-semibold uppercase tracking-wide text-[#7A8AA3]">
        {label}
      </div>

      {href ? (
        <a
          href={href}
          className="mt-1 block break-words text-[18px] font-medium text-[#418BFF] underline"
        >
          {value}
        </a>
      ) : (
        <div className="mt-1 whitespace-pre-line break-words text-[18px] text-[#0F1E33]">
          {value}
        </div>
      )}
    </div>
  );
}

export function LeadDetailModal({
  lead,
  onClose,
  onMove,
}: {
  lead: Lead | null;
  onClose: () => void;
  onMove?: (id: string, stage: LeadStage) => Promise<void>;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function move(stage: LeadStage) {
    if (!lead || !onMove || stage === lead.stage) return;

    setBusy(stage);
    setError(null);

    try {
      await onMove(lead.id, stage);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not move lead");
    } finally {
      setBusy(null);
    }
  }

  return (
    <AnimatePresence>
      {lead && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="max-h-[88vh] w-full overflow-y-auto rounded-t-3xl bg-white sm:max-w-lg sm:rounded-3xl"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-[#EEF2F7] bg-white px-5 pb-3 pt-5">
              <div className="min-w-0">
                <h2 className="break-words text-[20px] font-bold text-[#0F1E33]">
                  {lead.name}
                </h2>

                <span
                  className={`mt-1.5 inline-block rounded-full px-2.5 py-1 text-[14px] font-semibold text-white ${CHIP[lead.stage] ?? CHIP.New}`}
                >
                  {lead.stage}
                </span>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-full px-3 py-1.5 text-[16px] font-semibold text-[#5A6B85] hover:bg-[#F2F6FB]"
              >
                Close
              </button>
            </div>

            <div className="px-5 pb-6">
              <Detail
                label="Phone"
                value={lead.phone}
                href={lead.phone ? `tel:${lead.phone}` : undefined}
              />
              <Detail
                label="Email"
                value={lead.email}
                href={lead.email ? `mailto:${lead.email}` : undefined}
              />
              <Detail label="Address" value={lead.address} />
              <Detail label="Source" value={lead.source} />
              <Detail label="Notes" value={lead.notes} />

              <div className="border-t border-[#EEF2F7] py-3 text-[14px] text-[#7A8AA3]">
                Added by {lead.created_by} on{" "}
                {new Date(lead.created_at).toLocaleDateString()}
              </div>

              {onMove && (
                <div className="mt-2">
                  <div className="text-[14px] font-semibold uppercase tracking-wide text-[#7A8AA3]">
                    Move to
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {LEAD_STAGES.map((stage) => {
                      const current = stage === lead.stage;

                      return (
                        <button
                          key={stage}
                          type="button"
                          disabled={current || busy !== null}
                          onClick={() => move(stage)}
                          className={
                            current
                              ? `rounded-full px-3.5 py-2 text-[16px] font-semibold text-white ${CHIP[stage]}`
                              : "rounded-full border border-[#DCE4EE] px-3.5 py-2 text-[16px] font-semibold text-[#3A4A62] hover:border-[#B9C7DB] disabled:opacity-50"
                          }
                        >
                          {busy === stage ? "Moving…" : stage}
                        </button>
                      );
                    })}
                  </div>

                  {error && (
                    <div className="mt-3 rounded-xl bg-[#FEF2F2] px-3 py-2 text-[16px] text-[#B91C1C]">
                      {error}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}