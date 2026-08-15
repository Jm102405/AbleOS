// src/features/documents/DocumentsCard.tsx
// Ellery's pipeline. A document sitting in one stage for more than five
// days is the thing that costs money, so that's what the card counts.

import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FileTextIcon, PlusIcon, XIcon } from "lucide-react";
import { NavCard } from "../../components/NavCard";
import { FilterMenu, type FilterOption } from "../../components/FilterMenu";
import { useDeals } from "../pipeline/useDeals";
import {
  DOC_STAGES,
  DOC_STAGE_LABELS,
  useDocuments,
  type AbleDocument,
  type DocStage,
} from "./useDocuments";

const BARS: Record<DocStage, string> = {
  requested: "bg-[#94A3B8]",
  draft: "bg-[#418BFF]",
  internal_review: "bg-[#D97706]",
  out_for_signature: "bg-[#D97706]",
  executed: "bg-[#16A34A]",
  filed: "bg-[#16A34A]",
  cancelled: "bg-[#94A3B8]",
};

const CHIPS: Record<DocStage, string> = {
  requested: "bg-[#94A3B8] text-white",
  draft: "bg-[#418BFF] text-white",
  internal_review: "bg-[#D97706] text-white",
  out_for_signature: "bg-[#D97706] text-white",
  executed: "bg-[#16A34A] text-white",
  filed: "bg-[#16A34A] text-white",
  cancelled: "bg-[#94A3B8] text-white",
};

/** Anything not here is finished and off Ellery's plate. */
const OPEN_STAGES: DocStage[] = [
  "requested",
  "draft",
  "internal_review",
  "out_for_signature",
];

type Filter = "open" | "all" | DocStage;

function daysIn(since: string) {
  return Math.floor((Date.now() - new Date(since).getTime()) / 86400000);
}

function isStuck(doc: AbleDocument) {
  return OPEN_STAGES.includes(doc.stage) && daysIn(doc.stage_changed_at) >= 5;
}

export function DocumentsCard({
  canMove = true,
  row = false,
}: {
  canMove?: boolean;
  /** Render as a row inside a shared container rather than its own card. */
  row?: boolean;
}) {
  const { documents, loading, error, moveStage, requestDocument } =
    useDocuments();

  // The deals this person can see. Ellery gets all of them, Rex only his,
  // which is exactly the list each should be choosing from.
  const { deals } = useDeals();

  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("open");
  const [active, setActive] = useState<AbleDocument | null>(null);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const [form, setForm] = useState({
    dealId: "",
    dealName: "",
    docType: "",
    dueOn: "",
    counterparty: "",
    notes: "",
  });

  const openDocs = useMemo(
    () => documents.filter((d) => OPEN_STAGES.includes(d.stage)),
    [documents],
  );

  const stuckCount = useMemo(
    () => documents.filter(isStuck).length,
    [documents],
  );

  const options: FilterOption<Filter>[] = useMemo(() => {
    const count = (stage: DocStage) =>
      documents.filter((d) => d.stage === stage).length;

    return [
      { key: "open", label: "In progress", count: openDocs.length },
      { key: "all", label: "Everything", count: documents.length },
      ...DOC_STAGES.map((stage) => ({
        key: stage as Filter,
        label: DOC_STAGE_LABELS[stage],
        count: count(stage),
      })),
    ];
  }, [documents, openDocs.length]);

  const visible = useMemo(() => {
    if (filter === "open") return openDocs;
    if (filter === "all") return documents;
    return documents.filter((d) => d.stage === filter);
  }, [documents, openDocs, filter]);

  async function move(stage: DocStage) {
    if (!active || stage === active.stage) return;

    setBusy(stage);
    setProblem(null);

    try {
      await moveStage(active.id, stage);
      setActive(null);
    } catch (err) {
      setProblem(err instanceof Error ? err.message : "Could not move it");
    } finally {
      setBusy(null);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.dealId || !form.docType.trim()) {
      setProblem("Pick a deal and say what kind of document it is");
      return;
    }

    setBusy("add");
    setProblem(null);

    try {
      await requestDocument({
        dealId: form.dealId,
        dealName: form.dealName,
        docType: form.docType,
        dueOn: form.dueOn || undefined,
        counterparty: form.counterparty || undefined,
        notes: form.notes || undefined,
      });

      setForm({
        dealId: "",
        dealName: "",
        docType: "",
        dueOn: "",
        counterparty: "",
        notes: "",
      });
      setAdding(false);
    } catch (err) {
      setProblem(err instanceof Error ? err.message : "Could not save it");
    } finally {
      setBusy(null);
    }
  }

  function closeAll() {
    setOpen(false);
    setActive(null);
    setAdding(false);
    setProblem(null);
  }

  return (
    <>
      <NavCard
        icon={<FileTextIcon aria-hidden="true" size={17} strokeWidth={2.5} />}
        title="Documents"
        subtitle="Everything moving through you"
        count={loading ? null : openDocs.length}
        tone={stuckCount > 0 ? "orange" : "blue"}
        variant={row ? "row" : "card"}
        divider={row}
        onClick={() => setOpen(true)}
      />

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center overflow-hidden bg-[#1A1A2E]/50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:items-center sm:px-4 sm:py-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeAll}
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
                      Doc pipeline
                    </p>
                    <h2 className="mt-1 truncate text-[20px] font-bold text-[#0F1E33]">
                      {active
                        ? `${active.deal_name} · ${active.doc_type}`
                        : adding
                          ? "Request a document"
                          : stuckCount > 0
                            ? `${stuckCount} stuck over 5 days`
                            : `${openDocs.length} in progress`}
                    </h2>
                  </div>

                  <button
                    aria-label="Close"
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[#93A3B8] transition-colors hover:bg-[#F1F5F9]"
                    onClick={() => {
                      if (active) setActive(null);
                      else if (adding) setAdding(false);
                      else closeAll();
                    }}
                    type="button"
                  >
                    <XIcon aria-hidden="true" size={16} />
                  </button>
                </div>

                {!active && !adding && (
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
                      Request
                    </button>
                  </div>
                )}
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                {/* ---- LIST ---- */}
                {!active && !adding && (
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
                          Nothing here
                        </p>
                        <p className="mt-1 text-[16px] text-[#8291A5]">
                          Tap Request to start a document.
                        </p>
                      </div>
                    )}

                    {!loading && !error && visible.length > 0 && (
                      <div className="space-y-3">
                        {visible.map((doc) => {
                          const days = daysIn(doc.stage_changed_at);
                          const stuck = isStuck(doc);

                          return (
                            <button
                              key={doc.id}
                              type="button"
                              onClick={() => setActive(doc)}
                              className="flex w-full overflow-hidden rounded-2xl border border-[#DCE4EE] bg-white text-left transition hover:border-[#B9C7DB]"
                            >
                              <span
                                className={`w-1.5 shrink-0 ${BARS[doc.stage]}`}
                                aria-hidden="true"
                              />

                              <span className="min-w-0 flex-1 px-4 py-3.5">
                                <span className="flex items-start justify-between gap-3">
                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate text-[18px] font-semibold text-[#0F1E33]">
                                      {doc.deal_name}
                                    </span>
                                    <span className="mt-0.5 block truncate text-[16px] text-[#5A6B85]">
                                      {doc.doc_type}
                                      {doc.counterparty
                                        ? ` · ${doc.counterparty}`
                                        : ""}
                                    </span>
                                  </span>

                                  <span
                                    className={`shrink-0 rounded-full px-2.5 py-1 text-[14px] font-semibold ${CHIPS[doc.stage]}`}
                                  >
                                    {DOC_STAGE_LABELS[doc.stage]}
                                  </span>
                                </span>

                                <span className="mt-2 flex flex-wrap items-center gap-x-2 text-[14px] text-[#7A8AA3]">
                                  <span>
                                    {days === 0
                                      ? "Moved today"
                                      : `${days} day${days === 1 ? "" : "s"} here`}
                                  </span>

                                  {stuck && (
                                    <span className="rounded-full bg-[#FEF3C7] px-2 py-0.5 font-semibold text-[#92400E]">
                                      Needs a push
                                    </span>
                                  )}

                                  {doc.due_on && (
                                    <>
                                      <span aria-hidden="true">·</span>
                                      <span>
                                        Due{" "}
                                        {new Date(
                                          `${doc.due_on}T00:00:00`,
                                        ).toLocaleDateString()}
                                      </span>
                                    </>
                                  )}
                                </span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}

                {/* ---- DETAIL ---- */}
                {active && (
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-[#DCE4EE] bg-white p-4">
                      <dl className="space-y-2 text-[16px]">
                        {[
                          ["Requested by", active.requested_by],
                          ["Counterparty", active.counterparty],
                          [
                            "Due",
                            active.due_on
                              ? new Date(
                                  `${active.due_on}T00:00:00`,
                                ).toLocaleDateString()
                              : null,
                          ],
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

                    {canMove && (
                    <div className="rounded-2xl border border-[#DCE4EE] bg-white p-4">
                      <div className="text-[14px] font-semibold uppercase tracking-wide text-[#7A8AA3]">
                        Move to
                      </div>

                      <div className="mt-2 flex flex-wrap gap-2">
                        {DOC_STAGES.map((stage) => {
                          const current = stage === active.stage;

                          return (
                            <button
                              key={stage}
                              type="button"
                              disabled={current || busy !== null}
                              onClick={() => move(stage)}
                              className={
                                current
                                  ? `rounded-full px-3.5 py-2 text-[16px] font-semibold ${CHIPS[stage]}`
                                  : "rounded-full border border-[#DCE4EE] px-3.5 py-2 text-[16px] font-semibold text-[#3A4A62] hover:border-[#B9C7DB] disabled:opacity-50"
                              }
                            >
                              {busy === stage
                                ? "Moving…"
                                : DOC_STAGE_LABELS[stage]}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    )}

                    {problem && (
                      <div className="rounded-xl bg-[#FEF2F2] px-4 py-3 text-[16px] text-[#B91C1C]">
                        {problem}
                      </div>
                    )}
                  </div>
                )}

                {/* ---- REQUEST FORM ---- */}
                {adding && (
                  <form onSubmit={submit} className="space-y-3">
                    <div className="space-y-3 rounded-2xl border border-[#DCE4EE] bg-white p-4">
                      <label className="block">
                        <span className="text-[14px] font-semibold uppercase tracking-wide text-[#7A8AA3]">
                          Deal
                        </span>
                        <select
                          value={form.dealId}
                          onChange={(e) => {
                            const deal = deals.find(
                              (d) => d.id === e.target.value,
                            );
                            setForm((f) => ({
                              ...f,
                              dealId: e.target.value,
                              dealName: deal?.name ?? "",
                            }));
                          }}
                          className="mt-1 w-full rounded-xl border border-[#DCE4EE] bg-white px-3 py-2.5 text-[18px] text-[#0F1E33] focus:border-[#418BFF] focus:outline-none"
                        >
                          <option value="">Choose a deal</option>
                          {deals.map((deal) => (
                            <option key={deal.id} value={deal.id}>
                              {deal.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      {[
                        ["docType", "Document", "e.g. LOI, PSA amendment"],
                        ["counterparty", "Counterparty", "Seller, agent, lender"],
                      ].map(([key, label, hint]) => (
                        <label key={key} className="block">
                          <span className="text-[14px] font-semibold uppercase tracking-wide text-[#7A8AA3]">
                            {label}
                          </span>
                          <input
                            type="text"
                            placeholder={hint}
                            value={form[key as keyof typeof form]}
                            onChange={(e) =>
                              setForm((f) => ({ ...f, [key]: e.target.value }))
                            }
                            className="mt-1 w-full rounded-xl border border-[#DCE4EE] px-3 py-2.5 text-[18px] text-[#0F1E33] placeholder:text-[#A3B0C0] focus:border-[#418BFF] focus:outline-none"
                          />
                        </label>
                      ))}

                      <label className="block">
                        <span className="text-[14px] font-semibold uppercase tracking-wide text-[#7A8AA3]">
                          Due
                        </span>
                        <input
                          type="date"
                          value={form.dueOn}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, dueOn: e.target.value }))
                          }
                          className="mt-1 w-full rounded-xl border border-[#DCE4EE] px-3 py-2.5 text-[18px] text-[#0F1E33] focus:border-[#418BFF] focus:outline-none"
                        />
                      </label>

                      <label className="block">
                        <span className="text-[14px] font-semibold uppercase tracking-wide text-[#7A8AA3]">
                          Notes
                        </span>
                        <textarea
                          rows={3}
                          value={form.notes}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, notes: e.target.value }))
                          }
                          className="mt-1 w-full rounded-xl border border-[#DCE4EE] px-3 py-2.5 text-[18px] text-[#0F1E33] focus:border-[#418BFF] focus:outline-none"
                        />
                      </label>
                    </div>

                    {problem && (
                      <div className="rounded-xl bg-[#FEF2F2] px-4 py-3 text-[16px] text-[#B91C1C]">
                        {problem}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={busy !== null}
                      className="w-full rounded-xl bg-[#0F1E33] px-4 py-3 text-[18px] font-semibold text-white disabled:opacity-60"
                    >
                      {busy === "add" ? "Saving…" : "Add to pipeline"}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}