// src/features/documents/CriticalDatesCard.tsx
// Option periods, response deadlines, rent commencement. Missing one of
// these costs real money, so the card counts what's due this week and
// anything already overdue.

import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarClockIcon, PlusIcon, XIcon } from "lucide-react";
import { NavCard } from "../../components/NavCard";
import { useCriticalDates, daysUntil, type CriticalDate } from "./useDocuments";

/** How close it is decides how loud it looks. */
function urgency(days: number) {
  if (days < 0) return { bar: "bg-[#DC2626]", chip: "bg-[#DC2626] text-white" };
  if (days <= 2)
    return { bar: "bg-[#DC2626]", chip: "bg-[#DC2626] text-white" };
  if (days <= 7)
    return { bar: "bg-[#D97706]", chip: "bg-[#D97706] text-white" };
  return { bar: "bg-[#418BFF]", chip: "bg-[#EEF5FF] text-[#2465B5]" };
}

function countdown(days: number) {
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `${days}d`;
}

export function CriticalDatesCard() {
  const { dates, loading, error, markDone, addDate } = useCriticalDates();

  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const [form, setForm] = useState({ dealName: "", label: "", dueOn: "" });

  /** Only the near ones are worth a number on the front of the card. */
  const pressing = useMemo(
    () => dates.filter((d) => daysUntil(d.due_on) <= 7),
    [dates],
  );

  const overdue = useMemo(
    () => dates.filter((d) => daysUntil(d.due_on) < 0).length,
    [dates],
  );

  async function complete(date: CriticalDate) {
    setBusy(date.id);
    setProblem(null);

    try {
      await markDone(date.id);
    } catch (err) {
      setProblem(err instanceof Error ? err.message : "Could not update it");
    } finally {
      setBusy(null);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.dealName.trim() || !form.label.trim() || !form.dueOn) {
      setProblem("Deal, what it is, and the date are all needed");
      return;
    }

    setBusy("add");
    setProblem(null);

    try {
      await addDate(form);
      setForm({ dealName: "", label: "", dueOn: "" });
      setAdding(false);
    } catch (err) {
      setProblem(err instanceof Error ? err.message : "Could not save it");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <NavCard
        icon={
          <CalendarClockIcon aria-hidden="true" size={17} strokeWidth={2.5} />
        }
        title="Critical dates"
        subtitle="Deadlines that cost money if missed"
        count={loading ? null : pressing.length}
        tone={overdue > 0 ? "orange" : pressing.length > 0 ? "yellow" : "green"}
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
              setAdding(false);
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
                      Critical dates
                    </p>
                    <h2 className="mt-1 text-[20px] font-bold text-[#0F1E33]">
                      {adding
                        ? "Add a date"
                        : overdue > 0
                          ? `${overdue} overdue`
                          : `${pressing.length} in the next week`}
                    </h2>
                  </div>

                  <button
                    aria-label="Close"
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[#93A3B8] transition-colors hover:bg-[#F1F5F9]"
                    onClick={() => {
                      if (adding) setAdding(false);
                      else setOpen(false);
                    }}
                    type="button"
                  >
                    <XIcon aria-hidden="true" size={16} />
                  </button>
                </div>

                {!adding && (
                  <button
                    type="button"
                    onClick={() => setAdding(true)}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#0F1E33] px-3.5 py-2.5 text-[16px] font-semibold text-white hover:bg-[#1B2E48]"
                  >
                    <PlusIcon aria-hidden="true" size={16} strokeWidth={2.5} />
                    Add a date
                  </button>
                )}
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                {!adding && (
                  <>
                    {loading && (
                      <div className="space-y-3">
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className="h-[76px] animate-pulse rounded-2xl bg-white"
                          />
                        ))}
                      </div>
                    )}

                    {!loading && error && (
                      <div className="rounded-xl bg-[#FEF2F2] px-4 py-3 text-[16px] text-[#B91C1C]">
                        {error}
                      </div>
                    )}

                    {!loading && !error && dates.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white px-5 py-10 text-center">
                        <p className="text-[18px] font-semibold text-[#526176]">
                          Nothing on the calendar
                        </p>
                        <p className="mt-1 text-[16px] text-[#8291A5]">
                          Add option periods and deadlines as they land.
                        </p>
                      </div>
                    )}

                    {!loading && !error && dates.length > 0 && (
                      <div className="space-y-3">
                        {dates.map((date) => {
                          const days = daysUntil(date.due_on);
                          const tone = urgency(days);

                          return (
                            <div
                              key={date.id}
                              className="flex overflow-hidden rounded-2xl border border-[#DCE4EE] bg-white"
                            >
                              <span
                                className={`w-1.5 shrink-0 ${tone.bar}`}
                                aria-hidden="true"
                              />

                              <div className="min-w-0 flex-1 px-4 py-3.5">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-[18px] font-semibold text-[#0F1E33]">
                                      {date.label}
                                    </p>
                                    <p className="mt-0.5 truncate text-[16px] text-[#5A6B85]">
                                      {date.deal_name}
                                    </p>
                                  </div>

                                  <span
                                    className={`shrink-0 rounded-full px-2.5 py-1 text-[14px] font-semibold ${tone.chip}`}
                                  >
                                    {countdown(days)}
                                  </span>
                                </div>

                                <div className="mt-2 flex items-center justify-between gap-3">
                                  <span className="text-[14px] text-[#7A8AA3]">
                                    {new Date(
                                      `${date.due_on}T00:00:00`,
                                    ).toLocaleDateString(undefined, {
                                      weekday: "short",
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </span>

                                  <button
                                    type="button"
                                    disabled={busy !== null}
                                    onClick={() => complete(date)}
                                    className="rounded-xl border border-[#DCE4EE] px-3 py-1.5 text-[16px] font-semibold text-[#5A6B85] hover:border-[#B9C7DB] disabled:opacity-60"
                                  >
                                    {busy === date.id ? "Saving…" : "Done"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {problem && (
                      <div className="mt-3 rounded-xl bg-[#FEF2F2] px-4 py-3 text-[16px] text-[#B91C1C]">
                        {problem}
                      </div>
                    )}
                  </>
                )}

                {adding && (
                  <form onSubmit={submit} className="space-y-3">
                    <div className="space-y-3 rounded-2xl border border-[#DCE4EE] bg-white p-4">
                      <label className="block">
                        <span className="text-[14px] font-semibold uppercase tracking-wide text-[#7A8AA3]">
                          Deal
                        </span>
                        <input
                          type="text"
                          placeholder="e.g. Topeka Ave"
                          value={form.dealName}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, dealName: e.target.value }))
                          }
                          className="mt-1 w-full rounded-xl border border-[#DCE4EE] px-3 py-2.5 text-[18px] text-[#0F1E33] placeholder:text-[#A3B0C0] focus:border-[#418BFF] focus:outline-none"
                        />
                      </label>

                      <label className="block">
                        <span className="text-[14px] font-semibold uppercase tracking-wide text-[#7A8AA3]">
                          What is it
                        </span>
                        <input
                          type="text"
                          placeholder="e.g. option period ends"
                          value={form.label}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, label: e.target.value }))
                          }
                          className="mt-1 w-full rounded-xl border border-[#DCE4EE] px-3 py-2.5 text-[18px] text-[#0F1E33] placeholder:text-[#A3B0C0] focus:border-[#418BFF] focus:outline-none"
                        />
                      </label>

                      <label className="block">
                        <span className="text-[14px] font-semibold uppercase tracking-wide text-[#7A8AA3]">
                          Date
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
                      {busy === "add" ? "Saving…" : "Add date"}
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
