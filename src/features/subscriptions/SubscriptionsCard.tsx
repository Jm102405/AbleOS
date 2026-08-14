// src/features/subscriptions/SubscriptionsCard.tsx
// What the company pays for. The count on the card is only the things
// that need doing - a card showing "12" when nothing is wrong trains
// people to ignore it.

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CreditCardIcon, ExternalLinkIcon, XIcon } from "lucide-react";
import { NavCard } from "../../components/NavCard";
import { FilterMenu, type FilterOption } from "../../components/FilterMenu";
import { apiFetch } from "../../lib/apiFetch";

type Status =
  | "active"
  | "renewal_due"
  | "payment_failed"
  | "expired"
  | "cancelled"
  | "trial";

type Subscription = {
  id: string;
  vendor: string;
  plan: string | null;
  amount: string | number | null;
  currency: string | null;
  billing_cycle: string | null;
  status: Status;
  renews_at: string | null;
  last_paid_at: string | null;
  invoice_url: string | null;
  notes: string | null;
  email_from: string | null;
  email_subject: string | null;
  email_received_at: string | null;
  email_count: number;
};

const LABELS: Record<Status, string> = {
  active: "Active",
  renewal_due: "Renewal due",
  payment_failed: "Payment failed",
  expired: "Expired",
  cancelled: "Cancelled",
  trial: "Trial",
};

/** Red demands action today, amber this week, green is fine. */
const TONES: Record<Status, string> = {
  payment_failed: "bg-[#DC2626] text-white",
  expired: "bg-[#DC2626] text-white",
  renewal_due: "bg-[#D97706] text-white",
  trial: "bg-[#418BFF] text-white",
  active: "bg-[#16A34A] text-white",
  cancelled: "bg-[#94A3B8] text-white",
};

const BARS: Record<Status, string> = {
  payment_failed: "bg-[#DC2626]",
  expired: "bg-[#DC2626]",
  renewal_due: "bg-[#D97706]",
  trial: "bg-[#418BFF]",
  active: "bg-[#16A34A]",
  cancelled: "bg-[#94A3B8]",
};

/** These are the ones somebody has to do something about. */
const NEEDS_ACTION: Status[] = ["payment_failed", "expired", "renewal_due"];

type Filter = "needs_action" | "all" | Status;

function money(sub: Subscription) {
  if (sub.amount === null) return null;

  const value = Number(sub.amount);
  if (!Number.isFinite(value)) return null;

  const formatted = value.toLocaleString(undefined, {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });

  const cycle =
    sub.billing_cycle === "monthly"
      ? "/mo"
      : sub.billing_cycle === "annual"
        ? "/yr"
        : sub.billing_cycle === "quarterly"
          ? "/qtr"
          : "";

  return `${sub.currency || "USD"} ${formatted}${cycle}`;
}

function when(date: string | null, prefix: string) {
  if (!date) return null;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;
  return `${prefix} ${parsed.toLocaleDateString()}`;
}

export function SubscriptionsCard() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("needs_action");
  const [active, setActive] = useState<Subscription | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch("/api/subscriptions");

      if (!res.ok) {
        setError("Could not load subscriptions");
        setSubs([]);
        return;
      }

      const body = await res.json();
      setSubs(Array.isArray(body.subscriptions) ? body.subscriptions : []);
    } catch {
      setError("Could not reach the server");
      setSubs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const needsAction = useMemo(
    () => subs.filter((s) => NEEDS_ACTION.includes(s.status)),
    [subs],
  );

  const options: FilterOption<Filter>[] = useMemo(() => {
    const count = (status: Status) =>
      subs.filter((s) => s.status === status).length;

    return [
      { key: "needs_action", label: "Needs action", count: needsAction.length },
      { key: "all", label: "Everything", count: subs.length },
      { key: "active", label: "Active", count: count("active") },
      { key: "trial", label: "Trial", count: count("trial") },
      { key: "cancelled", label: "Cancelled", count: count("cancelled") },
    ];
  }, [subs, needsAction.length]);

  const visible = useMemo(() => {
    if (filter === "needs_action") return needsAction;
    if (filter === "all") return subs;
    return subs.filter((s) => s.status === filter);
  }, [subs, needsAction, filter]);

  return (
    <>
      <NavCard
        icon={<CreditCardIcon aria-hidden="true" size={17} strokeWidth={2.5} />}
        title="Subscriptions"
        subtitle="Renewals, invoices and failed payments"
        count={loading ? null : needsAction.length}
        tone={needsAction.length > 0 ? "orange" : "green"}
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
                      What we pay for
                    </p>
                    <h2 className="mt-1 text-[20px] font-bold text-[#0F1E33]">
                      {active
                        ? active.vendor
                        : needsAction.length === 0
                          ? "Nothing needs you"
                          : `${needsAction.length} need${needsAction.length === 1 ? "s" : ""} attention`}
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
                          {filter === "needs_action"
                            ? "Everything is paid and current"
                            : "Nothing here"}
                        </p>
                        <p className="mt-1 text-[16px] text-[#8291A5]">
                          Renewal notices and invoices to able@ land here.
                        </p>
                      </div>
                    )}

                    {!loading && !error && visible.length > 0 && (
                      <div className="space-y-3">
                        {visible.map((sub) => (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => setActive(sub)}
                            className="flex w-full overflow-hidden rounded-2xl border border-[#DCE4EE] bg-white text-left transition hover:border-[#B9C7DB]"
                          >
                            <span
                              className={`w-1.5 shrink-0 ${BARS[sub.status]}`}
                              aria-hidden="true"
                            />

                            <span className="min-w-0 flex-1 px-4 py-3.5">
                              <span className="flex items-start justify-between gap-3">
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-[18px] font-semibold text-[#0F1E33]">
                                    {sub.vendor}
                                    {sub.plan ? ` · ${sub.plan}` : ""}
                                  </span>
                                  <span className="mt-0.5 block truncate text-[16px] text-[#5A6B85]">
                                    {money(sub) ?? "Amount not stated"}
                                  </span>
                                </span>

                                <span
                                  className={`shrink-0 rounded-full px-2.5 py-1 text-[14px] font-semibold ${TONES[sub.status]}`}
                                >
                                  {LABELS[sub.status]}
                                </span>
                              </span>

                              <span className="mt-2 block text-[14px] text-[#7A8AA3]">
                                {when(sub.renews_at, "Renews") ??
                                  when(sub.last_paid_at, "Last paid") ??
                                  "No date given"}
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
                        className={`inline-block rounded-full px-2.5 py-1 text-[14px] font-semibold ${TONES[active.status]}`}
                      >
                        {LABELS[active.status]}
                      </span>

                      <dl className="mt-3 space-y-2 text-[16px]">
                        {[
                          ["Plan", active.plan],
                          ["Cost", money(active)],
                          ["Renews", when(active.renews_at, "")],
                          ["Last paid", when(active.last_paid_at, "")],
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

                      {active.invoice_url && (
                        <a
                          href={active.invoice_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex items-center gap-1.5 text-[16px] font-semibold text-[#418BFF] underline"
                        >
                          Open the invoice
                          <ExternalLinkIcon aria-hidden="true" size={14} />
                        </a>
                      )}
                    </div>

                    {active.notes && (
                      <div className="rounded-2xl border border-[#DCE4EE] bg-white p-4">
                        <div className="text-[14px] font-semibold uppercase tracking-wide text-[#7A8AA3]">
                          Notes
                        </div>
                        <p className="mt-2 whitespace-pre-line text-[16px] leading-relaxed text-[#3A4A62]">
                          {active.notes}
                        </p>
                      </div>
                    )}

                    <div className="rounded-2xl border border-[#DCE4EE] bg-white p-4 text-[14px] text-[#7A8AA3]">
                      From {active.email_from || "email"} · {active.email_count}{" "}
                      email
                      {active.email_count === 1 ? "" : "s"}
                      {active.email_subject ? ` · ${active.email_subject}` : ""}
                    </div>
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
