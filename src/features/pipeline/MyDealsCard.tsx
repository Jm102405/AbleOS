// src/features/pipeline/MyDealsCard.tsx
// A bird dog's own board. Read-only: Rex sources and works deals in the
// field, but moving one between stages is Raj's call, so there are no
// move buttons here rather than buttons that fail.

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LayersIcon, XIcon } from "lucide-react";
import { NavCard } from "../../components/NavCard";
import { BuyBoxBadge } from "./BuyBoxBadge";
import { FilterMenu, type FilterOption } from "../../components/FilterMenu";
import { useDeals } from "./useDeals";
import { DEAL_STAGES, STAGE_LABELS, type Deal, type DealStage } from "./types";

const TONES: Record<DealStage, string> = {
  docs_submitted: "bg-[#94A3B8] text-white",
  underwriting: "bg-[#418BFF] text-white",
  final_review: "bg-[#D97706] text-white",
  proof_of_funds: "bg-[#418BFF] text-white",
  submit_to_broker: "bg-[#418BFF] text-white",
  awaiting_signatures: "bg-[#D97706] text-white",
  under_contract: "bg-[#16A34A] text-white",
  funded_emd: "bg-[#16A34A] text-white",
  due_diligence: "bg-[#16A34A] text-white",
  coe: "bg-[#16A34A] text-white",
  dead: "bg-[#DC2626] text-white",
};

const BARS: Record<DealStage, string> = {
  docs_submitted: "bg-[#94A3B8]",
  underwriting: "bg-[#418BFF]",
  final_review: "bg-[#D97706]",
  proof_of_funds: "bg-[#418BFF]",
  submit_to_broker: "bg-[#418BFF]",
  awaiting_signatures: "bg-[#D97706]",
  under_contract: "bg-[#16A34A]",
  funded_emd: "bg-[#16A34A]",
  due_diligence: "bg-[#16A34A]",
  coe: "bg-[#16A34A]",
  dead: "bg-[#DC2626]",
};

type Filter = "all" | DealStage;

export function MyDealsCard({
  title = "My deals",
  subtitle = "Everything you sourced, and where it sits",
}: {
  title?: string;
  subtitle?: string;
}) {
  const { deals, loading, error, kpis } = useDeals();

  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [active, setActive] = useState<Deal | null>(null);

  const options: FilterOption<Filter>[] = useMemo(() => {
    const count = (stage: DealStage) =>
      deals.filter((d) => d.stage === stage).length;

    return [
      { key: "all", label: "All my deals", count: deals.length },
      ...DEAL_STAGES.map((stage) => ({
        key: stage as Filter,
        label: STAGE_LABELS[stage],
        count: count(stage),
      })),
    ];
  }, [deals]);

  const visible = useMemo(
    () => (filter === "all" ? deals : deals.filter((d) => d.stage === filter)),
    [deals, filter],
  );

  return (
    <>
      <NavCard
        icon={<LayersIcon aria-hidden="true" size={17} strokeWidth={2.5} />}
        title={title}
        subtitle={subtitle}
        count={loading ? null : kpis.active}
        tone={kpis.stalled > 0 ? "orange" : "blue"}
        onClick={() => setOpen(true)}
      />

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center overflow-hidden bg-[#1A1A2E]/50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:items-center sm:px-4 sm:py-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setOpen(false);
              setActive(null);
            }}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              className="flex h-full w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-[#EEF2F6] shadow-[0_20px_40px_rgba(30,58,138,0.18)]"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <div className="shrink-0 border-b border-[#DCE4EE] bg-white px-5 pb-4 pt-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[16px] font-semibold tracking-[0.13em] text-[#5B6B82]">
                      {title}
                    </p>
                    <h2 className="mt-1 truncate text-[20px] font-bold text-[#0F1E33]">
                      {active ? active.name : `${deals.length} in play`}
                    </h2>
                  </div>

                  <button
                    aria-label="Close"
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[#93A3B8] transition-colors hover:bg-[#F1F5F9]"
                    onClick={() => {
                      if (active) setActive(null);
                      else setOpen(false);
                    }}
                    type="button"
                  >
                    <XIcon aria-hidden="true" size={16} />
                  </button>
                </div>

                {!active && (
                  <div className="mt-3">
                    <FilterMenu
                      value={filter}
                      options={options}
                      onChange={setFilter}
                    />
                  </div>
                )}
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                {!active && (
                  <>
                    {loading && (
                      <div className="space-y-3">
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className="h-[84px] animate-pulse rounded-2xl bg-white"
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
                      <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white px-5 py-10 text-center">
                        <p className="text-[18px] font-semibold text-[#526176]">
                          Nothing here yet
                        </p>
                        <p className="mt-1 text-[16px] text-[#8291A5]">
                          Deals appear once Raj confirms them to you.
                        </p>
                      </div>
                    )}

                    {!loading && !error && visible.length > 0 && (
                      <div className="space-y-3">
                        {visible.map((deal) => (
                          <button
                            key={deal.id}
                            type="button"
                            onClick={() => setActive(deal)}
                            className="flex w-full overflow-hidden rounded-2xl border border-[#DCE4EE] bg-white text-left transition hover:border-[#B9C7DB]"
                          >
                            <span
                              className={`w-1.5 shrink-0 ${BARS[deal.stage]}`}
                              aria-hidden="true"
                            />

                            <span className="min-w-0 flex-1 px-4 py-3.5">
                              <span className="flex items-start justify-between gap-3">
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-[18px] font-semibold text-[#0F1E33]">
                                    {deal.name}
                                  </span>
                                  {deal.address && (
                                    <span className="mt-0.5 block truncate text-[16px] text-[#5A6B85]">
                                      {deal.address}
                                    </span>
                                  )}
                                </span>

                                <span
                                  className={`shrink-0 rounded-full px-2.5 py-1 text-[14px] font-semibold ${TONES[deal.stage]}`}
                                >
                                  {STAGE_LABELS[deal.stage]}
                                </span>
                              </span>

                              <span className="mt-2 flex flex-wrap items-center gap-2 text-[14px] text-[#7A8AA3]">
                                <span>
                                  {deal.daysInStage === null
                                    ? "Not moved yet"
                                    : `${deal.daysInStage} day${deal.daysInStage === 1 ? "" : "s"} in stage`}
                                </span>

                                <BuyBoxBadge
                                  deal={{
                                    address: deal.address,
                                    dscr: deal.dscr,
                                    monthly_cash_flow: deal.monthlyCashFlow,
                                  }}
                                />
                              </span>
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {active && (
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-[#DCE4EE] bg-white p-4">
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 text-[14px] font-semibold ${TONES[active.stage]}`}
                      >
                        {STAGE_LABELS[active.stage]}
                      </span>

                      <dl className="mt-3 space-y-2 text-[16px]">
                        {[
                          ["Address", active.address],
                          ["Source", active.source],
                          [
                            "Days in stage",
                            active.daysInStage === null
                              ? null
                              : String(active.daysInStage),
                          ],
                          ["Last moved by", active.movedBy],
                        ]
                          .filter(([, value]) => Boolean(value))
                          .map(([label, value]) => (
                            <div
                              key={String(label)}
                              className="flex justify-between gap-4"
                            >
                              <dt className="text-[#7A8AA3]">{label}</dt>
                              <dd className="text-right font-medium text-[#0F1E33]">
                                {value}
                              </dd>
                            </div>
                          ))}
                      </dl>

                      {active.notes && (
                        <p className="mt-3 whitespace-pre-line border-t border-[#EEF2F7] pt-3 text-[16px] leading-relaxed text-[#3A4A62]">
                          {active.notes}
                        </p>
                      )}
                    </div>

                    <BuyBoxBadge
                      showReasons
                      deal={{
                        address: active.address,
                        dscr: active.dscr,
                        monthly_cash_flow: active.monthlyCashFlow,
                      }}
                    />

                    <p className="px-1 text-[14px] text-[#7A8AA3]">
                      Raj moves deals between stages. Tell him if this one is
                      ready to advance.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
