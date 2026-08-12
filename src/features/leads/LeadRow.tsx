// src/features/leads/LeadRow.tsx
// One lead, shown as a card. Same shape as the task cards so the app
// stays visually uniform. Colour carries the meaning at a glance.
import type { Lead, LeadStage } from "./useLeads";

type Tone = { bar: string; chip: string };

/**
 * Grey = untouched, blue = moving, amber = needs you, green = won,
 * red = dead. Same language as the task board.
 */
const TONES: Record<LeadStage, Tone> = {
  New: { bar: "bg-[#94A3B8]", chip: "bg-[#94A3B8] text-white" },
  Contacted: { bar: "bg-[#418BFF]", chip: "bg-[#418BFF] text-white" },
  Qualified: { bar: "bg-[#D97706]", chip: "bg-[#D97706] text-white" },
  "Docs submitted": { bar: "bg-[#16A34A]", chip: "bg-[#16A34A] text-white" },
  Dead: { bar: "bg-[#DC2626]", chip: "bg-[#DC2626] text-white" },
};

/** "2 days in Contacted" - how long this lead has been sitting still. */
function timeInStage(since: string, stage: string) {
  const ms = Date.now() - new Date(since).getTime();
  const days = Math.floor(ms / 86400000);

  if (days >= 1) {
    return `${days} day${days === 1 ? "" : "s"} in ${stage}`;
  }

  const hours = Math.floor(ms / 3600000);
  if (hours >= 1) return `${hours}h in ${stage}`;
  return `Just moved to ${stage}`;
}

export function LeadRow({
  lead,
  onOpen,
}: {
  lead: Lead;
  onOpen: (lead: Lead) => void;
}) {
  const tone = TONES[lead.stage] ?? TONES.New;

  // Whichever detail is most useful under the name.
  const subtitle = lead.address || lead.phone || lead.email || null;

  return (
    <button
      type="button"
      onClick={() => onOpen(lead)}
      className="w-full text-left flex overflow-hidden rounded-2xl border border-[#DCE4EE] bg-white transition hover:border-[#B9C7DB] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#418BFF]"
    >
      <span className={`w-1.5 shrink-0 ${tone.bar}`} aria-hidden="true" />

      <span className="min-w-0 flex-1 px-4 py-3.5">
        <span className="flex items-start justify-between gap-3">
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[18px] font-semibold text-[#0F1E33]">
              {lead.name}
            </span>

            {subtitle && (
              <span className="mt-0.5 block truncate text-[16px] text-[#5A6B85]">
                {subtitle}
              </span>
            )}
          </span>

          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[14px] font-semibold ${tone.chip}`}
          >
            {lead.stage}
          </span>
        </span>

        <span className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] text-[#7A8AA3]">
          <span>{timeInStage(lead.stage_changed_at, lead.stage)}</span>

          {lead.source && (
            <>
              <span aria-hidden="true">·</span>
              <span className="truncate">{lead.source}</span>
            </>
          )}
        </span>
      </span>
    </button>
  );
}
