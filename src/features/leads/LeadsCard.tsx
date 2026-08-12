// src/features/leads/LeadsCard.tsx
// Leads as one row in the pipeline list. Tapping it opens the full board
// in a sheet, so the page stays short and scannable.

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PlusIcon, UsersIcon, XIcon } from "lucide-react";
import { NavCard } from "../../components/NavCard";
import { FilterMenu, type FilterOption } from "../../components/FilterMenu";
import { LEAD_STAGES, useLeads, type Lead, type LeadStage } from "./useLeads";
import { LeadRow } from "./LeadRow";
import { LeadDetailModal } from "./LeadDetailModal";
import { AddLeadModal } from "./AddLeadModal";

type Filter = "All" | LeadStage;

export function LeadsCard({ divider = false }: { divider?: boolean }) {
  const { leads, loading, error, createLead, moveStage } = useLeads();

  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("All");
  const [selected, setSelected] = useState<Lead | null>(null);
  const [adding, setAdding] = useState(false);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const lead of leads) {
      map.set(lead.stage, (map.get(lead.stage) ?? 0) + 1);
    }
    return map;
  }, [leads]);

  const options: FilterOption<Filter>[] = useMemo(
    () => [
      { key: "All", label: "All leads", count: leads.length },
      ...LEAD_STAGES.map((stage) => ({
        key: stage as Filter,
        label: stage,
        count: counts.get(stage) ?? 0,
      })),
    ],
    [leads.length, counts],
  );

  const visible = useMemo(
    () => (filter === "All" ? leads : leads.filter((l) => l.stage === filter)),
    [leads, filter],
  );

  // Dead leads aren't progress, so they stay out of the headline count.
  const working = leads.filter((l) => l.stage !== "Dead").length;

  return (
    <>
      <NavCard
        icon={<UsersIcon aria-hidden="true" size={17} strokeWidth={2.5} />}
        title="Leads"
        subtitle="People who might sell, before they become deals"
        count={loading ? null : working}
        tone="blue"
        variant="row"
        divider={divider}
        onClick={() => setOpen(true)}
      />

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center overflow-hidden bg-[#1A1A2E]/50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:items-center sm:px-4 sm:py-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              className="flex h-full w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-[#EEF2F6] shadow-[0_20px_40px_rgba(30,58,138,0.18)]"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
            >
              <div className="shrink-0 border-b border-[#DCE4EE] bg-white px-5 pb-4 pt-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-[20px] font-bold text-[#0F1E33]">
                      {working} live lead{working === 1 ? "" : "s"}
                    </h2>
                    <p className="mt-0.5 text-[16px] text-[#5A6B85]">
                      Tap a lead to see the details or move it along.
                    </p>
                  </div>

                  <button
                    aria-label="Close"
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[#93A3B8] transition-colors hover:bg-[#F1F5F9]"
                    onClick={() => setOpen(false)}
                    type="button"
                  >
                    <XIcon aria-hidden="true" size={16} />
                  </button>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <FilterMenu
                    value={filter}
                    options={options}
                    onChange={setFilter}
                  />

                  <button
                    type="button"
                    onClick={() => setAdding(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F1E33] px-3.5 py-2.5 text-[16px] font-semibold text-white hover:bg-[#1B2E48]"
                  >
                    <PlusIcon aria-hidden="true" size={16} strokeWidth={2.5} />
                    New lead
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {loading && (
                  <div className="space-y-3">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="h-[92px] animate-pulse rounded-2xl bg-[#F2F6FB]"
                      />
                    ))}
                  </div>
                )}

                {!loading && error && (
                  <div className="rounded-xl bg-[#FEF2F2] px-4 py-3 text-[16px] text-[#B91C1C]">
                    {error}
                  </div>
                )}

                {!loading && !error && visible.length === 0 && (
                  <div className="rounded-xl border border-dashed border-[#DCE4EE] px-4 py-8 text-center">
                    <p className="text-[18px] font-semibold text-[#0F1E33]">
                      {leads.length === 0
                        ? "No leads yet"
                        : "Nothing in this stage"}
                    </p>
                    <p className="mt-1 text-[16px] text-[#5A6B85]">
                      {leads.length === 0
                        ? "Add the first one to get the board started."
                        : "Try another stage from the filter."}
                    </p>
                  </div>
                )}

                {!loading && !error && visible.length > 0 && (
                  <div className="space-y-3">
                    {visible.map((lead) => (
                      <LeadRow key={lead.id} lead={lead} onOpen={setSelected} />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <LeadDetailModal
        lead={selected}
        onClose={() => setSelected(null)}
        onMove={async (id, stage) => {
          await moveStage(id, stage);
        }}
      />

      <AddLeadModal
        open={adding}
        onClose={() => setAdding(false)}
        onCreate={createLead}
      />
    </>
  );
}
