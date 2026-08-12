// src/features/leads/LeadsPanel.tsx
// The leads board as a drop-in panel, so it can live inside the Pipeline
// page rather than on a screen of its own. Leads feed the pipeline, so
// they belong on the same screen.

import { useMemo, useState } from "react";
import { PlusIcon } from "lucide-react";
import { FilterMenu, type FilterOption } from "../../components/FilterMenu";
import { LEAD_STAGES, useLeads, type Lead, type LeadStage } from "./useLeads";
import { LeadRow } from "./LeadRow";
import { LeadDetailModal } from "./LeadDetailModal";
import { AddLeadModal } from "./AddLeadModal";

type Filter = "All" | LeadStage;

export function LeadsPanel() {
  const { leads, loading, error, createLead, moveStage } = useLeads();

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

  // Dead leads aren't progress, so they stay out of the working count.
  const working = leads.filter((l) => l.stage !== "Dead").length;

  return (
    <section className="overflow-hidden rounded-2xl border border-[#DCE4EE] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EEF2F7] px-4 py-4">
        <div className="min-w-0">
          <h2 className="text-[20px] font-bold text-[#0F1E33]">
            {working} live lead{working === 1 ? "" : "s"}
          </h2>
          <p className="mt-0.5 text-[16px] text-[#5A6B85]">
            Tap a lead to see the details or move it along.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <FilterMenu value={filter} options={options} onChange={setFilter} />

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

      <div className="p-4">
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
              {leads.length === 0 ? "No leads yet" : "Nothing in this stage"}
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
    </section>
  );
}