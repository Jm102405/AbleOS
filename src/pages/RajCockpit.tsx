import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BellIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
  XIcon,
} from "lucide-react";

const NOTION_DEALS_URL =
  "https://app.notion.com/p/3a397b1c96b680e8af62f3a34a5c6a02?v=01b686d4bc8c43d6b4eff6ae73afdbc9&source=copy_link";

type ApprovalRequest = {
  title: string;
  detail: string;
};

const approvalRequests: ApprovalRequest[] = [
  {
    title: "Deal-submission form for client automation",
    detail: "Requested by Dane · August 20",
  },
  {
    title: "Landing page for the Able OS website",
    detail: "Requested by Dane · August 18",
  },
];

const reveal = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export function RishiCockpit() {
  const [dealsCount, setDealsCount] = React.useState<number | null>(null);
  const [selectedRequest, setSelectedRequest] =
    React.useState<ApprovalRequest | null>(null);

  React.useEffect(() => {
    fetch("/api/deals-count")
      .then((res) => res.json())
      .then((data) => setDealsCount(data.count))
      .catch((err) => console.error("Failed to fetch deals count:", err));
  }, []);

  return (
    <>
      <div className="min-h-screen w-full bg-[#EEF2F6] text-[#1A1A2E]">
        <header className="bg-gradient-to-r from-[#5EC5E8] to-[#3B82C4] text-white shadow-sm">
          <div className="mx-auto max-w-[428px] px-5 pb-8 pt-5 sm:max-w-2xl sm:px-8 sm:pb-10 sm:pt-6 lg:max-w-5xl lg:px-10 xl:max-w-6xl">
            <div className="flex items-center justify-between">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#1A1A1A] text-lg font-extrabold shadow-sm">
                A
              </div>
              <div className="flex items-center gap-3">
                <button
                  aria-label="View notifications"
                  className="grid h-9 w-9 place-items-center rounded-full bg-white/15 transition-colors hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#3B82C4]"
                  type="button"
                >
                  <BellIcon aria-hidden="true" size={17} strokeWidth={2.25} />
                </button>
                <div className="grid h-9 w-9 place-items-center rounded-full border-2 border-white/70 bg-[#1E3A8A] text-xs font-extrabold">
                  R
                </div>
              </div>
            </div>

            <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.14em] text-white/80">
              ABLE OS · Executive workspace
            </p>
            <h1 className="mt-1 text-[32px] font-extrabold leading-tight tracking-[-0.045em] sm:text-[38px] lg:text-[44px]">
              Rishi&apos;s Cockpit
            </h1>
            <p className="mt-2 max-w-md text-[13px] font-medium text-white/85 sm:text-[14px]">
              A clear view of today&apos;s decisions and operating load.
            </p>
          </div>
        </header>

        <main className="mx-auto max-w-[428px] px-5 pb-10 sm:max-w-2xl sm:px-8 sm:pb-14 lg:max-w-5xl lg:px-10 xl:max-w-6xl">
          <motion.section
            animate="visible"
            aria-labelledby="profile-heading"
            className="relative -mt-4 overflow-hidden rounded-2xl border border-[#DCE4EE] bg-white shadow-[0_8px_20px_rgba(30,58,138,0.08)]"
            initial="hidden"
            transition={{ duration: 0.35, ease: "easeOut" }}
            variants={reveal}
          >
            <div className="absolute inset-y-0 left-0 w-1.5 bg-[#1E3A8A]" />
            <div className="flex items-center justify-between gap-4 px-5 py-4 pl-6 sm:px-7 sm:py-5 sm:pl-8">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#5B6B82]">
                  Personal dashboard
                </p>
                <h2
                  className="mt-1 text-[16px] font-extrabold tracking-[-0.025em] sm:text-[18px]"
                  id="profile-heading"
                >
                  Rishi · CEO
                </h2>
                <p className="mt-1 text-[11px] font-medium leading-relaxed text-[#64748B] sm:text-[12px]">
                  Vision · Acquisitions · Capital · Partnerships
                </p>
              </div>
              <button
                aria-label="Open profile options"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#F1F5F9] text-[#3B82C4] transition-colors hover:bg-[#E3EDF8] focus:outline-none focus:ring-2 focus:ring-[#3B82C4] focus:ring-offset-2"
                type="button"
              >
                <MoreHorizontalIcon aria-hidden="true" size={18} />
              </button>
            </div>
          </motion.section>

          <motion.section
            animate="visible"
            aria-labelledby="queue-heading"
            className="pt-8"
            initial="hidden"
            transition={{ delay: 0.08, duration: 0.35, ease: "easeOut" }}
            variants={reveal}
          >

            <div className="mt-1 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
              <StatCard
                label="Deals in pipe"
                value={dealsCount !== null ? String(dealsCount) : "..."}
                tone="primary"
                href={NOTION_DEALS_URL}
              />
              <StatCard
              label="Gate stalled"
              value="2"
              tone="urgent"
              href="https://drive.google.com/drive/folders/1kCv-jjfoMz4A0VUFikvbb6CTnyAE7WRG"
            />
              <StatCard label="Escalations open" value="0" tone="primary" />
              <StatCard label="AHTX 83(b) election" value="9d" tone="urgent" />  
            </div>
          </motion.section>

          <motion.div
            animate="visible"
            initial="hidden"
            transition={{ delay: 0.16, duration: 0.38, ease: "easeOut" }}
            variants={reveal}
          >
            <div className="lg:grid lg:grid-cols-2 lg:gap-x-10 xl:gap-x-14">
              <div>
                <section aria-labelledby="gates-heading" className="pt-9">
                  <SectionHeading id="gates-heading">
                    Gates awaiting you
                  </SectionHeading>
                  <div className="mt-4 space-y-3">
                    <a
                      href="https://drive.google.com/drive/folders/1GCgpD8uJ1K-84NBkzZNs-ATp1clCUevB?usp=sharing"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-3 rounded-2xl border border-[#DCE4EE] bg-white px-4 py-4 shadow-[0_5px_14px_rgba(30,58,138,0.055)] transition-shadow hover:shadow-[0_6px_16px_rgba(30,58,138,0.09)] sm:px-5"
                    >
                      <div className="h-9 w-1 shrink-0 rounded-full bg-[#1E3A8A]" />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[13px] font-extrabold leading-snug tracking-[-0.015em] text-[#1A1A2E] sm:text-[14px]">
                          HTM Duplex · Side A
                        </h3>
                        <p className="mt-1 text-[11px] font-medium leading-snug text-[#6B7A90] sm:text-[12px]">
                          Phase 2 final stage photo in · Colton → Karen →
                          you
                        </p>
                      </div>
                      <ChevronRightIcon
                        aria-hidden="true"
                        className="shrink-0 text-[#93A3B8] transition-transform group-hover:translate-x-0.5"
                        size={18}
                      />
                    </a>
                    <a
                      href="https://drive.google.com/drive/folders/1FRPLHONtP_SobaVVIPqY9BmeaEgCzuBM?usp=sharing"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-3 rounded-2xl border border-[#DCE4EE] bg-white px-4 py-4 shadow-[0_5px_14px_rgba(30,58,138,0.055)] transition-shadow hover:shadow-[0_6px_16px_rgba(30,58,138,0.09)] sm:px-5"
                    >
                      <div className="h-9 w-1 shrink-0 rounded-full bg-[#1E3A8A]" />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[13px] font-extrabold leading-snug tracking-[-0.015em] text-[#1A1A2E] sm:text-[14px]">
                          HTM Duplex · Side B
                        </h3>
                        <p className="mt-1 text-[11px] font-medium leading-snug text-[#6B7A90] sm:text-[12px]">
                          Phase 2 final stage photo in · Jeremiah → Karen →
                          you
                        </p>
                      </div>
                      <ChevronRightIcon
                        aria-hidden="true"
                        className="shrink-0 text-[#93A3B8] transition-transform group-hover:translate-x-0.5"
                        size={18}
                      />
                    </a>
                  </div>
                </section>

                <section aria-labelledby="escalations-heading" className="pt-9">
                  <SectionHeading id="escalations-heading">
                    Escalations
                  </SectionHeading>
                  <div className="mt-4 rounded-2xl border border-dashed border-[#DCE4EE] bg-[#F8FAFC] px-5 py-4">
                    <p className="text-[12px] font-medium leading-snug text-[#8A99AC]">
                      No active escalations · iMessage reserved for damage,
                      safety, or inspection failures
                    </p>
                  </div>
                </section>

                <section aria-labelledby="approval-heading" className="pt-9">
                  <SectionHeading id="approval-heading">
                    Approval requests
                  </SectionHeading>
                  <div className="mt-4 space-y-3">
                    {approvalRequests.map((request) => (
                      <button
                        type="button"
                        onClick={() => setSelectedRequest(request)}
                        className="group flex w-full items-center gap-3 rounded-2xl border border-[#DCE4EE] bg-white px-4 py-4 text-left shadow-[0_5px_14px_rgba(30,58,138,0.055)] transition-shadow hover:shadow-[0_6px_16px_rgba(30,58,138,0.09)] sm:px-5"
                        key={request.title}
                      >
                        <div className="h-9 w-1 shrink-0 rounded-full bg-[#1E3A8A]" />
                        <div className="min-w-0 flex-1">
                          <h3 className="text-[13px] font-extrabold leading-snug tracking-[-0.015em] text-[#1A1A2E] sm:text-[14px]">
                            {request.title}
                          </h3>
                          <p className="mt-1 text-[11px] font-medium leading-snug text-[#6B7A90] sm:text-[12px]">
                            {request.detail}
                          </p>
                        </div>
                        <ChevronRightIcon
                          aria-hidden="true"
                          className="shrink-0 text-[#93A3B8] transition-transform group-hover:translate-x-0.5"
                          size={18}
                        />
                      </button>
                    ))}
                  </div>
                </section>
              </div>

              <div>
                <section aria-labelledby="karen-heading" className="pt-9">
                  <SectionHeading id="karen-heading">
                    Karen&apos;s load
                  </SectionHeading>
                  <article className="mt-4 rounded-2xl border border-[#DCE4EE] bg-white p-5 shadow-[0_5px_14px_rgba(30,58,138,0.055)]">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-[15px] font-extrabold tracking-[-0.02em]">
                          Karen Grant
                        </h3>
                        <p className="mt-1 text-[11px] font-medium text-[#6B7A90]">
                          Current weekly allocation
                        </p>
                      </div>
                      <p className="shrink-0 text-right">
                        <span className="text-[25px] font-extrabold tracking-[-0.05em] text-[#418BFF]">
                          32
                        </span>
                        <span className="ml-1 text-[11px] font-bold text-[#6B7A90]">
                          / 40 hrs
                        </span>
                      </p>
                    </div>
                    <div
                      aria-label="Karen's capacity: 32 of 40 hours"
                      aria-valuemax={40}
                      aria-valuemin={0}
                      aria-valuenow={32}
                      className="mt-5 h-2.5 overflow-hidden rounded-full bg-[#E8EDF3]"
                      role="progressbar"
                    >
                      <motion.div
                        animate={{ width: "80%" }}
                        className="h-full rounded-full bg-[#3B82C4]"
                        initial={{ width: 0 }}
                        transition={{
                          delay: 0.38,
                          duration: 0.55,
                          ease: "easeOut",
                        }}
                      />
                    </div>
                    <div className="mt-3 flex justify-between text-[10px] font-bold uppercase tracking-[0.09em] text-[#8A99AC]">
                      <span>Available</span>
                      <span>8 hours</span>
                    </div>
                  </article>
                </section>

                <section aria-labelledby="open-items-heading" className="pt-9">
                  <SectionHeading id="open-items-heading">
                    Open items
                  </SectionHeading>
                  <div className="mt-4 overflow-hidden rounded-2xl border border-[#DCE4EE] bg-white shadow-[0_5px_14px_rgba(30,58,138,0.055)]">
                    <OpenItem
                      label={
                        <>
                          AHTX 83(b) election, July 30{" "}
                          <span className="text-[#D95717]">(9 days out)</span>
                        </>
                      }
                      status="Jul 30"
                      tone="urgent"
                    />
                  </div>
                </section>
              </div>
            </div>
          </motion.div>

          <footer className="pt-10 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#8291A5]">
            Able OS · V1 Build
          </footer>
        </main>
      </div>

      <ApprovalModal
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
        onApprove={() => setSelectedRequest(null)}
        onDecline={() => setSelectedRequest(null)}
      />
    </>
  );
}

type StatCardProps = {
  value: string;
  label: string;
  tone: "primary" | "urgent";
  href?: string;
};

function StatCard({ value, label, tone, href }: StatCardProps) {
  const tones = {
    primary: "text-[#418BFF] bg-[#EEF5FF]",
    urgent: "text-[#FF7832] bg-[#FFF1E9]",
  };

  const content = (
    <>
      <p
        className={`inline-flex rounded-lg px-2 py-1 text-[24px] font-extrabold leading-none tracking-[-0.06em] sm:text-[27px] ${tones[tone]}`}
      >
        {value}
      </p>
      <p className="mt-3 text-[9px] font-extrabold uppercase leading-tight tracking-[0.06em] text-[#718096] sm:text-[10px]">
        {label}
      </p>
    </>
  );

  const baseClasses =
    "min-w-0 rounded-2xl border border-[#DCE4EE] bg-white px-3.5 py-4 shadow-[0_4px_12px_rgba(30,58,138,0.045)] sm:px-4 sm:py-5";

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${baseClasses} block cursor-pointer transition-shadow hover:shadow-[0_6px_16px_rgba(30,58,138,0.09)]`}
      >
        {content}
      </a>
    );
  }

  return <article className={baseClasses}>{content}</article>;
}

type SectionHeadingProps = {
  id: string;
  children: React.ReactNode;
};

function SectionHeading({ id, children }: SectionHeadingProps) {
  return (
    <h2
      className="text-[19px] font-extrabold leading-none tracking-[-0.035em] text-[#1A1A2E] sm:text-[21px]"
      id={id}
    >
      {children}
    </h2>
  );
}

type OpenItemProps = {
  label: React.ReactNode;
  status: string;
  tone: "urgent" | "neutral";
};

function OpenItem({ label, status, tone }: OpenItemProps) {
  const statusStyle =
    tone === "urgent"
      ? "bg-[#FFF1E9] text-[#D95717]"
      : "bg-[#EEF2F6] text-[#526176]";

  return (
    <div className="flex items-center justify-between gap-3 border-b border-[#E6ECF2] px-5 py-4 last:border-b-0">
      <p className="text-[13px] font-bold text-[#1A1A2E]">{label}</p>
      <span
        className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold tracking-wide ${statusStyle}`}
      >
        {status}
      </span>
    </div>
  );
}

type ApprovalModalProps = {
  request: ApprovalRequest | null;
  onClose: () => void;
  onApprove: () => void;
  onDecline: () => void;
};

function ApprovalModal({
  request,
  onClose,
  onApprove,
  onDecline,
}: ApprovalModalProps) {
  return (
    <AnimatePresence>
      {request && (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A2E]/50 px-5"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-[0_20px_40px_rgba(30,58,138,0.18)]"
            exit={{ opacity: 0, y: 12 }}
            initial={{ opacity: 0, y: 12 }}
            onClick={(event) => event.stopPropagation()}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="flex items-start justify-between gap-4">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#5B6B82]">
                Approval request
              </p>
              <button
                aria-label="Close"
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[#93A3B8] transition-colors hover:bg-[#F1F5F9]"
                onClick={onClose}
                type="button"
              >
                <XIcon aria-hidden="true" size={16} />
              </button>
            </div>

            <h3 className="mt-2 text-[16px] font-extrabold leading-snug tracking-[-0.02em] text-[#1A1A2E]">
              {request?.title}
            </h3>
            <p className="mt-1 text-[12px] font-medium leading-snug text-[#6B7A90]">
              {request?.detail}
            </p>

            <div className="mt-6 flex gap-3">
              <button
                className="flex-1 rounded-xl border border-[#DCE4EE] px-4 py-2.5 text-[12px] font-extrabold uppercase tracking-wide text-[#526176] transition-colors hover:bg-[#F1F5F9]"
                onClick={onDecline}
                type="button"
              >
                Decline
              </button>
              <button
                className="flex-1 rounded-xl bg-[#16A34A] px-4 py-2.5 text-[12px] font-extrabold uppercase tracking-wide text-white transition-colors hover:bg-[#15803D]"
                onClick={onApprove}
                type="button"
              >
                Approve
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
