import React from "react";
import { motion } from "framer-motion";
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  CircleAlertIcon,
  Clock3Icon,
  FileCheck2Icon,
  FileTextIcon,
  Link2Icon,
  UserRoundIcon,
  XIcon,
} from "lucide-react";
import type { Deal, DealDocument, DocumentStatus } from "./types";

type DealDetailProps = {
  deal: Deal;
  onClose: () => void;
};

export function DealDetail({ deal, onClose }: DealDetailProps) {
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
            {deal.stage}
          </p>
          <h2
            className="mt-1 text-[26px] font-extrabold leading-tight tracking-[-0.045em]"
            id="deal-detail-title"
          >
            {deal.property}
          </h2>
          <div className="mt-3 flex items-center justify-between gap-4">
            <p className="text-[12px] font-medium text-[#64748B]">
              {deal.market}
            </p>
            <p className="text-[22px] font-extrabold tracking-[-0.05em] text-[#1E3A8A]">
              {deal.value}
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <DetailStat
              icon={<UserRoundIcon aria-hidden="true" size={15} />}
              label="Bird dog"
              value={deal.birdDog}
            />
            <DetailStat
              icon={<Clock3Icon aria-hidden="true" size={15} />}
              label="In this stage"
              value={`${deal.daysInStage} day${deal.daysInStage === 1 ? "" : "s"}`}
            />
          </div>

          <section aria-labelledby="missing-docs-title" className="mt-7">
            <DetailHeading
              icon={<CircleAlertIcon aria-hidden="true" size={17} />}
              id="missing-docs-title"
            >
              Document gaps
            </DetailHeading>

            {deal.missingDocs.length > 0 ? (
              <div className="mt-3 rounded-2xl border border-[#FED7BE] bg-[#FFF8F4] p-4">
                <p className="text-[11px] font-bold leading-relaxed text-[#B94A18]">
                  This deal cannot advance until these are received.
                </p>
                <ul aria-label="Missing documents" className="mt-3 space-y-2">
                  {deal.missingDocs.map((document) => (
                    <li
                      className="flex items-center gap-2 text-[12px] font-bold text-[#733614]"
                      key={document}
                    >
                      <span
                        aria-hidden="true"
                        className="h-1.5 w-1.5 rounded-full bg-[#FF7832]"
                      />
                      {document}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="mt-3 flex items-center gap-2.5 rounded-2xl border border-[#C9E9E1] bg-[#F1FCF8] px-4 py-3.5 text-[12px] font-bold text-[#0F766E]">
                <CheckCircle2Icon aria-hidden="true" size={17} />
                No outstanding documents
              </div>
            )}
          </section>

          <section aria-labelledby="documents-title" className="mt-7">
            <DetailHeading
              icon={<FileTextIcon aria-hidden="true" size={17} />}
              id="documents-title"
            >
              Deal documents
            </DetailHeading>
            <div className="mt-3 overflow-hidden rounded-2xl border border-[#DCE4EE] bg-white">
              {deal.documents.map((document) => (
                <DocumentRow document={document} key={document.name} />
              ))}
            </div>
          </section>

          <section aria-labelledby="history-title" className="mt-7">
            <DetailHeading
              icon={<Clock3Icon aria-hidden="true" size={17} />}
              id="history-title"
            >
              History
            </DetailHeading>
            <ol aria-label="Deal activity history" className="mt-4 space-y-0">
              {deal.history.map((event, index) => (
                <li
                  className="relative flex gap-3 pb-5 last:pb-0"
                  key={event.date}
                >
                  {index < deal.history.length - 1 ? (
                    <span
                      aria-hidden="true"
                      className="absolute left-[7px] top-4 h-[calc(100%-4px)] w-px bg-[#CBD5E1]"
                    />
                  ) : null}
                  <span
                    aria-hidden="true"
                    className="mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-[3px] border-[#DCE9FC] bg-[#3B82C4]"
                  />
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.06em] text-[#8291A5]">
                      {event.date}
                    </p>
                    <h3 className="mt-1 text-[12px] font-extrabold">
                      {event.title}
                    </h3>
                    <p className="mt-1 text-[11px] font-medium leading-relaxed text-[#64748B]">
                      {event.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
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

function DocumentRow({ document }: { document: DealDocument }) {
  const styles: Record<DocumentStatus, string> = {
    Complete: "bg-[#EDF8F5] text-[#0F766E]",
    Generated: "bg-[#F0EDFF] text-[#5B44BE]",
    Missing: "bg-[#FFF1E9] text-[#D95717]",
  };

  const icon =
    document.status === "Generated" ? (
      <FileCheck2Icon aria-hidden="true" size={16} />
    ) : document.status === "Missing" ? (
      <CircleAlertIcon aria-hidden="true" size={16} />
    ) : (
      <Link2Icon aria-hidden="true" size={16} />
    );

  return (
    <div className="flex items-center justify-between gap-3 border-b border-[#E6ECF2] px-4 py-3.5 last:border-b-0">
      <span className="flex min-w-0 items-center gap-2.5 text-[12px] font-bold text-[#1A1A2E]">
        <span className="shrink-0 text-[#718096]">{icon}</span>
        {document.name}
      </span>
      <span
        className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-extrabold uppercase tracking-[0.04em] ${styles[document.status]}`}
      >
        {document.status}
      </span>
    </div>
  );
}
