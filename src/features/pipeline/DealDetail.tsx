import React from "react";
import { motion } from "framer-motion";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  Clock3Icon,
  LoaderIcon,
  MapPinIcon,
  StickyNoteIcon,
  UserRoundIcon,
  XIcon,
} from "lucide-react";
import { DEAL_STAGES, STAGE_LABELS, type Deal, type DealStage } from "./types";

type DealDetailProps = {
  deal: Deal;
  moving: boolean;
  onClose: () => void;
  onMove: (id: string, stage: DealStage) => void;
};

function timeLabel(days: number | null) {
  if (days === null) return "Not moved yet";
  if (days === 0) return "Moved today";
  return `${days} day${days === 1 ? "" : "s"}`;
}

export function DealDetail({ deal, moving, onClose, onMove }: DealDetailProps) {
  const [nextStage, setNextStage] = React.useState<DealStage>(deal.stage);

  // Reset the picker whenever a different deal is opened, or after a move.
  React.useEffect(() => {
    setNextStage(deal.stage);
  }, [deal.id, deal.stage]);

  const unchanged = nextStage === deal.stage;

  return (
    <motion.div
      animate={{ opacity: 1 }}
      aria-labelledby="deal-detail-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end bg-[#10203B]/45 sm:items-center sm:justify-center"
      exit={{ opacity: 0 }}
      initial={{ opacity: 0 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="dialog"
    >
      <motion.div
        animate={{ y: 0 }}
        className="max-h-[90vh] w-full max-w-[428px] overflow-y-auto rounded-t-3xl bg-[#EEF2F6] shadow-2xl sm:rounded-3xl"
        exit={{ y: 30 }}
        initial={{ y: 30 }}
        transition={{ duration: 0.24, ease: "easeOut" }}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#DCE4EE] bg-white px-5 py-4">
          <button
            className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.07em] text-[#3B82C4] focus:outline-none focus:ring-2 focus:ring-[#3B82C4] focus:ring-offset-2"
            onClick={onClose}
            type="button"
          >
            <ArrowLeftIcon aria-hidden="true" size={16} />
            Pipeline
          </button>
          <button
            aria-label="Close deal details"
            className="grid h-9 w-9 place-items-center rounded-full bg-[#F1F5F9] text-[#526176] transition-colors hover:bg-[#E3EDF8] focus:outline-none focus:ring-2 focus:ring-[#3B82C4]"
            onClick={onClose}
            type="button"
          >
            <XIcon aria-hidden="true" size={18} />
          </button>
        </div>

        <div className="px-5 pb-8 pt-6">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#3B82C4]">
            {STAGE_LABELS[deal.stage]}
          </p>
          <h2
            className="mt-1 text-[26px] font-extrabold leading-tight tracking-[-0.045em]"
            id="deal-detail-title"
          >
            {deal.name}
          </h2>
          <p className="mt-3 flex items-start gap-1.5 text-[12px] font-medium text-[#64748B]">
            <MapPinIcon
              aria-hidden="true"
              className="mt-0.5 shrink-0"
              size={14}
            />
            {deal.address || "No address recorded"}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <DetailStat
              icon={<UserRoundIcon aria-hidden="true" size={15} />}
              label="Deal source"
              value={deal.source}
            />
            <DetailStat
              icon={<Clock3Icon aria-hidden="true" size={15} />}
              label="In this stage"
              value={timeLabel(deal.daysInStage)}
            />
          </div>

          {deal.movedBy ? (
            <p className="mt-3 text-[11px] font-medium text-[#8291A5]">
              Last moved by{" "}
              <span className="font-extrabold capitalize text-[#526176]">
                {deal.movedBy}
              </span>
            </p>
          ) : null}

          <section aria-labelledby="move-title" className="mt-7">
            <DetailHeading
              icon={<ArrowRightIcon aria-hidden="true" size={17} />}
              id="move-title"
            >
              Move this deal
            </DetailHeading>

            <div className="mt-3 rounded-2xl border border-[#DCE4EE] bg-white p-4">
              <label className="block" htmlFor="deal-stage-select">
                <span className="text-[9px] font-extrabold uppercase tracking-[0.08em] text-[#8291A5]">
                  New stage
                </span>
                <select
                  className="mt-1.5 w-full rounded-xl border border-[#DCE4EE] bg-[#F8FAFC] px-3 py-2.5 text-[13px] font-bold text-[#1A1A2E] outline-none transition-colors focus:border-[#1E3A8A] focus:bg-white"
                  disabled={moving}
                  id="deal-stage-select"
                  onChange={(event) =>
                    setNextStage(event.target.value as DealStage)
                  }
                  value={nextStage}
                >
                  {DEAL_STAGES.map((stage) => (
                    <option key={stage} value={stage}>
                      {STAGE_LABELS[stage]}
                    </option>
                  ))}
                </select>
              </label>

              <button
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#1E3A8A] px-3 py-2.5 text-[11px] font-extrabold uppercase tracking-wide text-white transition-colors hover:bg-[#172F6E] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={moving || unchanged}
                onClick={() => onMove(deal.id, nextStage)}
                type="button"
              >
                {moving ? (
                  <LoaderIcon
                    className="animate-spin"
                    size={13}
                    strokeWidth={2.5}
                  />
                ) : null}
                {unchanged ? "Already in this stage" : "Move deal"}
              </button>
            </div>
          </section>

          <section aria-labelledby="notes-title" className="mt-7">
            <DetailHeading
              icon={<StickyNoteIcon aria-hidden="true" size={17} />}
              id="notes-title"
            >
              Notes from Notion
            </DetailHeading>
            <div className="mt-3 rounded-2xl border border-[#DCE4EE] bg-white px-4 py-3.5">
              <p className="text-[12px] font-medium leading-relaxed text-[#526176]">
                {deal.notes || "No notes recorded."}
              </p>
              {deal.category ? (
                <span className="mt-3 inline-block rounded-full bg-[#F1F5F9] px-2 py-1 text-[9px] font-extrabold uppercase tracking-[0.06em] text-[#8291A5]">
                  {deal.category}
                </span>
              ) : null}
            </div>
          </section>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Local helpers ──────────────────────────────────────── */

function DetailStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[#DCE4EE] bg-white p-3.5 shadow-[0_4px_10px_rgba(30,58,138,0.035)]">
      <span className="text-[#3B82C4]">{icon}</span>
      <p className="mt-2 text-[9px] font-extrabold uppercase tracking-[0.08em] text-[#8291A5]">
        {label}
      </p>
      <p className="mt-1 text-[12px] font-extrabold text-[#1A1A2E]">{value}</p>
    </div>
  );
}

function DetailHeading({
  children,
  icon,
  id,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  id: string;
}) {
  return (
    <h2
      className="flex items-center gap-2 text-[16px] font-extrabold tracking-[-0.025em]"
      id={id}
    >
      <span className="text-[#3B82C4]">{icon}</span>
      {children}
    </h2>
  );
}
