import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeftIcon,
  BanknoteIcon,
  CalendarIcon,
  UserRoundIcon,
  XIcon,
} from "lucide-react";

/** Mirrors the orders table. Both cockpits pass a compatible shape. */
export type OrderLike = {
  id: string;
  order_name: string;
  description: string;
  date_needed: string;
  priority: "Low" | "Normal" | "Urgent";
  estimated_cost: string | number | null;
  requested_by: string;
  status: "Pending" | "Approved" | "Declined";
  created_at: string;
  decided_at?: string | null;
  decided_by?: string | null;
};

const STATUS_STYLES: Record<OrderLike["status"], string> = {
  Pending: "bg-[#FFF6E6] text-[#B4820A]",
  Approved: "bg-[#EAF8EF] text-[#16A34A]",
  Declined: "bg-[#FEE2E2] text-[#DC2626]",
};

const PRIORITY_STYLES: Record<OrderLike["priority"], string> = {
  Low: "bg-[#EEF2F6] text-[#526176]",
  Normal: "bg-[#EEF5FF] text-[#418BFF]",
  Urgent: "bg-[#FFF1E9] text-[#D95717]",
};

function formatDate(value: string | null) {
  if (!value) return "--";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatCost(value: string | number | null) {
  if (value === null || value === undefined || value === "") return "Not given";

  // Postgres numeric arrives as a string over the REST API.
  const amount = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(amount)) return "Not given";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

type OrderDetailModalProps = {
  order: OrderLike | null;
  open: boolean;
  onClose: () => void;
};

export function OrderDetailModal({
  order,
  open,
  onClose,
}: OrderDetailModalProps) {
  React.useEffect(() => {
    if (!open) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && order && (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-end justify-center overflow-hidden bg-[#1A1A2E]/50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:items-center sm:px-4 sm:py-6"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="flex max-h-full w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-[#EEF2F6] shadow-[0_20px_40px_rgba(30,58,138,0.18)]"
            exit={{ opacity: 0, y: 12 }}
            initial={{ opacity: 0, y: 12 }}
            onClick={(event) => event.stopPropagation()}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="shrink-0 border-b border-[#DCE4EE] bg-white px-5 pb-4 pt-4">
              <div className="flex items-center justify-between gap-3">
                <button
                  className="inline-flex items-center gap-1.5 text-[16px] font-medium text-[#3B82C4] transition-colors hover:text-[#2F6FD8]"
                  onClick={onClose}
                  type="button"
                >
                  <ArrowLeftIcon aria-hidden="true" size={18} />
                  Back
                </button>

                <button
                  aria-label="Close"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#93A3B8] transition-colors hover:bg-[#F1F5F9]"
                  onClick={onClose}
                  type="button"
                >
                  <XIcon aria-hidden="true" size={18} />
                </button>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-[14px] font-medium ${STATUS_STYLES[order.status]}`}
                >
                  {order.status}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-[14px] font-medium ${PRIORITY_STYLES[order.priority]}`}
                >
                  {order.priority}
                </span>
              </div>

              <h2 className="mt-2.5 text-[24px] font-semibold leading-[1.25] tracking-[-0.02em] text-[#1A1A2E]">
                {order.order_name}
              </h2>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-[#DCE4EE] bg-white p-4">
                  <span className="text-[#3B82C4]">
                    <CalendarIcon aria-hidden="true" size={17} />
                  </span>
                  <p className="mt-2 text-[16px] font-normal text-[#8291A5]">
                    Needed by
                  </p>
                  <p className="mt-0.5 text-[16px] font-medium text-[#1A1A2E]">
                    {formatDate(order.date_needed)}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#DCE4EE] bg-white p-4">
                  <span className="text-[#3B82C4]">
                    <BanknoteIcon aria-hidden="true" size={17} />
                  </span>
                  <p className="mt-2 text-[16px] font-normal text-[#8291A5]">
                    Estimated cost
                  </p>
                  <p className="mt-0.5 text-[16px] font-medium text-[#1A1A2E]">
                    {formatCost(order.estimated_cost)}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-[#DCE4EE] bg-white p-4">
                <p className="text-[16px] font-medium text-[#5B6B82]">
                  Description
                </p>
                <p className="mt-1.5 whitespace-pre-line text-[18px] font-normal leading-[1.6] text-[#1A1A2E]">
                  {order.description}
                </p>
              </div>

              <div className="rounded-2xl border border-[#DCE4EE] bg-white p-4">
                <span className="text-[#3B82C4]">
                  <UserRoundIcon aria-hidden="true" size={17} />
                </span>
                <p className="mt-2 text-[16px] font-normal text-[#8291A5]">
                  Requested by
                </p>
                <p className="mt-0.5 text-[16px] font-medium text-[#1A1A2E]">
                  {order.requested_by}
                </p>
                <p className="mt-3 text-[16px] font-normal text-[#8291A5]">
                  Sent
                </p>
                <p className="mt-0.5 text-[16px] font-medium text-[#1A1A2E]">
                  {formatDate(order.created_at)}
                </p>
              </div>

              {order.decided_at && (
                <div
                  className={`rounded-2xl border p-4 ${
                    order.status === "Approved"
                      ? "border-[#C9E9E1] bg-[#F1FCF8]"
                      : "border-[#FECACA] bg-[#FEF2F2]"
                  }`}
                >
                  <p
                    className={`text-[16px] font-medium ${
                      order.status === "Approved"
                        ? "text-[#0F766E]"
                        : "text-[#DC2626]"
                    }`}
                  >
                    {order.status} by {order.decided_by ?? "Raj"}
                  </p>
                  <p
                    className={`mt-0.5 text-[16px] font-normal ${
                      order.status === "Approved"
                        ? "text-[#0F766E]"
                        : "text-[#DC2626]"
                    }`}
                  >
                    {formatDate(order.decided_at)}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
