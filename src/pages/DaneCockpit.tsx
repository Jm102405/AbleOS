import React from "react";
import { motion } from "framer-motion";
import { BellIcon, CheckIcon } from "lucide-react";

type PriorityItem = {
  number: number;
  text: string;
  highlighted?: boolean;
};

const priorityItems: PriorityItem[] = [
  { number: 1, text: "Audit live state vs. handoff claims", highlighted: true },
  { number: 2, text: "Raj's access grants (Deals DB, Main Brain)" },
  { number: 3, text: "Zo's cockpit" },
  { number: 4, text: "Your own cockpit" },
  {
    number: 5,
    text: "Cockpit-to-Deals-DB wiring — blocked until audit confirmed",
  },
];

type KnownGap = {
  label: string;
  status: string;
  tone: "urgent" | "scheduled";
};

const knownGaps: KnownGap[] = [
  { label: "WF-DEAL-12 PSA extractor", status: "Inactive", tone: "urgent" },
  { label: "Cockpit DNS CNAMEs", status: "Wk 2-3", tone: "scheduled" },
];

const reveal = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export function DaneCockpit() {
  return (
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
                D
              </div>
            </div>
          </div>

          <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.14em] text-white/80">
            ABLE OS · Executive workspace
          </p>
          <h1 className="mt-1 text-[32px] font-extrabold leading-tight tracking-[-0.045em] sm:text-[38px] lg:text-[44px]">
            Dane&apos;s Cockpit
          </h1>
          <p className="mt-2 max-w-md text-[13px] font-medium text-white/85 sm:text-[14px]">
            Audit and integration status for Lane 2.
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
                Dane · Integration Lead
              </h2>
              <p className="mt-1 text-[11px] font-medium leading-relaxed text-[#64748B] sm:text-[12px]">
                Audits · Access grants · Main Brain integration
              </p>
            </div>
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
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#3B82C4]">
            Lane 2 · Audit first
          </p>
          <div className="mt-2 flex items-end gap-4">
            <span className="text-[68px] font-extrabold leading-[0.8] tracking-[-0.075em] text-[#418BFF] sm:text-[80px] lg:text-[92px]">
              25
            </span>
            <h2
              className="max-w-[245px] pb-1 text-[14px] font-medium leading-[1.45] text-[#526176] sm:max-w-xs sm:text-[15px] lg:max-w-sm"
              id="queue-heading"
            >
              of 59 workflows to verify against the July 2 handoff before
              anything else.
            </h2>
          </div>

          <div className="mt-7 grid grid-cols-3 gap-2 sm:gap-4 lg:gap-5">
            <InsightCard label="Critical gap" value="1" tone="critical" />
            <InsightCard label="Cockpits queued" value="2" tone="queued" />
            <InsightCard label="Main Brain access" tone="success" />
          </div>
        </motion.section>

        <motion.div
          animate="visible"
          initial="hidden"
          transition={{ delay: 0.16, duration: 0.38, ease: "easeOut" }}
          variants={reveal}
        >
          <div className="lg:grid lg:grid-cols-2 lg:gap-x-10 xl:gap-x-14">
            <section aria-labelledby="priority-heading" className="pt-9">
              <SectionHeading id="priority-heading">
                Your priority order
              </SectionHeading>
              <div className="mt-4 space-y-3">
                {priorityItems.map((item) => (
                  <article
                    className="flex items-center gap-3 rounded-2xl border border-[#DCE4EE] bg-white px-4 py-4 shadow-[0_5px_14px_rgba(30,58,138,0.055)] sm:px-5"
                    key={item.number}
                  >
                    <span
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[12px] font-extrabold ${
                        item.highlighted
                          ? "bg-[#F59E0B] text-white"
                          : "border border-[#1A1A2E]/60 bg-white text-[#1A1A2E]"
                      }`}
                    >
                      {item.number}
                    </span>
                    <p className="text-[13px] font-bold leading-snug text-[#1A1A2E] sm:text-[14px]">
                      {item.text}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <section aria-labelledby="gaps-heading" className="pt-9">
              <SectionHeading id="gaps-heading">Known gaps</SectionHeading>
              <div className="mt-4 overflow-hidden rounded-2xl border border-[#DCE4EE] bg-white shadow-[0_5px_14px_rgba(30,58,138,0.055)]">
                {knownGaps.map((gap) => (
                  <GapItem
                    key={gap.label}
                    label={gap.label}
                    status={gap.status}
                    tone={gap.tone}
                  />
                ))}
              </div>
            </section>
          </div>
        </motion.div>

        <footer className="pt-10 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#8291A5]">
          Mockup · Not live data · Able OS Netlify cockpits
        </footer>
      </main>
    </div>
  );
}

type InsightCardProps = {
  label: string;
  value?: string;
  tone: "critical" | "queued" | "success";
};

function InsightCard({ label, value, tone }: InsightCardProps) {
  const tones = {
    critical: "text-[#FF7832] bg-[#FFF1E9]",
    queued: "text-[#418BFF] bg-[#EEF5FF]",
    success: "text-[#16A34A] bg-[#EAF8EF]",
  };

  return (
    <article className="min-w-0 rounded-2xl border border-[#DCE4EE] bg-white px-3.5 py-4 text-center shadow-[0_4px_12px_rgba(30,58,138,0.045)] sm:px-4 sm:py-5">
      <p
        className={`inline-flex items-center justify-center rounded-lg px-2 py-1 text-[24px] font-extrabold leading-none tracking-[-0.06em] sm:text-[27px] ${tones[tone]}`}
      >
        {tone === "success" ? (
          <CheckIcon aria-hidden="true" size={24} strokeWidth={3} />
        ) : (
          value
        )}
      </p>
      <p className="mt-3 text-[9px] font-extrabold uppercase leading-tight tracking-[0.06em] text-[#718096] sm:text-[10px]">
        {label}
      </p>
    </article>
  );
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

type GapItemProps = {
  label: string;
  status: string;
  tone: "urgent" | "scheduled";
};

function GapItem({ label, status, tone }: GapItemProps) {
  const statusStyle =
    tone === "urgent"
      ? "bg-[#FFF1E9] text-[#D95717]"
      : "bg-[#FEF3C7] text-[#B45309]";

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
