// src/features/pof/PofCard.tsx
// Used by two very different people. Cornelius sees a queue and records
// letters. Raj additionally sets the amount, entity and close date the
// letter is written against - that's what canSetDetails switches on.

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BanknoteIcon, ExternalLinkIcon, XIcon } from "lucide-react";
import { NavCard } from "../../components/NavCard";
import { usePof, money, type PofDeal } from "./usePof";

function when(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toLocaleDateString();
}

function waitingDays(since: string | null) {
  if (!since) return null;
  return Math.floor((Date.now() - new Date(since).getTime()) / 86400000);
}

export function PofCard({
  canSetDetails = false,
  row = false,
  open: openProp,
  onOpenChange,
  onCountChange,
}: {
  canSetDetails?: boolean;
  /** Render as a row inside a shared container rather than its own card. */
  row?: boolean;
  /** Pass this to drive the modal from outside, e.g. from a KPI tile. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Reports how many deals are still waiting, so a KPI can show the number. */
  onCountChange?: (count: number) => void;
}) {
  const { deals, loading, error, setDetails, recordIssued } = usePof();

  // Uncontrolled by default. When `open` is passed, the parent owns it and
  // the row below still opens the same modal.
  const [ownOpen, setOwnOpen] = useState(false);
  const open = openProp ?? ownOpen;

  function setOpen(next: boolean) {
    setOwnOpen(next);
    onOpenChange?.(next);
  }
  const [active, setActive] = useState<PofDeal | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const [details, setDetailsForm] = useState({
    pofAmount: "",
    buyerEntity: "",
    targetCloseDate: "",
  });

  const [letter, setLetter] = useState({ letterUrl: "", notes: "" });

  const waiting = useMemo(
    () => deals.filter((d) => !d.pofIssuedAt).length,
    [deals],
  );

  useEffect(() => {
    if (!loading) onCountChange?.(waiting);
    // onCountChange is left out on purpose: an inline callback would
    // re-fire this every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, waiting]);

  function openDeal(deal: PofDeal) {
    setActive(deal);
    setProblem(null);
    setDetailsForm({
      pofAmount: deal.pofAmount === null ? "" : String(deal.pofAmount),
      buyerEntity: deal.buyerEntity ?? "",
      targetCloseDate: deal.targetCloseDate ?? "",
    });
    setLetter({ letterUrl: deal.pofLetterUrl ?? "", notes: deal.pofNotes ?? "" });
  }

  async function saveDetails() {
    if (!active) return;

    setBusy("details");
    setProblem(null);

    try {
      const updated = await setDetails(active.id, details);
      setActive(updated);
    } catch (err) {
      setProblem(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(null);
    }
  }

  async function saveLetter() {
    if (!active) return;

    setBusy("letter");
    setProblem(null);

    try {
      const updated = await recordIssued(active.id, letter);
      setActive(updated);
    } catch (err) {
      setProblem(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <NavCard
        icon={<BanknoteIcon aria-hidden="true" size={17} strokeWidth={2.5} />}
        title="Proof of funds"
        subtitle="Deals waiting on a letter"
        count={loading ? null : waiting}
        tone={waiting > 0 ? "orange" : "green"}
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
                      Proof of funds
                    </p>
                    <h2 className="mt-1 truncate text-[20px] font-bold text-[#0F1E33]">
                      {active
                        ? active.name
                        : waiting === 0
                          ? "Nothing waiting"
                          : `${waiting} waiting`}
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
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                {!active && (
                  <>
                    {loading && (
                      <div className="space-y-3">
                        {[0, 1].map((i) => (
                          <div
                            key={i}
                            className="h-[92px] animate-pulse rounded-2xl bg-white"
                          />
                        ))}
                      </div>
                    )}

                    {!loading && error && (
                      <div className="rounded-xl bg-[#FEF2F2] px-4 py-3 text-[16px] text-[#B91C1C]">
                        {error}
                      </div>
                    )}

                    {!loading && !error && deals.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white px-5 py-10 text-center">
                        <p className="text-[18px] font-semibold text-[#526176]">
                          Nothing to write
                        </p>
                        <p className="mt-1 text-[16px] text-[#8291A5]">
                          Deals appear here when they reach proof of funds.
                        </p>
                      </div>
                    )}

                    {!loading && !error && deals.length > 0 && (
                      <div className="space-y-3">
                        {deals.map((deal) => {
                          const days = waitingDays(deal.stageChangedAt);
                          const issued = Boolean(deal.pofIssuedAt);

                          return (
                            <button
                              key={deal.id}
                              type="button"
                              onClick={() => openDeal(deal)}
                              className="flex w-full overflow-hidden rounded-2xl border border-[#DCE4EE] bg-white text-left transition hover:border-[#B9C7DB]"
                            >
                              <span
                                className={`w-1.5 shrink-0 ${issued ? "bg-[#16A34A]" : "bg-[#D97706]"}`}
                                aria-hidden="true"
                              />

                              <span className="min-w-0 flex-1 px-4 py-3.5">
                                <span className="flex items-start justify-between gap-3">
                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate text-[18px] font-semibold text-[#0F1E33]">
                                      {deal.name}
                                    </span>
                                    <span className="mt-0.5 block truncate text-[16px] text-[#5A6B85]">
                                      {money(deal.pofAmount) ??
                                        "Amount not stated yet"}
                                      {deal.buyerEntity
                                        ? ` · ${deal.buyerEntity}`
                                        : ""}
                                    </span>
                                  </span>

                                  <span
                                    className={`shrink-0 rounded-full px-2.5 py-1 text-[14px] font-semibold ${issued ? "bg-[#16A34A] text-white" : "bg-[#D97706] text-white"}`}
                                  >
                                    {issued ? "Issued" : "Waiting"}
                                  </span>
                                </span>

                                <span className="mt-2 block text-[14px] text-[#7A8AA3]">
                                  {deal.targetCloseDate
                                    ? `Closing ${when(deal.targetCloseDate)}`
                                    : days === null
                                      ? "No dates yet"
                                      : `${days} day${days === 1 ? "" : "s"} here`}
                                </span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}

                {active && (
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-[#DCE4EE] bg-white p-4">
                      <dl className="space-y-2 text-[16px]">
                        {[
                          ["Address", active.address],
                          ["Purchase price", money(active.purchasePrice)],
                          ["POF amount", money(active.pofAmount)],
                          ["Buyer entity", active.buyerEntity],
                          ["Target close", when(active.targetCloseDate)],
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

                      {active.pofIssuedAt && (
                        <p className="mt-3 border-t border-[#EEF2F7] pt-3 text-[14px] text-[#7A8AA3]">
                          Letter recorded by {active.pofIssuedBy} on{" "}
                          {when(active.pofIssuedAt)}
                        </p>
                      )}

                      {active.pofLetterUrl && (
                        <a
                          href={active.pofLetterUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-1.5 text-[16px] font-semibold text-[#418BFF] underline"
                        >
                          Open the letter
                          <ExternalLinkIcon aria-hidden="true" size={14} />
                        </a>
                      )}
                    </div>

                    {canSetDetails && (
                      <div className="space-y-3 rounded-2xl border border-[#DCE4EE] bg-white p-4">
                        <div className="text-[14px] font-semibold uppercase tracking-wide text-[#7A8AA3]">
                          What the letter is written against
                        </div>

                        <label className="block">
                          <span className="text-[16px] text-[#5A6B85]">
                            Requested POF amount
                          </span>
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="e.g. 465000"
                            value={details.pofAmount}
                            onChange={(e) =>
                              setDetailsForm((f) => ({
                                ...f,
                                pofAmount: e.target.value,
                              }))
                            }
                            className="mt-1 w-full rounded-xl border border-[#DCE4EE] px-3 py-2.5 text-[18px] text-[#0F1E33] placeholder:text-[#A3B0C0] focus:border-[#418BFF] focus:outline-none"
                          />
                        </label>

                        <label className="block">
                          <span className="text-[16px] text-[#5A6B85]">
                            Buyer entity
                          </span>
                          <input
                            type="text"
                            placeholder="e.g. Able Justiceburg LLC"
                            value={details.buyerEntity}
                            onChange={(e) =>
                              setDetailsForm((f) => ({
                                ...f,
                                buyerEntity: e.target.value,
                              }))
                            }
                            className="mt-1 w-full rounded-xl border border-[#DCE4EE] px-3 py-2.5 text-[18px] text-[#0F1E33] placeholder:text-[#A3B0C0] focus:border-[#418BFF] focus:outline-none"
                          />
                        </label>

                        <label className="block">
                          <span className="text-[16px] text-[#5A6B85]">
                            Target close date
                          </span>
                          <input
                            type="date"
                            value={details.targetCloseDate}
                            onChange={(e) =>
                              setDetailsForm((f) => ({
                                ...f,
                                targetCloseDate: e.target.value,
                              }))
                            }
                            className="mt-1 w-full rounded-xl border border-[#DCE4EE] px-3 py-2.5 text-[18px] text-[#0F1E33] focus:border-[#418BFF] focus:outline-none"
                          />
                        </label>

                        <button
                          type="button"
                          disabled={busy !== null}
                          onClick={saveDetails}
                          className="w-full rounded-xl bg-[#0F1E33] px-4 py-3 text-[18px] font-semibold text-white disabled:opacity-60"
                        >
                          {busy === "details" ? "Saving…" : "Save details"}
                        </button>
                      </div>
                    )}

                    <div className="space-y-3 rounded-2xl border border-[#DCE4EE] bg-white p-4">
                      <div className="text-[14px] font-semibold uppercase tracking-wide text-[#7A8AA3]">
                        The letter
                      </div>

                      <label className="block">
                        <span className="text-[16px] text-[#5A6B85]">
                          Link to the letter
                        </span>
                        <input
                          type="url"
                          placeholder="Paste the Drive link"
                          value={letter.letterUrl}
                          onChange={(e) =>
                            setLetter((f) => ({
                              ...f,
                              letterUrl: e.target.value,
                            }))
                          }
                          className="mt-1 w-full rounded-xl border border-[#DCE4EE] px-3 py-2.5 text-[18px] text-[#0F1E33] placeholder:text-[#A3B0C0] focus:border-[#418BFF] focus:outline-none"
                        />
                      </label>

                      <label className="block">
                        <span className="text-[16px] text-[#5A6B85]">
                          Anything worth noting
                        </span>
                        <textarea
                          rows={3}
                          value={letter.notes}
                          onChange={(e) =>
                            setLetter((f) => ({ ...f, notes: e.target.value }))
                          }
                          className="mt-1 w-full rounded-xl border border-[#DCE4EE] px-3 py-2.5 text-[18px] text-[#0F1E33] focus:border-[#418BFF] focus:outline-none"
                        />
                      </label>

                      <button
                        type="button"
                        disabled={busy !== null}
                        onClick={saveLetter}
                        className="w-full rounded-xl bg-[#16A34A] px-4 py-3 text-[18px] font-semibold text-white disabled:opacity-60"
                      >
                        {busy === "letter" ? "Saving…" : "Record the letter"}
                      </button>

                      <p className="text-[14px] text-[#7A8AA3]">
                        Recording a letter does not move the deal on. Raj
                        advances it once he has what he needs.
                      </p>
                    </div>

                    {problem && (
                      <div className="rounded-xl bg-[#FEF2F2] px-4 py-3 text-[16px] text-[#B91C1C]">
                        {problem}
                      </div>
                    )}
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